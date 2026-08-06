package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.semeia_nordeste.backend.model.TipoChavePix;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LojaDTO {

    private Long id;
    private Long usuarioId;

    @NotBlank(message = "O nome da loja é obrigatório")
    @Size(max = 100, message = "O nome da loja deve ter no máximo 100 caracteres")
    private String nomeLoja;

    private String descricaoBio;
    private String logradouro;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private Boolean aceitaRetirada;
    private Boolean fazEntrega;
    private BigDecimal valorMinimoPedido;
    private BigDecimal taxaEntregaFixa;
    private String logoUrl;
    private OffsetDateTime dataAbertura;
    private Double latitudeLoja;
    private Double longitudeLoja;
    private Boolean verificada;
    private Boolean suspensa;
    private OffsetDateTime dataVerificacao;
    private String motivoSuspensao;

    /**
     * Chave PIX da loja/produtor
     */
    private String chavePix;

    /**
     * Tipo da chave PIX (CPF, CNPJ, EMAIL, TELEFONE, ALEATORIA)
     */
    private TipoChavePix tipoChavePix;
}