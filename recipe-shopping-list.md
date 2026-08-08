# Plano: Lista de Mercadinho Interativa (Recipe Shopping List)

## 🎯 Objetivo
Implementar um Widget Flutuante (Drawer) na página `HomeComprador` que acompanha o usuário após ele clicar em um ingrediente de uma receita. O widget deve conter todos os ingredientes da receita, permitindo a filtragem rápida (1-clique) de novos ingredientes e oferecendo um caminho fácil de volta para a receita original.

## 🧠 Solução (Opção A)
- **Origem (`Receitas.tsx`)**: Modificar o roteamento para enviar não apenas o termo buscado, mas o objeto completo da receita via `location.state`.
- **Destino (`HomeComprador.tsx`)**: Capturar o contexto da receita e exibi-lo em um widget flutuante (Sticky Drawer) fixado no canto da tela (ou em uma barra lateral retrátil).
- **Interatividade**: Clicar nos itens do widget altera imediatamente o `termoPesquisado` e os produtos exibidos na loja.

---

## 📋 Tarefas (Task Breakdown)

### 1. Atualizar o envio de estado em `Receitas.tsx`
- No método `comprarIngrediente(ingrediente)`, incluir o envio de `receitaContexto` através do `location.state`.
- *Nota:* Isso exige passar a `receitaAberta` para a função de redirecionamento, garantindo que o título e a lista completa de ingredientes cheguem na Home.

### 2. Criar Estado para a Receita na `HomeComprador.tsx`
- Criar a variável de estado `const [receitaContexto, setReceitaContexto] = useState<any>(null);`.
- No `useEffect` de carregamento inicial (onde lê o `searchParams` e `location.state`), capturar `location.state.receitaContexto` e salvá-lo no estado.

### 3. Desenvolver o Widget Flutuante (UI)
- Construir a interface do **"🛒 Lista da Receita"** renderizada condicionalmente `if (receitaContexto)`.
- O widget deve ficar `fixed` no canto inferior direito ou como uma barra retrátil no mobile.
- Deve conter:
  - Título da Receita (ex: "Bolo de Rolo").
  - Um botão de minimizar/expandir.
  - A lista de ingredientes extraída de `receitaContexto.ingredientes`.
  - Botão de saída: "Voltar para Receitas".

### 4. Conectar o Widget ao Filtro de Produtos
- Criar a função `handleFiltroWidget(ingrediente)` na `HomeComprador.tsx`.
- Essa função deve:
  1. Limpar e extrair o nome do ingrediente (removendo "1 kg de", etc., usando a mesma lógica do `extrairTermoBusca`).
  2. Atualizar o `setBusca` e `setTermoPesquisado`.
  3. Atualizar a URL via `setSearchParams` para refletir o novo termo.
  4. Manter a categoria em "Todos".

---

## ✅ Checklist de Verificação
- [ ] O usuário clica num ingrediente da receita e é levado à Home com os produtos já filtrados por aquele ingrediente.
- [ ] O Widget Flutuante aparece na tela com o nome da receita e a lista de TODOS os ingredientes.
- [ ] O ingrediente que está sendo pesquisado fica destacado no Widget.
- [ ] Clicar em OUTRO ingrediente no widget altera o filtro da loja sem precisar recarregar a página inteira.
- [ ] O botão "Voltar para Receitas" retorna o usuário para a página `/receitas`.

---

## 📝 Questões em Aberto (Socratic Gate)
- O widget deve acompanhar o usuário se ele navegar para outras páginas (como Perfil ou Carrinho)? *(Atualmente o plano restringe o widget à `HomeComprador`)*.
- Devemos implementar a persistência desse widget caso o usuário dê um F5 na página? *(Se sim, podemos salvar o `receitaContexto` no `sessionStorage`)*.
