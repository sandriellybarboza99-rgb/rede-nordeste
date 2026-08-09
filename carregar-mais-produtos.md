# Plano de Implementação: Paginação "Carregar Mais" Produtos

Para evitar o sobrecarregamento visual e computacional da página `HomeComprador.tsx`, a exibição dos produtos será limitada a 20 itens por vez. Caso existam mais de 20 produtos no banco de dados para os filtros selecionados, um botão "Carregar mais" será exibido ao final da grade de produtos.

---

## 📋 Resumo da Solução

O backend Spring Boot já possui o padrão de paginação de 20 em 20 itens (`size = 20`).
No frontend (`HomeComprador.tsx`), ajustaremos o fluxo de estado para:
1. **Reset em Filtros**: Ao mudar de categoria, digitar na busca ou alterar o filtro de estado/cidade, recarregar a primeira página (página 0) e substituir a lista.
2. **Acúmulo de Produtos ("Carregar mais")**: Ao clicar no botão ao final da página, buscar a página seguinte (`paginaAtual + 1`) e **anexar (append)** os novos 20 produtos aos produtos existentes na tela.
3. **Indicador Visual de Carregamento**: Exibir feedback visual no próprio botão ("Carregando mais produtos...") enquanto a requisição da nova página é efetuada, sem ocultar os produtos já carregados.

---

## 🛠️ Modificações Propostas

### 1. Frontend: `HomeComprador.tsx`

#### [MODIFY] [HomeComprador.tsx](file:///c:/Users/Kaylane%20Dias/Documents/Projetos/rede-nordeste/frontend/src/pages/Comprador/HomeComprador.tsx)

- **Novo Estado**:
  - `carregandoMais`: `boolean` (indica se a requisição de "Carregar mais" está em andamento).

- **Ajustes no efeito `carregar`**:
  - Ao alterar filtros (`catAtivaId`, `termoPesquisado`, `estadoFiltro`, `cidadeFiltro`), garantir reset de `paginaAtual` para `0` e substituição da lista de produtos.

- **Nova Função `handleCarregarMais`**:
  - Incrementar `paginaAtual`.
  - Disparar `buscarProdutos` passando a nova página.
  - Anexar novos produtos: `setProdutos(prev => [...prev, ...novosProdutos])`.
  - Atualizar `totalPaginas` e cache em memória.

- **Componente Visual do Botão "Carregar Mais"**:
  - Renderizado logo abaixo do grid de produtos.
  - Exibido se `!carregando` e `paginaAtual < totalPaginas - 1`.
  - Estilizado no tema do projeto (`bg-[#55833d] hover:bg-[#466e32] text-white font-bold py-3 px-8 rounded-full shadow-md`).

---

## 🧪 Plano de Verificação

### Testes Manuais
1. **Carregamento Inicial**: Acessar a página e verificar se os primeiros 20 produtos são exibidos.
2. **Exibição do Botão**: Confirmar se o botão "Carregar mais produtos" aparece ao final da lista (caso haja mais de 20 produtos cadastrados).
3. **Ação de Carregar Mais**: Clicar no botão e verificar se os próximos produtos são adicionados ao final da grade sem que a página dê "flicker" ou resete a barra de rolagem.
4. **Resets de Filtro**: Filtrar por uma cidade ou clicar em uma categoria específica e checar se o estado reseta para os primeiros 20 itens do filtro correspondente.
5. **Ocultamento do Botão**: Quando a última página for atingida (`paginaAtual === totalPaginas - 1`), confirmar que o botão desaparece suavemente.
