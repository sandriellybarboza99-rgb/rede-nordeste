package com.semeia_nordeste.backend.dto;

import java.time.OffsetDateTime;

import com.semeia_nordeste.backend.model.EnderecoLoja;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnderecoLojaResponse {
    private Long id;
    private Long lojaId;
    private String nomeLocal;
    private String cep;
    private String bairro;
    private String cidade;
    private String estado;
    private String rua;
    private String numero;
    private Double latitude;
    private Double longitude;
    private String diasHorariosFuncionamento;
    private String regioesEntrega;
    private String diasHorariosEntrega;
    private String diasHorariosRetirada;
    private OffsetDateTime dataCriacao;

    public static EnderecoLojaResponse fromEntity(EnderecoLoja e) {
        EnderecoLojaResponse dto = new EnderecoLojaResponse();
        dto.setId(e.getId());
        dto.setLojaId(e.getLoja().getId());
        dto.setNomeLocal(e.getNomeLocal());
        dto.setCep(e.getCep());
        dto.setBairro(e.getBairro());
        dto.setCidade(e.getCidade());
        dto.setEstado(e.getEstado());
        dto.setRua(e.getRua());
        dto.setNumero(e.getNumero());
        dto.setLatitude(e.getLatitude());
        dto.setLongitude(e.getLongitude());
        dto.setDiasHorariosFuncionamento(e.getDiasHorariosFuncionamento());
        dto.setRegioesEntrega(e.getRegioesEntrega());
        dto.setDiasHorariosEntrega(e.getDiasHorariosEntrega());
        dto.setDiasHorariosRetirada(e.getDiasHorariosRetirada());
        dto.setDataCriacao(e.getDataCriacao());
        return dto;
    }
}
