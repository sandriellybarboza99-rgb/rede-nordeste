package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.semeia_nordeste.backend.model.Produto;
import com.semeia_nordeste.backend.model.StatusProduto;

public record ProdutoResponse(
        Long id,
        Long lojaId,
        String nomeLoja,
        String cidade,
        String estado,
        Long categoriaId,
        String nomeCategoria,
        String nome,
        String descricao,
        BigDecimal precoAtual,
        String unidadeMedida,
        Integer estoqueAtual,
        String imagemUrl,
        OffsetDateTime dataCadastro,
        StatusProduto status) {
    public static ProdutoResponse fromEntity(Produto p) {
        return new ProdutoResponse(
                p.getId(),
                p.getLoja().getId(),
                p.getLoja().getNomeLoja(),
                p.getLoja() != null ? p.getLoja().getCidade() : null,
                p.getLoja() != null ? p.getLoja().getEstado() : null,
                p.getCategoria() != null ? p.getCategoria().getId() : null,
                p.getCategoria() != null ? p.getCategoria().getNome() : null,
                p.getNome(),
                p.getDescricao(),
                p.getPrecoAtual(),
                p.getUnidadeMedida(),
                p.getEstoqueAtual(),
                p.getImagemUrl(),
                p.getDataCadastro(),
                p.getStatus());
    }
}