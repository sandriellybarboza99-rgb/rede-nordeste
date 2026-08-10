package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LojaRequest(

                @NotBlank(message = "O nome da loja é obrigatório") @Size(max = 100) String nomeLoja,

                String descricaoBio,
                String logradouro,
                String bairro,

                @Size(max = 100, message = "A cidade não pode exceder 100 caracteres") String cidade,

                @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres") String estado,

                @Size(min = 8, max = 8, message = "CEP deve ter 8 dígitos") String cep,

                Boolean aceitaRetirada,
                Boolean fazEntrega,

                @DecimalMin(value = "0.0") BigDecimal valorMinimoPedido,

                @DecimalMin(value = "0.0") BigDecimal taxaEntregaFixa,

                String logoUrl,

                Double latitudeLoja,
                Double longitudeLoja,

                @Size(max = 150, message = "A chave PIX não pode exceder 150 caracteres") String chavePix,
                @Size(max = 30, message = "O tipo da chave PIX não pode exceder 30 caracteres") String tipoChavePix) {
}