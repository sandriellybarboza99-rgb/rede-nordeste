package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;

public record LojaPagamentoPixDTO(
        Long lojaId,
        String nomeLoja,
        String chavePix,
        String tipoChavePix,
        BigDecimal valorSubtotal,
        BigDecimal valorFrete,
        BigDecimal valorTotal) {
}
