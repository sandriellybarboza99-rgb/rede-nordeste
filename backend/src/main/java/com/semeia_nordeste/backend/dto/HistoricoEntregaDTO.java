package com.semeia_nordeste.backend.dto;

import com.semeia_nordeste.backend.model.HistoricoEntrega;
import com.semeia_nordeste.backend.model.StatusEntrega;
import java.time.OffsetDateTime;

public record HistoricoEntregaDTO(
        Long id,
        StatusEntrega statusEntrega,
        String descricao,
        OffsetDateTime dataRegistro) {

    public static HistoricoEntregaDTO fromEntity(HistoricoEntrega h) {
        return new HistoricoEntregaDTO(
                h.getId(),
                h.getStatusEntrega(),
                h.getDescricao(),
                h.getDataRegistro()
        );
    }
}
