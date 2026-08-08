package com.semeia_nordeste.backend.dto;

import jakarta.validation.constraints.Size;

/**
 * PATCH /api/lojas/minha/empreendedora — campos editáveis pela própria empreendedora.
 * Permite atualizar foto pessoal e história independentemente dos dados da loja.
 */
public record EmpreendedoraRequest(

        String fotoEmpreendedoraUrl,

        @Size(max = 1000, message = "A história não pode exceder 1000 caracteres")
        String historiaEmpreendedora) {
}
