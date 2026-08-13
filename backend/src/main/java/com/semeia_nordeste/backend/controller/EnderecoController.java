package com.semeia_nordeste.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.semeia_nordeste.backend.dto.EnderecoRequest;
import com.semeia_nordeste.backend.dto.EnderecoResponse;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.service.EnderecoService;

import jakarta.validation.Valid;

/**
 * CRUD de endereços do usuário logado.
 *
 * Segurança: o service SEMPRE filtra por usuario.getId() do principal —
 * impossível listar/editar/deletar endereço de outro usuário, mesmo
 * trocando o ID na URL.
 */
@RestController
@RequestMapping("/api")
public class EnderecoController {

    private final EnderecoService service;
    private final RestTemplate restTemplate = new RestTemplate();

    public EnderecoController(EnderecoService service) {
        this.service = service;
    }

    // ── CRUD de endereços ────────────────────────────────────────────

    @GetMapping("/usuarios/enderecos")
    public ResponseEntity<List<EnderecoResponse>> listar(@AuthenticationPrincipal Usuario usuario) {
        List<EnderecoResponse> out = service.listar(usuario).stream()
                .map(EnderecoResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping("/usuarios/enderecos")
    public ResponseEntity<EnderecoResponse> criar(
            @Valid @RequestBody EnderecoRequest req,
            @AuthenticationPrincipal Usuario usuario) {
        var salvo = service.criar(req, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(EnderecoResponse.fromEntity(salvo));
    }

    @PutMapping("/usuarios/enderecos/{id}")
    public ResponseEntity<EnderecoResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody EnderecoRequest req,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(EnderecoResponse.fromEntity(service.atualizar(id, req, usuario)));
    }

    @DeleteMapping("/usuarios/enderecos/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        service.deletar(id, usuario);
        return ResponseEntity.noContent().build();
    }

    // ── Proxy ViaCEP — Público, não requer autenticação ─────────────

    /**
     * Busca dados de endereço a partir de um CEP usando a ViaCEP.
     * Endpoint público — permite o frontend preencher o form sem CORS.
     *
     * GET /api/cep/{cep}
     */
    @GetMapping("/cep/{cep}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> consultarCep(@PathVariable String cep) {
        String cepLimpo = cep.replaceAll("\\D", "");
        if (cepLimpo.length() != 8) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Tenta ViaCEP
        try {
            String url = "https://viacep.com.br/ws/" + cepLimpo + "/json/";
            Map<String, Object> dados = restTemplate.getForObject(url, Map.class);
            if (dados != null && !Boolean.TRUE.equals(dados.get("erro")) && !"true".equals(String.valueOf(dados.get("erro")))) {
                return ResponseEntity.ok(dados);
            }
        } catch (Exception ignored) {
        }

        // 2. Fallback: BrasilAPI (suporta CEPs de cidades que foram recém desmembradas/atualizadas pelos Correios)
        try {
            String urlBrasilApi = "https://brasilapi.com.br/api/cep/v1/" + cepLimpo;
            Map<String, Object> dadosBrasilApi = restTemplate.getForObject(urlBrasilApi, Map.class);
            if (dadosBrasilApi != null && dadosBrasilApi.get("city") != null) {
                java.util.Map<String, Object> adaptado = new java.util.HashMap<>();
                adaptado.put("cep", dadosBrasilApi.get("cep"));
                adaptado.put("logradouro", dadosBrasilApi.getOrDefault("street", ""));
                adaptado.put("bairro", dadosBrasilApi.getOrDefault("neighborhood", ""));
                adaptado.put("localidade", dadosBrasilApi.get("city"));
                adaptado.put("uf", dadosBrasilApi.get("state"));
                return ResponseEntity.ok(adaptado);
            }
        } catch (Exception ignored) {
        }

        // 3. Fallback: AwesomeAPI
        try {
            String urlAwesome = "https://cep.awesomeapi.com.br/json/" + cepLimpo;
            Map<String, Object> dadosAwesome = restTemplate.getForObject(urlAwesome, Map.class);
            if (dadosAwesome != null && dadosAwesome.get("city") != null) {
                java.util.Map<String, Object> adaptado = new java.util.HashMap<>();
                adaptado.put("cep", dadosAwesome.get("cep"));
                adaptado.put("logradouro", dadosAwesome.getOrDefault("address", ""));
                adaptado.put("bairro", dadosAwesome.getOrDefault("district", ""));
                adaptado.put("localidade", dadosAwesome.get("city"));
                adaptado.put("uf", dadosAwesome.get("state"));
                return ResponseEntity.ok(adaptado);
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
