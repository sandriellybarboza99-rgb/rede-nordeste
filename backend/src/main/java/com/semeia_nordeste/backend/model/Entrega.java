package com.semeia_nordeste.backend.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "entregas")
@Getter
@Setter
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_entrega", length = 40)
    private StatusEntrega statusEntrega = StatusEntrega.PEDIDO_RECEBIDO;

    // Endereço de destino
    @Column(name = "endereco_entrega", columnDefinition = "TEXT")
    private String enderecoEntrega;

    @Column(name = "cidade_destino", length = 100)
    private String cidadeDestino;

    @Column(name = "latitude_destino")
    private Double latitudeDestino;

    @Column(name = "longitude_destino")
    private Double longitudeDestino;

    // Dados calculados
    @Column(name = "distancia_km", precision = 8, scale = 2)
    private BigDecimal distanciaKm;

    @Column(name = "valor_frete", precision = 10, scale = 2)
    private BigDecimal valorFrete;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_veiculo_necessario", length = 30)
    private TipoVeiculo tipoVeiculoNecessario;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria_carga", length = 20)
    private CategoriaCarga categoriaCarga;

    @Column(name = "peso_total_kg", precision = 8, scale = 2)
    private BigDecimal pesoTotalKg;

    // Entregador associado
    @ManyToOne
    @JoinColumn(name = "entregador_id")
    private Entregador entregador;

    @Column(name = "codigo_rastreio", length = 50)
    private String codigoRastreio;

    @Column(name = "retirada_na_loja")
    private Boolean retiradaNaLoja = false;

    @Column(name = "codigo_retirada", length = 4)
    private String codigoRetirada;

    @Column(name = "data_atualizacao")
    private OffsetDateTime dataAtualizacao = OffsetDateTime.now();

    @Column(name = "data_entregue")
    private OffsetDateTime dataEntregue;
}