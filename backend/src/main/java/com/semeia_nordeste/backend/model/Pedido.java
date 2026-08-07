package com.semeia_nordeste.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "comprador_id")
    private Usuario comprador;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pagamento_id")
    private Pagamento pagamento;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    private List<ItemPedido> itens;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "data_pedido", updatable = false)
    private OffsetDateTime dataPedido = OffsetDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Transient
    private java.util.Map<Long, BigDecimal> fretePorLojaReal = new java.util.HashMap<>();
}