package com.semeia_nordeste.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProdutoRequest(

                @NotNull(message = "A categoria é obrigatória") Long categoriaId,

                @NotBlank(message = "O nome do produto é obrigatório") @Size(max = 100) String nome,

                String descricao,

                @NotNull(message = "O preço é obrigatório") @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero") BigDecimal precoAtual,

                @NotBlank(message = "A unidade de medida é obrigatória") @Size(max = 20) String unidadeMedida,

                @Min(value = 0, message = "O estoque não pode ser negativo") Integer estoqueAtual,

                // Peso em kg para cálculo de frete
                @DecimalMin(value = "0.01", message = "Peso deve ser maior que zero") BigDecimal pesoKg,

                String imagemUrl,
                
                Boolean disponivelSede,
                
                java.util.List<Long> filiaisIds) {
}