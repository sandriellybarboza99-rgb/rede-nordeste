package com.semeia_nordeste.backend.dto;

import com.semeia_nordeste.backend.model.TipoPerfil;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRegistroRequest(

        @NotBlank(message = "O nome completo é obrigatório") @Size(max = 150) String nomeCompleto,

        @NotBlank(message = "CPF ou CNPJ é obrigatório") @Size(min = 11, max = 18) String cpfCnpj,

        @NotBlank(message = "O telefone é obrigatório") @Size(max = 15) String telefone,

        @NotBlank @Email(message = "E-mail inválido") String email,

        @NotBlank @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres") String senha,

        String genero,

        @NotNull(message = "O tipo de perfil é obrigatório") TipoPerfil tipoPerfil) {
}