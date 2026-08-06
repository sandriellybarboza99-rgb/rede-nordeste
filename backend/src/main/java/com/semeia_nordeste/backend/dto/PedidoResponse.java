package com.semeia_nordeste.backend.dto;

import com.semeia_nordeste.backend.model.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        BigDecimal valorTotal,
        String observacoes,
        OffsetDateTime dataPedido,
        String metodoPagamento,
        StatusPagamento statusPagamento,
        StatusEntrega statusEntrega,
        String enderecoEntrega,
        List<ItemPedidoResponse> itens,

        // ── Campos PIX (null quando método não é PIX) ─────────────────
        String pixPayload,
        String pixTxid) {

    public static PedidoResponse fromEntity(Pedido p) {
        return new PedidoResponse(
                p.getId(),
                p.getValorTotal(),
                p.getObservacoes(),
                p.getDataPedido(),
                p.getPagamento().getMetodoPagamento(),
                p.getPagamento().getStatusPagamento(),
                p.getEntrega().getStatusEntrega(),
                p.getEntrega().getEnderecoEntrega(),
                p.getItens().stream().map(ItemPedidoResponse::fromEntity).toList(),
                p.getPagamento().getPixPayload(),
                p.getPagamento().getPixTxid());
    }
}