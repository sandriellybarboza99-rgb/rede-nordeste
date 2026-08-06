package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.TipoChavePix;

public record LojaResponse(
        Long id,
        Long usuarioId,
        String nomeLoja,
        String descricaoBio,
        String logradouro,
        String bairro,
        String cidade,
        String estado,
        String cep,
        Boolean aceitaRetirada,
        Boolean fazEntrega,
        BigDecimal valorMinimoPedido,
        BigDecimal taxaEntregaFixa,
        String logoUrl,
        OffsetDateTime dataAbertura,
        Double latitudeLoja,
        Double longitudeLoja,
        Boolean verificada,
        Boolean suspensa,
        String chavePix,
        TipoChavePix tipoChavePix) {

    public static LojaResponse fromEntity(Loja l) {
        return new LojaResponse(
                l.getId(),
                l.getUsuario() != null ? l.getUsuario().getId() : null,
                l.getNomeLoja(),
                l.getDescricaoBio(),
                l.getLogradouro(),
                l.getBairro(),
                l.getCidade(),
                l.getEstado(),
                l.getCep(),
                l.getAceitaRetirada(),
                l.getFazEntrega(),
                l.getValorMinimoPedido(),
                l.getTaxaEntregaFixa(),
                l.getLogoUrl(),
                l.getDataAbertura(),
                l.getLatitudeLoja(),
                l.getLongitudeLoja(),
                l.getVerificada(),
                l.getSuspensa(),
                l.getChavePix(),
                l.getTipoChavePix());
    }
}