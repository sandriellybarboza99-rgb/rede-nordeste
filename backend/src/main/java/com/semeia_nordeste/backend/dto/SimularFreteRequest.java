package com.semeia_nordeste.backend.dto;

import jakarta.validation.constraints.NotNull;

public record SimularFreteRequest(
        @NotNull Long lojaId,
        @NotNull Double latitudeDestino,
        @NotNull Double longitudeDestino,
        Double pesoTotal) {
}