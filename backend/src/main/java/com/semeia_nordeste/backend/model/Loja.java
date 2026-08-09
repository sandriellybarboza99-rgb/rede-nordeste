package com.semeia_nordeste.backend.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "lojas")
@Getter
@Setter
public class Loja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @NotBlank(message = "O nome da loja é obrigatório")
    @Size(max = 100)
    @Column(name = "nome_loja", nullable = false, length = 100)
    private String nomeLoja;

    @Column(name = "descricao_bio", columnDefinition = "TEXT")
    private String descricaoBio;

    @Column(length = 255)
    private String logradouro;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(name = "estado", length = 2)
    private String estado;

    @Column(length = 8)
    private String cep;

    @Column(name = "aceita_retirada")
    private Boolean aceitaRetirada = true;

    @Column(name = "faz_entrega")
    private Boolean fazEntrega = false;

    @Column(name = "valor_minimo_pedido", precision = 10, scale = 2)
    private BigDecimal valorMinimoPedido = BigDecimal.ZERO;

    @Column(name = "taxa_entrega_fixa", precision = 10, scale = 2)
    private BigDecimal taxaEntregaFixa = BigDecimal.ZERO;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "data_abertura", updatable = false)
    private OffsetDateTime dataAbertura = OffsetDateTime.now();

    @Column(name = "latitude_loja")
    private Double latitudeLoja;

    @Column(name = "longitude_loja")
    private Double longitudeLoja;

    @Column(name = "verificada", nullable = false)
    private Boolean verificada = false;

    @Column(name = "suspensa", nullable = false)
    private Boolean suspensa = false;

    @Column(name = "data_verificacao")
    private OffsetDateTime dataVerificacao;

    @Column(name = "motivo_suspensao", columnDefinition = "TEXT")
    private String motivoSuspensao;

    // === NOVOS CAMPOS PARA PAGAMENTO VIA PIX ===

    @Column(name = "chave_pix", length = 150)
    private String chavePix;

    @Column(name = "tipo_chave_pix", length = 30)
    private String tipoChavePix;

    // === PERFIL DA EMPREENDEDORA (separado dos dados da loja) ===

    @Column(name = "foto_empreendedora_url", columnDefinition = "TEXT")
    private String fotoEmpreendedoraUrl;

    @Column(name = "historia_empreendedora", columnDefinition = "TEXT")
    private String historiaEmpreendedora;
}