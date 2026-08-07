package com.semeia_nordeste.backend.controller;

import com.semeia_nordeste.backend.dto.*;
import com.semeia_nordeste.backend.model.*;
import com.semeia_nordeste.backend.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping("/comprador/pedidos/checkout")
    public ResponseEntity<PedidoResponse> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Pedido pedido = pedidoService.checkout(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoResponse.fromEntity(pedido));
    }

    @GetMapping("/comprador/pedidos")
    public ResponseEntity<Page<PedidoResponse>> meusPedidos(
            @AuthenticationPrincipal Usuario usuario,
            @PageableDefault(size = 10, sort = "dataPedido", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                pedidoService.listarMeusPedidos(usuario, pageable).map(PedidoResponse::fromEntity));
    }

    @GetMapping("/comprador/pedidos/{id}")
    public ResponseEntity<PedidoResponse> detalhe(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(PedidoResponse.fromEntity(pedidoService.buscarPorId(id, usuario)));
    }

    @GetMapping("/produtor/pedidos")
    public ResponseEntity<Page<PedidoResponse>> pedidosDaLoja(
            @AuthenticationPrincipal Usuario usuario,
            @PageableDefault(size = 10, sort = "dataPedido", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                pedidoService.listarPedidosDaLoja(usuario, pageable).map(PedidoResponse::fromEntity));
    }

    @PatchMapping("/produtor/pedidos/{id}/status")
    public ResponseEntity<PedidoResponse> atualizarStatus(
            @PathVariable Long id,
            @RequestParam StatusEntrega status,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(
                PedidoResponse.fromEntity(pedidoService.atualizarStatusEntrega(id, status, usuario)));
    }
}