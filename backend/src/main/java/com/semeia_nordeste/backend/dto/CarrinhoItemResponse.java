package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;

import com.semeia_nordeste.backend.model.ItemCarrinho;

public record CarrinhoItemResponse(
        Long id,
        Long produtoId,
        Long lojaId,
        String nomeProduto,
        String imagemUrl,
        String unidadeMedida,
        BigDecimal precoUnitario,
        Integer quantidade,
        BigDecimal subtotal) {
    public static CarrinhoItemResponse fromEntity(ItemCarrinho item) {
        BigDecimal preco = item.getProduto().getPrecoAtual();
        int qty = item.getQuantidade();
        return new CarrinhoItemResponse(
                item.getId(),
                item.getProduto().getId(),
                item.getProduto().getLoja() != null ? item.getProduto().getLoja().getId() : null,
                item.getProduto().getNome(),
                item.getProduto().getImagemUrl(),
                item.getProduto().getUnidadeMedida(),
                preco,
                qty,
                preco.multiply(BigDecimal.valueOf(qty)));
    }
}