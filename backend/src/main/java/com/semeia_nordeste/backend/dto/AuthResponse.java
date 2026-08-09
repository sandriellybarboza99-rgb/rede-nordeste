package com.semeia_nordeste.backend.dto;

import com.semeia_nordeste.backend.model.TipoPerfil;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String nome,
        String email,
        TipoPerfil perfil,
        String genero) {
}
