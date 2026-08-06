package com.semeia_nordeste.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

/**
 * Entidade de pagamento.
 *
 * Campos PIX adicionados:
 *   pixPayload  — payload BR Code completo (string EMV), usado para gerar o
 *                 QR Code e o "Copia e Cola" no frontend.
 *   pixTxid     — identificador único da transação (Reference Label).
 *   pixChave    — chave PIX utilizada no momento da geração (auditoria).
 *
 * O @Column(columnDefinition = "TEXT") em pixPayload garante que strings longas
 * (o BR Code pode chegar a ~500 caracteres) não sejam truncadas pelo banco.
 */
@Entity
@Table(name = "pagamentos")
@Getter
@Setter
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "metodo_pagamento", nullable = false, length = 50)
    private String metodoPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", length = 30)
    private StatusPagamento statusPagamento = StatusPagamento.AGUARDANDO;

    @Column(name = "data_pagamento")
    private OffsetDateTime dataPagamento;

    // ── Campos PIX ────────────────────────────────────────────────────

    /**
     * Payload BR Code completo — usado pelo frontend para gerar o QR Code
     * e disponibilizar o código "Copia e Cola".
     * Nomeado pixPayload para corresponder ao getter/setter esperado
     * pelo PedidoService (getPixPayload / setPixPayload).
     */
    @Column(name = "pix_payload", columnDefinition = "TEXT")
    private String pixPayload;

    /**
     * Identificador único da transação PIX (Reference Label do BR Code).
     * Máximo 25 caracteres alfanuméricos, sem espaços.
     */
    @Column(name = "pix_txid", length = 35)
    private String pixTxid;

    /**
     * Chave PIX utilizada no momento da geração.
     * Armazenada para auditoria e conciliação futura.
     */
    @Column(name = "pix_chave", length = 100)
    private String pixChave;
}