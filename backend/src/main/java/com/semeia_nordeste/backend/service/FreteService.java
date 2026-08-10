package com.semeia_nordeste.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;

import com.semeia_nordeste.backend.model.CategoriaCarga;
import com.semeia_nordeste.backend.model.ItemPedido;
import com.semeia_nordeste.backend.model.TipoVeiculo;

@Service
public class FreteService {

    // ── Sergipe: lat/lon aproximados para validação ──────────────────
    private static final double SE_LAT_MIN = -11.57;
    private static final double SE_LAT_MAX = -9.50;
    private static final double SE_LON_MIN = -38.25;
    private static final double SE_LON_MAX = -36.39;

    // ── Taxas base por veículo (R$/km) ───────────────────────────────
    private static final BigDecimal TAXA_BICICLETA = new BigDecimal("0.80");
    private static final BigDecimal TAXA_MOTO = new BigDecimal("1.50");
    private static final BigDecimal TAXA_CARRO_PEQUENO = new BigDecimal("2.20");
    private static final BigDecimal TAXA_UTILITARIO = new BigDecimal("3.00");
    private static final BigDecimal TAXA_CAMINHONETE = new BigDecimal("3.80");
    private static final BigDecimal TAXA_CAMINHAO = new BigDecimal("5.50");

    // ── Frete mínimo por veículo ──────────────────────────────────────
    private static final BigDecimal MINIMO_BICICLETA = new BigDecimal("5.00");
    private static final BigDecimal MINIMO_MOTO = new BigDecimal("8.00");
    private static final BigDecimal MINIMO_CARRO = new BigDecimal("12.00");
    private static final BigDecimal MINIMO_UTILITARIO = new BigDecimal("20.00");
    private static final BigDecimal MINIMO_CAMINHONETE = new BigDecimal("30.00");
    private static final BigDecimal MINIMO_CAMINHAO = new BigDecimal("80.00");

    // ── Taxa adicional para cidades distantes (>80km de Aracaju) ─────
    private static final BigDecimal TAXA_AREA_REMOTA = new BigDecimal("15.00");

    /**
     * Calcula distância em KM entre dois pontos (fórmula de Haversine)
     */
    public BigDecimal calcularDistanciaKm(double latO, double lonO,
            double latD, double lonD) {
        final int RAIO_TERRA = 6371;
        double dLat = Math.toRadians(latD - latO);
        double dLon = Math.toRadians(lonD - lonO);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(latO)) * Math.cos(Math.toRadians(latD))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double distancia = RAIO_TERRA * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return BigDecimal.valueOf(distancia).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Valida se o ponto está dentro de Sergipe
     */
    public boolean estaDentroDeSergiipe(double lat, double lon) {
        return lat >= SE_LAT_MIN && lat <= SE_LAT_MAX
                && lon >= SE_LON_MIN && lon <= SE_LON_MAX;
    }

    /**
     * Classifica a carga com base no peso total dos itens
     */
    public CategoriaCarga classificarCarga(BigDecimal pesoTotalKg) {
        double peso = pesoTotalKg.doubleValue();
        if (peso <= 5)
            return CategoriaCarga.LEVE;
        if (peso <= 20)
            return CategoriaCarga.MEDIA;
        if (peso <= 100)
            return CategoriaCarga.PESADA;
        return CategoriaCarga.MUITO_PESADA;
    }

    /**
     * Define o tipo de veículo mínimo necessário
     */
    public TipoVeiculo definirVeiculo(CategoriaCarga carga, BigDecimal distanciaKm) {
        double dist = distanciaKm.doubleValue();
        return switch (carga) {
            case LEVE -> dist <= 5 ? TipoVeiculo.BICICLETA : TipoVeiculo.MOTO;
            case MEDIA -> TipoVeiculo.CARRO_PEQUENO;
            case PESADA -> TipoVeiculo.CAMINHONETE;
            case MUITO_PESADA -> TipoVeiculo.CAMINHAO;
        };
    }

    /**
     * Calcula o peso total de um pedido
     */
    public BigDecimal calcularPesoTotal(List<ItemPedido> itens) {
        return itens.stream()
                .map(i -> {
                    BigDecimal peso = i.getProduto().getPesoKg() != null
                            ? i.getProduto().getPesoKg()
                            : BigDecimal.valueOf(0.5);
                    return peso.multiply(BigDecimal.valueOf(i.getQuantidade()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula o valor do frete
     */
    public BigDecimal calcularFrete(TipoVeiculo veiculo,
            BigDecimal distanciaKm,
            boolean areaRemota) {
        BigDecimal taxaPorKm = taxaPorVeiculo(veiculo);
        BigDecimal minimo = minimoPorVeiculo(veiculo);

        BigDecimal frete = taxaPorKm.multiply(distanciaKm)
                .setScale(2, RoundingMode.HALF_UP);

        // Aplica mínimo
        if (frete.compareTo(minimo) < 0)
            frete = minimo;

        // Taxa adicional área remota
        if (areaRemota)
            frete = frete.add(TAXA_AREA_REMOTA);

        return frete;
    }

    private BigDecimal taxaPorVeiculo(TipoVeiculo v) {
        return switch (v) {
            case BICICLETA -> TAXA_BICICLETA;
            case MOTO -> TAXA_MOTO;
            case CARRO_PEQUENO -> TAXA_CARRO_PEQUENO;
            case CARRO_UTILITARIO -> TAXA_UTILITARIO;
            case CAMINHONETE -> TAXA_CAMINHONETE;
            case CAMINHAO -> TAXA_CAMINHAO;
        };
    }

    private BigDecimal minimoPorVeiculo(TipoVeiculo v) {
        return switch (v) {
            case BICICLETA -> MINIMO_BICICLETA;
            case MOTO -> MINIMO_MOTO;
            case CARRO_PEQUENO -> MINIMO_CARRO;
            case CARRO_UTILITARIO -> MINIMO_UTILITARIO;
            case CAMINHONETE -> MINIMO_CAMINHONETE;
            case CAMINHAO -> MINIMO_CAMINHAO;
        };
    }
}