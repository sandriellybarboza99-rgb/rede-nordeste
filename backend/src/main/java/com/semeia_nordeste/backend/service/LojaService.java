package com.semeia_nordeste.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.semeia_nordeste.backend.dto.EmpreendedoraRequest;
import com.semeia_nordeste.backend.dto.EnderecoLojaRequest;
import com.semeia_nordeste.backend.dto.LojaRequest;
import com.semeia_nordeste.backend.exception.BusinessException;
import com.semeia_nordeste.backend.exception.NotFoundException;
import com.semeia_nordeste.backend.model.EnderecoLoja;
import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.repository.EnderecoLojaRepository;
import com.semeia_nordeste.backend.repository.LojaRepository;

@Service
public class LojaService {

    private final LojaRepository lojaRepository;
    private final EnderecoLojaRepository enderecoLojaRepository;

    public LojaService(LojaRepository lojaRepository, EnderecoLojaRepository enderecoLojaRepository) {
        this.lojaRepository = lojaRepository;
        this.enderecoLojaRepository = enderecoLojaRepository;
    }

    @Transactional
    public Loja criar(LojaRequest request, Usuario usuario) {
        if (lojaRepository.existsByUsuarioId(usuario.getId()))
            throw new BusinessException("Você já possui uma loja cadastrada.");

        if (lojaRepository.existsByNomeLoja(request.nomeLoja()))
            throw new BusinessException("Já existe uma loja com esse nome.");

        Loja loja = new Loja();
        loja.setVerificada(false);
        loja.setSuspensa(false);
        return salvarDados(loja, request, usuario);
    }

    @Transactional
    public Loja atualizar(LojaRequest request, Usuario usuario) {
        Loja loja = lojaRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));
        return salvarDados(loja, request, usuario);
    }

    public Loja buscarPorUsuario(Usuario usuario) {
        return lojaRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));
    }

    public Loja buscarPorId(Long id) {
        return lojaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));
    }

    private Loja salvarDados(Loja loja, LojaRequest request, Usuario usuario) {
        loja.setUsuario(usuario);
        loja.setNomeLoja(request.nomeLoja());
        loja.setDescricaoBio(request.descricaoBio());
        loja.setLogradouro(request.logradouro());
        loja.setBairro(request.bairro());
        loja.setCidade(request.cidade());
        loja.setEstado(request.estado() != null ? request.estado() : "SE");
        loja.setCep(request.cep());
        loja.setAceitaRetirada(request.aceitaRetirada() != null ? request.aceitaRetirada() : true);
        loja.setFazEntrega(request.fazEntrega() != null ? request.fazEntrega() : false);
        loja.setValorMinimoPedido(request.valorMinimoPedido());
        loja.setTaxaEntregaFixa(request.taxaEntregaFixa());
        loja.setLogoUrl(request.logoUrl());
        if (request.latitudeLoja() != null)
            loja.setLatitudeLoja(request.latitudeLoja());
        if (request.longitudeLoja() != null)
            loja.setLongitudeLoja(request.longitudeLoja());

        loja.setChavePix(request.chavePix());
        loja.setTipoChavePix(request.tipoChavePix());
        
        loja.setDiasHorariosFuncionamento(request.diasHorariosFuncionamento());
        loja.setRegioesEntrega(request.regioesEntrega());
        loja.setDiasHorariosEntrega(request.diasHorariosEntrega());
        loja.setDiasHorariosRetirada(request.diasHorariosRetirada());

        return lojaRepository.save(loja);
    }

    @Transactional
    public void deletarPorUsuario(Usuario usuario) {
        Loja loja = lojaRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));
        
        loja.setUsuario(null);
        loja.setSuspensa(true);
        loja.setVerificada(false);
        loja.setNomeLoja(loja.getNomeLoja() + " (Excluída)");
        lojaRepository.save(loja);
    }

    public java.util.List<Loja> buscarEmpreendedoras() {
        return lojaRepository.findByUsuarioGeneroAndVerificadaTrueAndSuspensaFalse("FEMININO");
    }

    @Transactional
    public Loja atualizarPerfilEmpreendedora(Usuario usuario, EmpreendedoraRequest request) {
        Loja loja = lojaRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));

        if (request.fotoEmpreendedoraUrl() != null)
            loja.setFotoEmpreendedoraUrl(
                    request.fotoEmpreendedoraUrl().isBlank() ? null : request.fotoEmpreendedoraUrl());

        if (request.historiaEmpreendedora() != null)
            loja.setHistoriaEmpreendedora(
                    request.historiaEmpreendedora().isBlank() ? null : request.historiaEmpreendedora());

        return lojaRepository.save(loja);
    }

    @Transactional
    public Loja deletarPerfilEmpreendedora(Usuario usuario) {
        Loja loja = lojaRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new NotFoundException("Loja não encontrada."));
        loja.setFotoEmpreendedoraUrl(null);
        loja.setHistoriaEmpreendedora(null);
        return lojaRepository.save(loja);
    }

    // === ENDEREÇOS DA LOJA (FILIAIS) ===

    public List<EnderecoLoja> listarEnderecosLoja(Usuario usuario) {
        Loja loja = buscarPorUsuario(usuario);
        return enderecoLojaRepository.findByLoja(loja);
    }

    @Transactional
    public EnderecoLoja criarEnderecoLoja(Usuario usuario, EnderecoLojaRequest request) {
        Loja loja = buscarPorUsuario(usuario);
        EnderecoLoja endereco = new EnderecoLoja();
        endereco.setLoja(loja);
        return salvarDadosEnderecoLoja(endereco, request);
    }

    @Transactional
    public EnderecoLoja atualizarEnderecoLoja(Usuario usuario, Long enderecoId, EnderecoLojaRequest request) {
        Loja loja = buscarPorUsuario(usuario);
        EnderecoLoja endereco = enderecoLojaRepository.findByIdAndLoja(enderecoId, loja)
                .orElseThrow(() -> new NotFoundException("Endereço não encontrado para esta loja."));
        return salvarDadosEnderecoLoja(endereco, request);
    }

    @Transactional
    public void deletarEnderecoLoja(Usuario usuario, Long enderecoId) {
        Loja loja = buscarPorUsuario(usuario);
        EnderecoLoja endereco = enderecoLojaRepository.findByIdAndLoja(enderecoId, loja)
                .orElseThrow(() -> new NotFoundException("Endereço não encontrado para esta loja."));
        enderecoLojaRepository.delete(endereco);
    }

    private EnderecoLoja salvarDadosEnderecoLoja(EnderecoLoja endereco, EnderecoLojaRequest request) {
        endereco.setNomeLocal(request.getNomeLocal());
        endereco.setCep(request.getCep());
        endereco.setBairro(request.getBairro());
        endereco.setCidade(request.getCidade());
        endereco.setEstado(request.getEstado() != null ? request.getEstado() : "SE");
        endereco.setRua(request.getRua());
        endereco.setNumero(request.getNumero());
        
        if (request.getLatitude() != null) endereco.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) endereco.setLongitude(request.getLongitude());

        endereco.setDiasHorariosFuncionamento(request.getDiasHorariosFuncionamento());
        endereco.setRegioesEntrega(request.getRegioesEntrega());
        endereco.setDiasHorariosEntrega(request.getDiasHorariosEntrega());
        endereco.setDiasHorariosRetirada(request.getDiasHorariosRetirada());

        return enderecoLojaRepository.save(endereco);
    }
}