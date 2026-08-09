package com.semeia_nordeste.backend.controller;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.semeia_nordeste.backend.config.TokenService;
import com.semeia_nordeste.backend.dto.AtualizarMeRequest;
import com.semeia_nordeste.backend.dto.AuthResponse;
import com.semeia_nordeste.backend.dto.LoginRequest;
import com.semeia_nordeste.backend.dto.RefreshRequest;
import com.semeia_nordeste.backend.dto.UsuarioRegistroRequest;
import com.semeia_nordeste.backend.dto.UsuarioResponse;
import com.semeia_nordeste.backend.exception.UnauthorizedException;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.repository.UsuarioRepository;
import com.semeia_nordeste.backend.service.SessaoService;
import com.semeia_nordeste.backend.service.UsuarioService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService service;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private SessaoService sessaoService;

    @PostMapping("/registrar")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody UsuarioRegistroRequest request) {
        Usuario salvo = service.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.fromEntity(salvo));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        Usuario usuario = service.autenticar(request.email(), request.senha());

        String accessToken = tokenService.gerarAccessToken(usuario);
        String refreshToken = tokenService.gerarRefreshToken(usuario);

        // Persiste a sessão para podermos revogar depois (logout/troca de senha/admin).
        sessaoService.criar(usuario, refreshToken, httpRequest);

        // Marca último login
        usuario.setDataUltimoLogin(OffsetDateTime.now());
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(new AuthResponse(
                accessToken,
                refreshToken,
                usuario.getNomeCompleto(),
                usuario.getEmail(),
                usuario.getTipoPerfil(),
                usuario.getGenero()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest httpRequest) {
        String email = tokenService.validarRefreshToken(request.refreshToken());
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado."));

        String novoAccess = tokenService.gerarAccessToken(usuario);
        String novoRefresh = tokenService.gerarRefreshToken(usuario);

        // Rotaciona — revoga o token antigo, persiste o novo. Lança 401 se a sessão estava revogada.
        sessaoService.rotacionar(request.refreshToken(), novoRefresh, usuario, httpRequest);

        return ResponseEntity.ok(new AuthResponse(
                novoAccess,
                novoRefresh,
                usuario.getNomeCompleto(),
                usuario.getEmail(),
                usuario.getTipoPerfil(),
                usuario.getGenero()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest request) {
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            sessaoService.revogarPorToken(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(UsuarioResponse.fromEntity(usuario));
    }

    @PatchMapping("/me")
    public ResponseEntity<UsuarioResponse> atualizarMe(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody AtualizarMeRequest request) {
        Usuario atualizado = service.atualizarMe(usuario, request);
        return ResponseEntity.ok(UsuarioResponse.fromEntity(atualizado));
    }
}
