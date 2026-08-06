package com.semeia_nordeste.backend.dto;

import java.math.BigDecimal;

import com.semeia_nordeste.backend.model.TipoChavePix;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LojaRequest(

                @NotBlank(message = "O nome da loja é obrigatório") @Size(max = 100) String nomeLoja,

                String descricaoBio,
                String logradouro,
                String bairro,

                @NotBlank(message = "A cidade é obrigatória") String cidade,

                @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres") String estado,

                @Size(min = 8, max = 8, message = "CEP deve ter 8 dígitos") String cep,

                Boolean aceitaRetirada,
                Boolean fazEntrega,

                @DecimalMin(value = "0.0") BigDecimal valorMinimoPedido,

                @DecimalMin(value = "0.0") BigDecimal taxaEntregaFixa,

                String logoUrl,

                Double latitudeLoja,
                Double longitudeLoja,

                String chavePix,
                TipoChavePix tipoChavePix) {
}