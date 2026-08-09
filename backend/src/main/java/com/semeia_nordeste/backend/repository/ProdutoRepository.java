package com.semeia_nordeste.backend.repository;

import com.semeia_nordeste.backend.model.Produto;
import com.semeia_nordeste.backend.model.StatusProduto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    Page<Produto> findByLojaId(Long lojaId, Pageable pageable);

    Page<Produto> findByCategoriaId(Long categoriaId, Pageable pageable);

    Page<Produto> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    Page<Produto> findByStatus(StatusProduto status, Pageable pageable);

    Page<Produto> findByStatusAndNomeContainingIgnoreCase(
            StatusProduto status, String nome, Pageable pageable);

    Page<Produto> findByStatusAndCategoriaId(
            StatusProduto status, Long categoriaId, Pageable pageable);

    // Painel admin — pendentes aguardando aprovação
    Page<Produto> findByStatusOrderByDataCadastroAsc(
            StatusProduto status, Pageable pageable);

    /**
     * Busca de marketplace que combina status + nome (opcional) + categoria (opcional)
     * num único filtro. Só retorna produtos de lojas verificadas e não suspensas.
     *
     * IMPORTANTE: o filtro de nome usa `:nome = ''` (string vazia) em vez de
     * `:nome IS NULL`. Motivo: no PostgreSQL, um bind `null` "solto" dentro de
     * LOWER(CONCAT(...)) faz o planner inferir o tipo como `bytea`, gerando o
     * erro `function lower(bytea) does not exist` ao PREPARAR o statement
     * (mesmo com o short-circuit `IS NULL`). Passando sempre uma String (vazia
     * quando não há busca), o tipo é inferido como `text` e a query funciona.
     * O service garante que `nome` nunca chega null (ver ProdutoService.buscar).
     */
    @Query(value = """
            SELECT p FROM Produto p
            JOIN FETCH p.loja l
            JOIN FETCH p.categoria c
            WHERE p.status = :status
              AND l.verificada = true
              AND l.suspensa = false
              AND (:nome = '' OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
              AND (:categoriaId IS NULL OR c.id = :categoriaId)
              AND (:estado IS NULL OR :estado = '' OR LOWER(l.estado) = LOWER(:estado))
              AND (:cidade IS NULL OR :cidade = '' OR LOWER(l.cidade) LIKE LOWER(CONCAT('%', :cidade, '%')))
            """,
            countQuery = """
            SELECT COUNT(p) FROM Produto p
            JOIN p.loja l
            JOIN p.categoria c
            WHERE p.status = :status
              AND l.verificada = true
              AND l.suspensa = false
              AND (:nome = '' OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
              AND (:categoriaId IS NULL OR c.id = :categoriaId)
              AND (:estado IS NULL OR :estado = '' OR LOWER(l.estado) = LOWER(:estado))
              AND (:cidade IS NULL OR :cidade = '' OR LOWER(l.cidade) LIKE LOWER(CONCAT('%', :cidade, '%')))
              AND (:excluirLojaId IS NULL OR l.id <> :excluirLojaId)
            """)
    Page<Produto> buscarMarketplace(
            @Param("status") StatusProduto status,
            @Param("nome") String nome,
            @Param("categoriaId") Long categoriaId,
            @Param("estado") String estado,
            @Param("cidade") String cidade,
            @Param("excluirLojaId") Long excluirLojaId,
            Pageable pageable);

    /**
     * Home estilo Shopee — um produto APROVADO por loja verificada, o mais recente.
     */
    @Query(value = """
            SELECT DISTINCT ON (p.loja_id) p.*
            FROM produtos p
            JOIN lojas l ON l.id = p.loja_id
            WHERE p.status = 'APROVADO'
              AND l.verificada = TRUE
              AND l.suspensa = FALSE
            ORDER BY p.loja_id, p.data_cadastro DESC
            """, nativeQuery = true)
    List<Produto> findUmPorLoja();

    @Query("""
            SELECT new com.semeia_nordeste.backend.dto.FacetResponse(p.loja.estado, COUNT(p))
            FROM Produto p
            WHERE p.status = :status
              AND p.loja.verificada = true
              AND p.loja.suspensa = false
              AND (:nome = '' OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
              AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId)
            GROUP BY p.loja.estado
            ORDER BY p.loja.estado ASC
            """)
    List<com.semeia_nordeste.backend.dto.FacetResponse> countFacetEstados(
            @Param("status") StatusProduto status,
            @Param("nome") String nome,
            @Param("categoriaId") Long categoriaId);

    @Query("""
            SELECT new com.semeia_nordeste.backend.dto.FacetResponse(p.loja.cidade, COUNT(p))
            FROM Produto p
            WHERE p.status = :status
              AND p.loja.verificada = true
              AND p.loja.suspensa = false
              AND (:nome = '' OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
              AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId)
              AND (:estado IS NULL OR :estado = '' OR LOWER(p.loja.estado) = LOWER(:estado))
            GROUP BY p.loja.cidade
            ORDER BY p.loja.cidade ASC
            """)
    List<com.semeia_nordeste.backend.dto.FacetResponse> countFacetCidades(
            @Param("status") StatusProduto status,
            @Param("nome") String nome,
            @Param("categoriaId") Long categoriaId,
            @Param("estado") String estado);
}
