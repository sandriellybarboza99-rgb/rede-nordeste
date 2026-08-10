package com.semeia_nordeste.backend.controller;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.semeia_nordeste.backend.dto.SimularFreteRequest;
import com.semeia_nordeste.backend.dto.SimularFreteResponse;
import com.semeia_nordeste.backend.model.CategoriaCarga;
import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.TipoVeiculo;
import com.semeia_nordeste.backend.repository.LojaRepository;
import com.semeia_nordeste.backend.service.FreteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/frete")
public class FreteController {

    private final FreteService freteService;
    private final LojaRepository lojaRepository;

    public FreteController(FreteService freteService, LojaRepository lojaRepository) {
        this.freteService = freteService;
        this.lojaRepository = lojaRepository;
    }

    // Público — frontend simula frete antes de fechar pedido
    @PostMapping("/simular")
    public ResponseEntity<SimularFreteResponse> simular(
            @Valid @RequestBody SimularFreteRequest request) {

        boolean dentroSE = freteService.estaDentroDeSergiipe(
                request.latitudeDestino(), request.longitudeDestino());

        Loja loja = lojaRepository.findById(request.lojaId())
                .orElseThrow(() -> new RuntimeException("Loja não encontrada."));

        double latO = loja.getLatitudeLoja() != null ? loja.getLatitudeLoja() : -10.9167;
        double lonO = loja.getLongitudeLoja() != null ? loja.getLongitudeLoja() : -37.0500;

        BigDecimal distancia = freteService.calcularDistanciaKm(
                latO, lonO, request.latitudeDestino(), request.longitudeDestino());

        // Peso do request, senão usa 2kg como padrão
        BigDecimal peso = request.pesoTotal() != null ? BigDecimal.valueOf(request.pesoTotal()) : BigDecimal.valueOf(2);
        CategoriaCarga categoria = freteService.classificarCarga(peso);
        TipoVeiculo veiculo = freteService.definirVeiculo(categoria, distancia);
        boolean remota = distancia.doubleValue() > 80;
        BigDecimal frete = dentroSE
                ? freteService.calcularFrete(veiculo, distancia, remota)
                : BigDecimal.ZERO;

        return ResponseEntity.ok(new SimularFreteResponse(
                distancia, veiculo, categoria, frete, remota, dentroSE));
    }
}