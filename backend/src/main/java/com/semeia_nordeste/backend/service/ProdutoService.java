package com.semeia_nordeste.backend.service;

import java.math.BigDecimal;
import java.util.List;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.semeia_nordeste.backend.dto.ProdutoRequest;
import com.semeia_nordeste.backend.dto.StatusProdutoRequest;
import com.semeia_nordeste.backend.exception.BusinessException;
import com.semeia_nordeste.backend.exception.ForbiddenException;
import com.semeia_nordeste.backend.exception.NotFoundException;
import com.semeia_nordeste.backend.model.Categoria;
import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.Produto;
import com.semeia_nordeste.backend.model.StatusProduto;
import com.semeia_nordeste.backend.repository.CategoriaRepository;
import com.semeia_nordeste.backend.repository.LojaRepository;
import com.semeia_nordeste.backend.repository.ProdutoRepository;
import com.semeia_nordeste.backend.security.UsuarioAutenticado;

@Service
public class ProdutoService {

        private final ProdutoRepository produtoRepository;
        private final LojaRepository lojaRepository;
        private final CategoriaRepository categoriaRepository;
        private final UsuarioAutenticado usuarioAutenticado;

        public ProdutoService(ProdutoRepository produtoRepository,
                        LojaRepository lojaRepository,
                        CategoriaRepository categoriaRepository,
                        UsuarioAutenticado usuarioAutenticado) {
                this.produtoRepository = produtoRepository;
                this.lojaRepository = lojaRepository;
                this.categoriaRepository = categoriaRepository;
                this.usuarioAutenticado = usuarioAutenticado;
        }

        @Transactional
        @CacheEvict(value = "produtos_busca", allEntries = true)
        public Produto criar(ProdutoRequest request) {
                var logado = usuarioAutenticado.get();

                Loja loja = lojaRepository.findByUsuarioId(logado.getId())
                                .orElseThrow(() -> new BusinessException(
                                                "Você precisa cadastrar uma loja antes de adicionar produtos."));

                Categoria categoria = categoriaRepository.findById(request.categoriaId())
                                .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));

                return salvarDados(new Produto(), request, loja, categoria);
        }

        @Transactional
        @CacheEvict(value = "produtos_busca", allEntries = true)
        public Produto atualizar(Long produtoId, ProdutoRequest request) {
                var logado = usuarioAutenticado.get();

                Produto produto = produtoRepository.findById(produtoId)
                                .orElseThrow(() -> new NotFoundException("Produto não encontrado."));

                boolean isAdmin = usuarioAutenticado.isAdmin();
                boolean isDono = produto.getLoja().getUsuario().getId().equals(logado.getId());

                if (!isAdmin && !isDono)
                        throw new ForbiddenException("Você não tem permissão para editar este produto.");

                Categoria categoria = categoriaRepository.findById(request.categoriaId())
                                .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));

                return salvarDados(produto, request, produto.getLoja(), categoria);
        }

        @Transactional
        @CacheEvict(value = "produtos_busca", allEntries = true)
        public void deletar(Long produtoId) {
                var logado = usuarioAutenticado.get();

                Produto produto = produtoRepository.findById(produtoId)
                                .orElseThrow(() -> new NotFoundException("Produto não encontrado."));

                boolean isAdmin = usuarioAutenticado.isAdmin();
                boolean isDono = produto.getLoja().getUsuario().getId().equals(logado.getId());

                if (!isAdmin && !isDono)
                        throw new ForbiddenException("Você não tem permissão para deletar este produto.");

                produtoRepository.delete(produto);
        }

        // Marketplace — combina nome + categoriaId. Sempre filtra por status APROVADO.
        // termo é "" (nunca null) quando não há busca — evita o erro lower(bytea) no
        // PostgreSQL. Ver javadoc de ProdutoRepository.buscarMarketplace.
        @Cacheable(value = "produtos_busca")
        public com.semeia_nordeste.backend.dto.ProdutoSearchResponse buscar(String nome, Long categoriaId, String estado, String cidade, Long excluirLojaId, Pageable pageable) {
                String termo = (nome != null && !nome.isBlank()) ? nome.trim() : "";
                String uf = (estado != null && !estado.isBlank()) ? estado.trim() : null;
                String cid = (cidade != null && !cidade.isBlank()) ? cidade.trim() : null;
                
                // Concorrência: Executa 3 queries no banco em paralelo ao invés de sequencial
                CompletableFuture<Page<Produto>> produtosFuture = CompletableFuture.supplyAsync(() -> 
                        produtoRepository.buscarMarketplace(StatusProduto.APROVADO, termo, categoriaId, uf, cid, excluirLojaId, pageable)
                );
                
                CompletableFuture<java.util.List<com.semeia_nordeste.backend.dto.FacetResponse>> facetEstadosFuture = CompletableFuture.supplyAsync(() -> 
                        produtoRepository.countFacetEstados(StatusProduto.APROVADO, termo, categoriaId)
                );
                
                CompletableFuture<java.util.List<com.semeia_nordeste.backend.dto.FacetResponse>> facetCidadesFuture = CompletableFuture.supplyAsync(() -> 
                        produtoRepository.countFacetCidades(StatusProduto.APROVADO, termo, categoriaId, uf)
                );
                
                CompletableFuture.allOf(produtosFuture, facetEstadosFuture, facetCidadesFuture).join();
                
                java.util.Map<String, java.util.List<com.semeia_nordeste.backend.dto.FacetResponse>> facetas = new java.util.HashMap<>();
                try {
                        facetas.put("estados", facetEstadosFuture.get());
                        facetas.put("cidades", facetCidadesFuture.get());
                        
                        return new com.semeia_nordeste.backend.dto.ProdutoSearchResponse(
                                produtosFuture.get().map(com.semeia_nordeste.backend.dto.ProdutoResponse::fromEntity),
                                facetas
                        );
                } catch (InterruptedException | ExecutionException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Erro ao buscar produtos de forma paralela", e);
                }
        }

        public Page<Produto> listarPorLoja(Long lojaId, Pageable pageable) {
                return produtoRepository.findByLojaId(lojaId, pageable);
        }

        public Produto buscarPorId(Long id) {
                return produtoRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Produto não encontrado."));
        }

        public List<Produto> listarParaHome() {
                return produtoRepository.findUmPorLoja();
        }

        public Page<Produto> listarPendentes(Pageable pageable) {
                return produtoRepository.findByStatusOrderByDataCadastroAsc(
                                StatusProduto.PENDENTE, pageable);
        }

        @Transactional
        @CacheEvict(value = "produtos_busca", allEntries = true)
        public Produto atualizarStatus(Long produtoId, StatusProdutoRequest request) {
                Produto produto = produtoRepository.findById(produtoId)
                                .orElseThrow(() -> new NotFoundException("Produto não encontrado."));

                produto.setStatus(request.status());
                return produtoRepository.save(produto);
        }

        private Produto salvarDados(Produto p, ProdutoRequest r, Loja loja, Categoria cat) {
                p.setLoja(loja);
                p.setCategoria(cat);
                p.setNome(r.nome());
                p.setDescricao(r.descricao());
                p.setPrecoAtual(r.precoAtual());
                p.setUnidadeMedida(r.unidadeMedida());
                p.setEstoqueAtual(r.estoqueAtual() != null ? r.estoqueAtual() : 0);
                p.setPesoKg(r.pesoKg() != null ? r.pesoKg() : BigDecimal.valueOf(0.5));
                p.setImagemUrl(r.imagemUrl());
                if (p.getId() == null)
                        // Decisão de produto: novo produto nasce APROVADO para destravar a vitrine.
                        // ADMIN ainda pode REJEITAR a posteriori via PATCH /admin/produtos/{id}/status.
                        p.setStatus(StatusProduto.APROVADO);
                return produtoRepository.save(p);
        }
}
