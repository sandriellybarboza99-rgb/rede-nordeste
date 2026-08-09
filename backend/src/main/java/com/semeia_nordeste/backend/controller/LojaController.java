package com.semeia_nordeste.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.semeia_nordeste.backend.dto.EmpreendedoraRequest;
import com.semeia_nordeste.backend.dto.LojaRequest;
import com.semeia_nordeste.backend.dto.LojaResponse;
import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.service.LojaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class LojaController {

    private final LojaService lojaService;

    public LojaController(LojaService lojaService) {
        this.lojaService = lojaService;
    }

    // Produtor cria sua loja
    @PostMapping("/produtor/loja")
    public ResponseEntity<LojaResponse> criar(
            @Valid @RequestBody LojaRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Loja loja = lojaService.criar(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(LojaResponse.fromEntity(loja));
    }

    // Produtor atualiza sua loja
    @PutMapping("/produtor/loja")
    public ResponseEntity<LojaResponse> atualizar(
            @Valid @RequestBody LojaRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Loja loja = lojaService.atualizar(request, usuario);
        return ResponseEntity.ok(LojaResponse.fromEntity(loja));
    }

    // Produtor vê sua própria loja
    @GetMapping("/produtor/loja")
    public ResponseEntity<LojaResponse> minha(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(LojaResponse.fromEntity(lojaService.buscarPorUsuario(usuario)));
    }

    // Público — qualquer um pode ver uma loja pelo id
    @GetMapping("/lojas/{id}")
    public ResponseEntity<LojaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(LojaResponse.fromEntity(lojaService.buscarPorId(id)));
    }

    // Endpoint para usuários logados verem o mural de empreendedoras (gênero = FEMININO, loja verificada)
    @GetMapping("/lojas/empreendedoras")
    public ResponseEntity<java.util.List<LojaResponse>> buscarEmpreendedoras(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(
                lojaService.buscarEmpreendedoras().stream()
                        .map(LojaResponse::fromEntity)
                        .toList());
    }

    // Produtora feminina atualiza sua foto e história pessoal no mural
    @PatchMapping("/produtor/loja/empreendedora")
    public ResponseEntity<LojaResponse> atualizarPerfilEmpreendedora(
            @Valid @RequestBody EmpreendedoraRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Loja loja = lojaService.atualizarPerfilEmpreendedora(usuario, request);
        return ResponseEntity.ok(LojaResponse.fromEntity(loja));
    }

    // Produtora remove sua foto e história do mural
    @DeleteMapping("/produtor/loja/empreendedora")
    public ResponseEntity<Void> deletarPerfilEmpreendedora(
            @AuthenticationPrincipal Usuario usuario) {
        lojaService.deletarPerfilEmpreendedora(usuario);
        return ResponseEntity.noContent().build();
    }
}