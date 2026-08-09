# Bloqueio de Retirada no Carrinho

## Overview
**Domain**: Web Application (React/TypeScript)
**Project Type**: WEB
O objetivo desta funcionalidade é impedir que o usuário consiga selecionar o método de entrega "Retirar na Loja" quando no carrinho houver produtos de lojas que configuraram `aceitaRetirada` como `false`.

## Success Criteria
- [ ] O botão "Retirar na Loja" no checkout deve ficar desabilitado (disabled, opacity-50) se houver alguma loja ofendendo a regra.
- [ ] Uma mensagem de aviso informando o nome da(s) loja(s) que não permite(m) retirada deve ser exibida.
- [ ] O sistema deve forçar a seleção para "Entrega em Casa" caso o usuário chegue na tela de checkout com uma loja que não permite retirada.

## Tech Stack
- Frontend: React, TypeScript, TailwindCSS
- Backend: (Sem alterações, dado já é enviado pela API)

## File Structure
- `frontend/src/pages/Comprador/Carrinho.tsx`

## Task Breakdown

### Task 1: Estado de lojas sem retirada
- **Agent**: `@frontend-specialist`
- **Skills**: `@frontend-architecture`
- **Priority**: P1
- **Dependencies**: Nenhuma
- **Input**: `Carrinho.tsx`
- **Output**: Estado `lojasSemRetirada: string[]` no React component e lógica no `useEffect` para buscar as lojas dos produtos no carrinho. Se `l.aceitaRetirada === false`, adicionar o nome da loja ao array. Se array não for vazio e método de entrega for retirada, setar entrega.
- **Verify**: Componente atualiza o array corretamente baseado na reposta da API de lojas.

### Task 2: Bloqueio na UI
- **Agent**: `@frontend-specialist`
- **Skills**: `@frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **Input**: Estado `lojasSemRetirada`
- **Output**: Botão "Retirar na Loja" desabilitado no Passo 2 do Carrinho. Container de aviso com o texto: "A opção de retirada não está disponível pois as seguintes lojas não possuem loja física: {lojasSemRetirada.join(', ')}".
- **Verify**: A mensagem aparece na tela. O clique no botão é impedido.

## ✅ Phase X: Verification
- [ ] Rodar Lint & TypeScript Check no Frontend: `npx tsc --noEmit`
- [ ] Build Frontend: `npm run build`
- [ ] Teste Manual Local: Acessar `/carrinho` com uma loja bloqueada e tentar clicar em retirar.
