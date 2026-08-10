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
        List<LojaPagamentoPixDTO> detalhesPixLojas,
        String codigoRetirada,
        Boolean retiradaNaLoja,
        String nomeComprador,
        List<HistoricoEntregaDTO> historico) {
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
                calcularDetalhesPix(p),
                p.getEntrega().getCodigoRetirada(),
                p.getEntrega().getRetiradaNaLoja(),
                p.getComprador() != null ? p.getComprador().getNomeCompleto() : null,
                p.getEntrega().getHistorico() != null ? p.getEntrega().getHistorico().stream().map(HistoricoEntregaDTO::fromEntity).toList() : List.of());
    }

    private static List<LojaPagamentoPixDTO> calcularDetalhesPix(Pedido p) {
        if (p.getItens() == null || p.getItens().isEmpty()) return List.of();

        BigDecimal totalProdutos = p.getItens().stream()
                .map(i -> i.getPrecoUnitarioNoMomento().multiply(BigDecimal.valueOf(i.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalFrete = p.getEntrega() != null && p.getEntrega().getValorFrete() != null
                ? p.getEntrega().getValorFrete() : BigDecimal.ZERO;

        java.util.Map<Loja, BigDecimal> subtotaisPorLoja = new java.util.HashMap<>();
        for (ItemPedido item : p.getItens()) {
            Loja loja = item.getProduto().getLoja();
            BigDecimal subtotalItem = item.getPrecoUnitarioNoMomento().multiply(BigDecimal.valueOf(item.getQuantidade()));
            subtotaisPorLoja.put(loja, subtotaisPorLoja.getOrDefault(loja, BigDecimal.ZERO).add(subtotalItem));
        }

        return subtotaisPorLoja.entrySet().stream().map(entry -> {
            Loja loja = entry.getKey();
            BigDecimal subtotal = entry.getValue();
            
            // Frete da Loja (Prioriza o mapa real do pedido, senão usa o fallback proporcional para pedidos antigos)
            BigDecimal freteProporcional = BigDecimal.ZERO;
            if (p.getFretePorLojaReal() != null && p.getFretePorLojaReal().containsKey(loja.getId())) {
                freteProporcional = p.getFretePorLojaReal().get(loja.getId());
            } else if (totalProdutos.compareTo(BigDecimal.ZERO) > 0) {
                freteProporcional = totalFrete.multiply(subtotal)
                        .divide(totalProdutos, 2, java.math.RoundingMode.HALF_UP);
            }
            
            BigDecimal totalLoja = subtotal.add(freteProporcional);

            return new LojaPagamentoPixDTO(
                    loja.getId(),
                    loja.getNomeLoja(),
                    loja.getChavePix(),
                    loja.getTipoChavePix(),
                    subtotal,
                    freteProporcional,
                    totalLoja
            );
        }).toList();
    }
}