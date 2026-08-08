# Plano: Facetas de Busca (Search Facets)

## 🎯 Objetivo
Implementar a funcionalidade de "Search Facets" (facetas de busca) para retornar a contagem agregada de produtos por Estado e Cidade. O objetivo é que o frontend exiba filtros dinâmicos, mostrando aos compradores apenas as localidades que efetivamente possuem produtos disponíveis de acordo com a pesquisa atual.

## 📋 Breakdown de Tarefas (Task Breakdown)

### Fase 1: Backend - DTOs e Consultas
- [ ] Criar `FacetResponse.java` com `String chave` e `Long quantidade`.
- [ ] Criar `ProdutoSearchResponse.java` para encapsular a `Page<ProdutoResponse>` e o mapa de facetas.
- [ ] Modificar `ProdutoRepository.java`:
  - Adicionar query `countByEstado` que agrupa por `loja.estado`.
  - Adicionar query `countByCidade` que agrupa por `loja.cidade`.

### Fase 2: Backend - Serviço e Controlador
- [ ] Modificar `ProdutoService.java` para chamar as agregações junto com a paginação e formatar o `ProdutoSearchResponse`.
- [ ] Modificar `ProdutoController.java` (`GET /api/produtos`) para retornar `ProdutoSearchResponse` ao invés de `Page`.

### Fase 3: Frontend - Integração na Home
- [ ] Atualizar o destructuring da resposta em `HomeComprador.tsx` (`data.produtos.content` e `data.produtos.totalPages`).
- [ ] Criar estado `facetas` (estados e cidades) no componente.
- [ ] Renderizar as opções de filtro `<select>` dinamicamente a partir dos dados do facetamento.

## 🤖 Atribuições de Agentes (Agent Assignments)
- `database-architect`: Responsável pela elaboração das queries JPQL eficientes com GROUP BY em `ProdutoRepository`.
- `backend-specialist`: Responsável pela criação dos DTOs e atualização do `ProdutoService` e `ProdutoController`.
- `frontend-specialist`: Responsável por adaptar o `HomeComprador.tsx` para consumir e renderizar as opções dinâmicas.

## ✅ Verificação (Verification Checklist)
- [ ] A API `/produtos` responde com o objeto encapsulado e a contagem correta das localidades.
- [ ] Os dropdowns de filtros no React mostram as chaves corretas e as quantidades (ex: `SE (5)`).
- [ ] A filtragem encadeada funciona (ao buscar um termo, a contagem de estados e cidades se ajusta automaticamente).
