package com.semeia_nordeste.backend.model;

/**
 * Status do pagamento de um pedido.
 *
 * PENDENTE_PIX foi adicionado para representar especificamente um pedido
 * pago via PIX que ainda não teve a confirmação de recebimento — antes
 * disso o sistema tentava persistir esse valor sem que ele existisse no
 * enum, causando InvalidDataAccessApiUsageException ao carregar do banco.
 */
public enum StatusPagamento {

    /** Pagamento ainda não iniciado ou aguardando confirmação genérica. */
    AGUARDANDO,

    /** PIX gerado e aguardando o comprador efetuar o pagamento. */
    PENDENTE_PIX,

    /** Pagamento confirmado/aprovado. */
    APROVADO,

    /** Pagamento recusado pela operadora/banco. */
    RECUSADO,

    /** Pagamento cancelado antes da confirmação. */
    CANCELADO,

    /** Pagamento estornado após aprovação. */
    ESTORNADO
}
