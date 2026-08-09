package com.semeia_nordeste.backend.controller;

import java.util.List;

import com.semeia_nordeste.backend.dto.ProdutoRequest;
import com.semeia_nordeste.backend.dto.ProdutoResponse;
import com.semeia_nordeste.backend.dto.StatusProdutoRequest;
import com.semeia_nordeste.backend.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ProdutoController {

        private final ProdutoService produtoService;

        public ProdutoController(ProdutoService produtoService) {
                this.produtoService = produtoService;
        }

        // ── Home — público ────────────────────────────────────────────
        @GetMapping("/produtos/home")
        public ResponseEntity<List<ProdutoResponse>> home() {
                return ResponseEntity.ok(
                                produtoService.listarParaHome().stream()
                                                .map(ProdutoResponse::fromEntity)
                                                .toList());
        }

        // ── Admin — pendentes ─────────────────────────────────────────
        @GetMapping("/admin/produtos/pendentes")
        public ResponseEntity<Page<ProdutoResponse>> pendentes(
                        @PageableDefault(size = 20, sort = "dataCadastro") Pageable pageable) {
                return ResponseEntity.ok(
                                produtoService.listarPendentes(pageable)
                                                .map(ProdutoResponse::fromEntity));
        }

        // ── Admin — aprova ou rejeita ─────────────────────────────────
        @PatchMapping("/admin/produtos/{id}/status")
        public ResponseEntity<ProdutoResponse> atualizarStatus(
                        @PathVariable Long id,
                        @Valid @RequestBody StatusProdutoRequest request) {
                return ResponseEntity.ok(
                                ProdutoResponse.fromEntity(produtoService.atualizarStatus(id, request)));
        }

        // ── Produtor — CRUD ───────────────────────────────────────────
        @PostMapping("/produtor/produtos")
        public ResponseEntity<ProdutoResponse> criar(
                        @Valid @RequestBody ProdutoRequest request) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ProdutoResponse.fromEntity(produtoService.criar(request)));
        }

        @PutMapping("/produtor/produtos/{id}")
        public ResponseEntity<ProdutoResponse> atualizar(
                        @PathVariable Long id,
                        @Valid @RequestBody ProdutoRequest request) {
                return ResponseEntity.ok(
                                ProdutoResponse.fromEntity(produtoService.atualizar(id, request)));
        }

        @DeleteMapping("/produtor/produtos/{id}")
        public ResponseEntity<Void> deletar(@PathVariable Long id) {
                produtoService.deletar(id);
                return ResponseEntity.noContent().build();
        }

        // ── Público ───────────────────────────────────────────────────
        @GetMapping("/lojas/{lojaId}/produtos")
        public ResponseEntity<Page<ProdutoResponse>> listarPorLoja(
                        @PathVariable Long lojaId,
                        @PageableDefault(size = 20, sort = "dataCadastro") Pageable pageable) {
                return ResponseEntity.ok(
                                produtoService.listarPorLoja(lojaId, pageable)
                                                .map(ProdutoResponse::fromEntity));
        }

        @GetMapping("/produtos")
        public ResponseEntity<com.semeia_nordeste.backend.dto.ProdutoSearchResponse> buscar(
                        @RequestParam(required = false) String nome,
                        @RequestParam(required = false) Long categoriaId,
                        @RequestParam(required = false) String estado,
                        @RequestParam(required = false) String cidade,
                        @RequestParam(required = false) Long excluirLojaId,
                        @PageableDefault(size = 20, sort = "dataCadastro") Pageable pageable) {
                return ResponseEntity.ok(produtoService.buscar(nome, categoriaId, estado, cidade, excluirLojaId, pageable));
        }

        @GetMapping("/produtos/{id}")
        public ResponseEntity<ProdutoResponse> buscarPorId(@PathVariable Long id) {
                return ResponseEntity.ok(
                                ProdutoResponse.fromEntity(produtoService.buscarPorId(id)));
        }
}