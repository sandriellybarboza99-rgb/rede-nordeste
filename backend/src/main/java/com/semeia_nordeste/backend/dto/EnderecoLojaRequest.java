package com.semeia_nordeste.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnderecoLojaRequest {

    @NotBlank(message = "O nome do local é obrigatório")
    @Size(max = 100)
    private String nomeLocal;

    @NotBlank(message = "O CEP é obrigatório")
    @Size(max = 10)
    private String cep;

    @NotBlank(message = "O bairro é obrigatório")
    @Size(max = 100)
    private String bairro;
    
    @NotBlank(message = "A cidade é obrigatória")
    @Size(max = 100)
    private String cidade;

    @NotBlank(message = "O estado é obrigatório")
    @Size(max = 2)
    private String estado;

    @NotBlank(message = "O logradouro é obrigatório")
    @Size(max = 150)
    private String rua;

    @Size(max = 20)
    private String numero;

    private Double latitude;

    private Double longitude;

    private String diasHorariosFuncionamento;

    private String regioesEntrega;

    private String diasHorariosEntrega;

    private String diasHorariosRetirada;
}
