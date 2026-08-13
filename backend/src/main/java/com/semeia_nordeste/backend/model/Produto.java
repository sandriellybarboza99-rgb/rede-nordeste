package com.semeia_nordeste.backend.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "produtos")
@Getter
@Setter
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "loja_id")
    private Loja loja;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @NotBlank(message = "O nome do produto é obrigatório")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @NotNull(message = "O preço é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero")
    @Column(name = "preco_atual", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoAtual;

    @NotBlank(message = "A unidade de medida é obrigatória")
    @Size(max = 20)
    @Column(name = "unidade_medida", nullable = false, length = 20)
    private String unidadeMedida;

    @Min(value = 0, message = "O estoque não pode ser negativo")
    @Column(name = "estoque_atual")
    private Integer estoqueAtual = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusProduto status = StatusProduto.PENDENTE;

    @Column(name = "imagem_url", columnDefinition = "TEXT")
    private String imagemUrl;

    @Column(name = "data_cadastro", updatable = false)
    private OffsetDateTime dataCadastro = OffsetDateTime.now();

    @Column(name = "peso_kg", precision = 8, scale = 2)
    private BigDecimal pesoKg = BigDecimal.valueOf(0.5);

    @Column(name = "disponivel_sede", nullable = false)
    private boolean disponivelSede = true;

    @ManyToMany(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinTable(
        name = "produto_filiais",
        joinColumns = @JoinColumn(name = "produto_id"),
        inverseJoinColumns = @JoinColumn(name = "endereco_loja_id")
    )
    private Set<EnderecoLoja> filiaisDisponiveis = new HashSet<>();
}