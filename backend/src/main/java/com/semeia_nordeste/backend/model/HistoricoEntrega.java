package com.semeia_nordeste.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "historico_entrega")
@Getter
@Setter
public class HistoricoEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "entrega_id", nullable = false)
    private Entrega entrega;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_entrega", nullable = false, length = 40)
    private StatusEntrega statusEntrega;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "data_registro", nullable = false, updatable = false)
    private OffsetDateTime dataRegistro = OffsetDateTime.now();
}
