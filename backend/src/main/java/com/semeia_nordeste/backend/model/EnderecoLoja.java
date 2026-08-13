package com.semeia_nordeste.backend.model;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "enderecos_loja")
@Getter
@Setter
public class EnderecoLoja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "loja_id", nullable = false)
    private Loja loja;

    @NotBlank(message = "O nome do local é obrigatório")
    @Size(max = 100)
    @Column(name = "nome_local", nullable = false, length = 100)
    private String nomeLocal;

    @NotBlank(message = "O CEP é obrigatório")
    @Size(max = 10)
    @Column(nullable = false, length = 10)
    private String cep;

    @NotBlank(message = "O bairro é obrigatório")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String bairro;
    
    @NotBlank(message = "A cidade é obrigatória")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String cidade;

    @NotBlank(message = "O estado é obrigatório")
    @Size(max = 2)
    @Column(nullable = false, length = 2)
    private String estado;

    @NotBlank(message = "O logradouro é obrigatório")
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String rua;

    @Size(max = 20)
    @Column(length = 20)
    private String numero;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "dias_horarios_funcionamento", columnDefinition = "TEXT")
    private String diasHorariosFuncionamento;

    @Column(name = "regioes_entrega", columnDefinition = "TEXT")
    private String regioesEntrega;

    @Column(name = "dias_horarios_entrega", columnDefinition = "TEXT")
    private String diasHorariosEntrega;

    @Column(name = "dias_horarios_retirada", columnDefinition = "TEXT")
    private String diasHorariosRetirada;

    @Column(name = "data_criacao", updatable = false)
    private OffsetDateTime dataCriacao = OffsetDateTime.now();
}
