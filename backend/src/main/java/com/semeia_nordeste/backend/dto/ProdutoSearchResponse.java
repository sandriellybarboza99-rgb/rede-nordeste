package com.semeia_nordeste.backend.dto;

import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Map;

public record ProdutoSearchResponse(
        Page<ProdutoResponse> produtos,
        Map<String, List<FacetResponse>> facetas
) {}
