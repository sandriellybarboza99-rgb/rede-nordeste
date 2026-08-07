package com.semeia_nordeste.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.semeia_nordeste.backend.dto.AtualizarMeRequest;
import com.semeia_nordeste.backend.dto.UsuarioRegistroRequest;
import com.semeia_nordeste.backend.exception.BusinessException;
import com.semeia_nordeste.backend.exception.ForbiddenException;
import com.semeia_nordeste.backend.exception.UnauthorizedException;
import com.semeia_nordeste.backend.model.TipoPerfil;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository repository, BCryptPasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario registrar(UsuarioRegistroRequest request) {
        // Bloqueio crítico: auto-registro de ADMIN não é permitido.
        // Why: evitar privilege escalation — ADMIN só é criado via seed no banco
        // ou por outro ADMIN autenticado (endpoint dedicado, ainda a ser criado).
        if (request.tipoPerfil() == TipoPerfil.ADMIN)
            throw new ForbiddenException("Não é permitido auto-registro como ADMIN.");

        if (repository.existsByEmail(request.email()))
            throw new BusinessException("E-mail já cadastrado.");

        if (repository.existsByCpfCnpj(request.cpfCnpj()))
            throw new BusinessException("CPF/CNPJ já cadastrado.");

        if (repository.existsByTelefone(request.telefone()))
            throw new BusinessException("Telefone já cadastrado.");

        Usuario usuario = new Usuario();
        usuario.setNomeCompleto(request.nomeCompleto());
        usuario.setCpfCnpj(request.cpfCnpj());
        usuario.setTelefone(request.telefone());
        usuario.setEmail(request.email());
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setTipoPerfil(request.tipoPerfil());
        usuario.setGenero(request.genero());
        usuario.setContaAtiva(true);

        return repository.save(usuario);
    }

    public Usuario autenticar(String email, String senhaPura) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("E-mail ou senha incorretos."));

        if (Boolean.FALSE.equals(usuario.getContaAtiva()))
            throw new ForbiddenException("Conta inativa. Entre em contato com o suporte.");

        if (!passwordEncoder.matches(senhaPura, usuario.getSenhaHash()))
            throw new UnauthorizedException("E-mail ou senha incorretos."); // mensagem genérica de propósito

        return usuario;
    }

    /**
     * Atualiza dados do próprio usuário logado.
     *
     * Regras:
     *  • cpfCnpj e tipoPerfil NÃO são alteráveis aqui (anti-fraude / anti-escalation).
     *  • E-mail e telefone, se mudarem, são verificados quanto a unicidade.
     *  • Para alterar senha, é OBRIGATÓRIO fornecer senhaAtual válida.
     *  • Campos null/blank são ignorados (PATCH parcial).
     */
    @Transactional
    public Usuario atualizarMe(Usuario usuario, AtualizarMeRequest req) {
        if (req.nomeCompleto() != null && !req.nomeCompleto().isBlank()) {
            usuario.setNomeCompleto(req.nomeCompleto().trim());
        }

        if (req.email() != null && !req.email().isBlank()
                && !req.email().equalsIgnoreCase(usuario.getEmail())) {
            if (repository.existsByEmail(req.email()))
                throw new BusinessException("E-mail já cadastrado.");
            usuario.setEmail(req.email().trim().toLowerCase());
        }

        if (req.telefone() != null && !req.telefone().isBlank()
                && !req.telefone().equals(usuario.getTelefone())) {
            if (repository.existsByTelefone(req.telefone()))
                throw new BusinessException("Telefone já cadastrado.");
            usuario.setTelefone(req.telefone().trim());
        }

        if (req.fotoPerfilUrl() != null) {
            // permite limpar passando string vazia
            usuario.setFotoPerfilUrl(req.fotoPerfilUrl().isBlank() ? null : req.fotoPerfilUrl());
        }

        if (req.novaSenha() != null && !req.novaSenha().isBlank()) {
            if (req.senhaAtual() == null || req.senhaAtual().isBlank())
                throw new BusinessException("Informe a senha atual para alterar a senha.");
            if (!passwordEncoder.matches(req.senhaAtual(), usuario.getSenhaHash()))
                throw new BusinessException("Senha atual incorreta.");
            usuario.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
        }

        return repository.save(usuario);
    }
}
