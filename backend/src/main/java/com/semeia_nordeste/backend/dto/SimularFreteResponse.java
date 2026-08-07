package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;

import com.semeia_nordeste.backend.model.CategoriaCarga;
import com.semeia_nordeste.backend.model.TipoVeiculo;

public record SimularFreteResponse(
                BigDecimal distanciaKm,
                TipoVeiculo tipoVeiculoSugerido,
                CategoriaCarga categoriaCarga,
                BigDecimal valorFrete,
                boolean areaRemota,
                boolean dentroDeSergiipe) {
}