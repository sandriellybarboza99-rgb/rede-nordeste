package com.semeia_nordeste.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome completo é obrigatório")
    @Size(max = 150, message = "O nome não pode exceder 150 caracteres")
    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @NotBlank(message = "CPF ou CNPJ é obrigatório")
    @Size(min = 11, max = 14, message = "CPF/CNPJ deve ter entre 11 e 14 caracteres")
    @Column(name = "cpf_cnpj", nullable = false, unique = true, length = 14)
    private String cpfCnpj;

    @NotBlank(message = "O telefone é obrigatório")
    @Size(max = 15)
    @Column(nullable = false, unique = true, length = 15)
    private String telefone;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    @Size(max = 100)
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    @Column(name = "senha_hash", nullable = false, columnDefinition = "TEXT")
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_perfil", nullable = false, length = 20)
    private TipoPerfil tipoPerfil;

    @Column(name = "foto_perfil_url", columnDefinition = "TEXT")
    private String fotoPerfilUrl;

    @Column(name = "genero", length = 30)
    private String genero;

    @Column(name = "conta_ativa", nullable = false)
    private Boolean contaAtiva = true; // está "true" apenas para facilitar os testes iniciais

    @Column(name = "data_criacao", updatable = false)
    private OffsetDateTime dataCriacao = OffsetDateTime.now();

    @Column(name = "data_ultimo_login")
    private OffsetDateTime dataUltimoLogin;

    @Column(name = "motivo_suspensao", columnDefinition = "TEXT")
    private String motivoSuspensao;
}