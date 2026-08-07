# MAPA.md — Rede Nordeste

> Guia completo do sistema para alunos e novos desenvolvedores. Cobre arquitetura, como rodar, fluxos principais, modelo de dados, endpoints e o que ainda falta fazer.

---

## 1. O que é

**Rede Nordeste** é uma plataforma digital (marketplace) que conecta produtores rurais e empreendedores locais a consumidores e pequenos comerciantes. O objetivo é reduzir a dependência de atravessadores, melhorar a renda dos produtores e facilitar o acesso da população a produtos frescos, artesanais e de origem conhecida.

Três tipos de usuário convivem na mesma plataforma:

| Perfil | O que faz |
|---|---|
| **COMPRADOR** | Navega a vitrine, monta carrinho, compra, conversa com lojas, acompanha pedidos |
| **PRODUTOR** | Cadastra sua loja, gerencia produtos, recebe pedidos, atualiza status de entrega |
| **ADMIN** | Verifica lojas, modera produtos, gerencia usuários/categorias/banners/blog |

---

## 2. Arquitetura

```
+-------------------+        HTTP/JSON         +-----------------------+
|                   |  ----------------------> |                       |
|   Frontend        |                          |   Backend             |
|   React + Vite    |  <---------------------- |   Spring Boot 4       |
|   localhost:5173  |        WebSocket         |   localhost:8080      |
|                   |  <---------------------> |                       |
+-------------------+                          +-----------+-----------+
                                                           |
                                                           | JDBC
                                                           v
                                                   +----------------+
                                                   |  PostgreSQL    |
                                                   |  (Supabase ou  |
                                                   |   local)       |
                                                   +----------------+
```

- **Stateless JWT** para autenticação (access token 15 min + refresh token 24h persistido na tabela `sessoes`).
- **WebSocket STOMP** para o chat em tempo real (endpoint `/ws/chat`).
- **CORS** restrito a localhost em desenvolvimento (configurável via `.env`).

---

## 3. Tecnologias

### Backend
- Java 17
- Spring Boot 4.0.4 (Web, Security, Data JPA, WebSocket, Validation)
- PostgreSQL driver
- JJWT 0.11.5 (assinatura HS256)
- Lombok
- dotenv-java (carrega `.env` no startup)

### Frontend
- React 18 + TypeScript
- Vite 8 (dev server + build)
- Tailwind CSS v4
- React Router 7
- Axios (HTTP)
- @stomp/stompjs + sockjs-client (WebSocket)
- lucide-react (ícones)
- recharts (gráficos)

### Banco
- PostgreSQL 14+ (compatível com Supabase)

---

## 4. Estrutura do repositório

```
rede-nordeste-main/
├── .env                  Variáveis de ambiente (NÃO commitar)
├── .env.example          Template para criar o .env
├── .gitignore
├── README.md             Visão geral (para o público)
├── MAPA.md               Este arquivo (para desenvolvedores)
│
├── .dev/
│   └── raMemory.md       Histórico técnico de auditoria/iterações
│
├── sql/
│   ├── 00_reset.sql      ⚠️  APAGA TUDO do schema public (use antes de redeploy)
│   ├── 01_schema.sql     DDL completo do banco (19 tabelas + índices)
│   ├── 02_seed.sql       10 categorias + 1 banner
│   └── diagnostico.sql   SELECTs de inspeção (apenas leitura)
│
├── backend/
│   ├── run.bat / run.sh        Sobe o Spring Boot
│   ├── build.bat / build.sh    Gera o JAR
│   ├── test.bat                Roda testes
│   ├── pom.xml                 Dependências Maven
│   └── src/main/java/com/semeia_nordeste/backend/
│       ├── BackendApplication.java     Entry point (carrega .env via Dotenv)
│       ├── config/                     SecurityConfig, TokenService, SecurityFilter,
│       │                                AdminSeeder, DemoSeeder, WebSocketConfig
│       ├── controller/                 Endpoints REST
│       ├── service/                    Lógica de negócio
│       ├── repository/                 JPA Repositories
│       ├── model/                      Entidades JPA
│       ├── dto/                        Records de request/response
│       ├── exception/                  Exceptions tipadas + handler global
│       └── security/                   UsuarioAutenticado helper
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx                    Bootstrap (envolve com Providers)
        ├── App.tsx                     Rotas + Guards
        ├── index.css                   Tailwind
        ├── services/
        │   └── api.ts                  Axios + WebSocket + endpoints
        ├── context/
        │   ├── AuthContext.tsx         Sessão (localStorage + reativo)
        │   └── ToastContext.tsx        Sistema de notificações
        ├── components/ui/              Button, Input, Card, Modal,
        │                                BottomTabBar, UserMenu
        └── pages/
            ├── Home/                   Landing page pública
            ├── Auth/                   Login + Cadastro
            ├── Comprador/              Vitrine, carrinho, perfil, chat
            ├── Vendedor/               Painel, dashboard, CRUD produtos
            ├── Admin/                  Painel administrativo (5 abas)
            └── Blog/                   Lista e detalhe de notícias
```

---

## 5. Como rodar localmente (passo a passo)

### Pré-requisitos
- **Java 17+** (`java -version`)
- **Maven 3.8+** (ou use o `mvnw` que já vem no repo)
- **Node 18+** (`node -v`)
- **PostgreSQL 14+** (local) **ou** uma conta Supabase

### Passo 1 — Banco

#### Opção A: PostgreSQL local
```bash
# Cria o banco
psql -U postgres -c "CREATE DATABASE rede_nordeste;"

# (Opcional) Reset: se já tem tabelas antigas, apaga tudo do public
psql -U postgres -d rede_nordeste -f sql/00_reset.sql

# Aplica o schema
psql -U postgres -d rede_nordeste -f sql/01_schema.sql

# Aplica o seed (categorias + banner)
psql -U postgres -d rede_nordeste -f sql/02_seed.sql
```

#### Opção B: Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. (Opcional) No SQL Editor, cole `sql/00_reset.sql` e rode — apaga tudo do schema `public` se já existir.
3. Cole o conteúdo de `sql/01_schema.sql` e rode.
4. Cole `sql/02_seed.sql` e rode.

> ⚠️ Sempre que você atualizar o repo e o backend reclamar de tabela inexistente (`relation "public.X" does not exist`), rode `00_reset.sql` + `01_schema.sql` + `02_seed.sql` nesta ordem. O DemoSeeder se encarrega de repopular os dados de demonstração.

### Passo 2 — Variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`. Valores mínimos para rodar local:
```env
DB_URL=jdbc:postgresql://localhost:5432/rede_nordeste
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_local
JWT_SECRET=uma_string_aleatoria_de_pelo_menos_32_caracteres!!
CORS_ALLOWED_ORIGINS=http://localhost:5173

ADMIN_SEED_EMAIL=admin@redenordeste.com
ADMIN_SEED_SENHA=RedeNordeste@2026
ADMIN_SEED_FORCAR_RESET=true

DEMO_SEED=true
DEMO_SENHA=Demo@2026

VITE_API_URL=http://localhost:8080/api
```

### Passo 3 — Backend (terminal 1)

```bash
cd backend
./run.bat        # Windows
./run.sh         # Linux/Mac

# Aguarde aparecer:
#   [AdminSeeder] ADMIN criado: admin@redenordeste.com
#   [DemoSeeder]  DEMO pronto. Login produtor: ...
#   Started BackendApplication in X.XXX seconds
```

### Passo 4 — Frontend (terminal 2)

```bash
cd frontend
npm install      # primeira vez
npm run dev

# Abrirá http://localhost:5173
```

### Passo 5 — Login

Use qualquer um dos usuários criados automaticamente pelos seeders:

| Perfil | E-mail | Senha |
|---|---|---|
| **ADMIN** | `admin@redenordeste.com` | `RedeNordeste@2026` |
| **PRODUTOR** | `demo.produtor@redenordeste.com` | `Demo@2026` |
| **COMPRADOR** | `demo.comprador@redenordeste.com` | `Demo@2026` |

---

## 6. Quem cria quais dados

| Dado | Origem | Frequência |
|---|---|---|
| Tabelas | `sql/01_schema.sql` | uma vez, manual |
| 10 categorias + 1 banner | `sql/02_seed.sql` | uma vez, manual |
| Usuário ADMIN | `AdminSeeder.java` | a cada startup do backend |
| Produtor/comprador/loja demo + 3 produtos | `DemoSeeder.java` (se `DEMO_SEED=true`) | uma vez, no startup |
| Usuários reais | fluxo `/cadastro` | uso normal |

**Decisão central:** tudo que envolve senha BCrypt é criado em Java, usando `BCryptPasswordEncoder` real. Nada de hash hardcoded em SQL.

---

## 7. Modelo de dados (resumo)

Tabelas principais e o que cada uma armazena. Detalhes completos no [`sql/01_schema.sql`](sql/01_schema.sql).

| Tabela | Função | Campos-chave |
|---|---|---|
| `usuarios` | identidade + autenticação | id, email, cpf_cnpj, telefone, senha_hash (BCrypt), tipo_perfil, conta_ativa, data_ultimo_login |
| `sessoes` | refresh tokens persistidos (revogáveis) | id, usuario_id, refresh_token, criado_em, expira_em, revogado_em |
| `lojas` | uma por produtor | id, usuario_id (UNIQUE), nome_loja, cidade, latitude, longitude, **verificada**, **suspensa** |
| `categorias` | classificação de produtos | id, nome (UNIQUE) |
| `produtos` | itens à venda | id, loja_id, categoria_id, nome, preco_atual, estoque, **status** (APROVADO/PENDENTE/REJEITADO) |
| `item_carrinho` | carrinho do comprador antes do checkout | usuario_id, produto_id, quantidade |
| `pedidos` | pedidos finalizados | id, comprador_id, valor_total, pagamento_id, entrega_id |
| `item_pedido` | itens dentro de um pedido | preço travado no momento da compra |
| `pagamentos` | método e status do pagamento | metodo_pagamento, status_pagamento (AGUARDANDO/APROVADO/REJEITADO/ESTORNADO) |
| `entregas` | dados logísticos | status_entrega (PEDIDO_RECEBIDO → ENTREGUE), endereço, distância, frete |
| `entregadores` | cadastro de entregadores | tipo_veiculo, cidade, ativo, disponivel |
| `chats` + `mensagens` | conversa entre comprador e loja | um chat por par (comprador, loja) |
| `receitas` + `receita_ingredientes` | conteúdo culinário com produtos da plataforma | M2M com `produtos` |
| `banners_home` | carrossel da home pública | título, imagem, ordem, ativo |
| `noticias` | blog gerenciado pelo admin | título, descrição, publicada |

---

## 8. Endpoints da API (mapa)

Todos sob o prefixo `/api`. Coluna **Auth**: `público` = sem token, `auth` = qualquer logado, `ADMIN`/`PRODUTOR`/`COMPRADOR` = perfil específico.

### Autenticação
| Método | Caminho | Auth | O que faz |
|---|---|---|---|
| POST | `/usuarios/registrar` | público | cadastra usuário (rejeita ADMIN) |
| POST | `/usuarios/login` | público | retorna access + refresh + nome + email + perfil |
| POST | `/usuarios/refresh` | público | rotaciona o refresh token |
| POST | `/usuarios/logout` | auth | revoga a sessão atual |
| GET | `/usuarios/me` | auth | dados do usuário logado |

### Catálogo público
| Método | Caminho | Auth |
|---|---|---|
| GET | `/produtos` (busca por nome+categoria, paginado) | público |
| GET | `/produtos/{id}` | público |
| GET | `/produtos/home` (1 por loja, estilo Shopee) | público |
| GET | `/lojas/{id}` | público |
| GET | `/lojas/{id}/produtos` | público |
| GET | `/categorias` | público |
| GET | `/banners` | público |
| GET | `/noticias`, `/noticias/{id}` | público |
| GET | `/receitas`, `/receitas/{id}` | público |
| POST | `/frete/simular` | público |
| POST | `/entregadores/cadastrar` | público |

### Comprador
| Método | Caminho |
|---|---|
| GET / POST / DELETE | `/comprador/carrinho` (CRUD) |
| DELETE | `/comprador/carrinho/{produtoId}` |
| POST | `/comprador/pedidos/checkout` |
| GET | `/comprador/pedidos` |
| GET | `/comprador/pedidos/{id}` |
| POST | `/comprador/chats/abrir?lojaId=` |
| GET | `/comprador/chats` |

### Produtor
| Método | Caminho |
|---|---|
| POST / PUT / GET | `/produtor/loja` |
| POST / PUT / DELETE | `/produtor/produtos` (CRUD) |
| GET / PATCH | `/produtor/pedidos` (lista + avançar status) |
| POST / PUT / DELETE | `/produtor/receitas` (CRUD) |
| GET | `/produtor/chats` |

### Admin
| Método | Caminho |
|---|---|
| GET | `/admin/metricas` |
| GET / PATCH | `/admin/usuarios` (lista + atualizar perfil/suspender/reset senha) |
| GET | `/admin/lojas` + `/admin/lojas/pendentes` |
| PATCH | `/admin/lojas/{id}/verificar` / `/suspender` / `/reativar` |
| GET / PATCH | `/admin/produtos/pendentes` + `/admin/produtos/{id}/status` |
| POST / PUT / DELETE | `/admin/categorias` (CRUD) |
| GET / POST / PUT / DELETE | `/admin/banners` (CRUD) |
| GET / POST / PUT / DELETE | `/admin/noticias` (CRUD) |

### Chat (qualquer autenticado)
| Método | Caminho |
|---|---|
| GET / POST | `/chats/{chatId}/mensagens` |
| GET | `/chats/nao-lidas` |
| STOMP | `/app/chat/{chatId}` (envio via WebSocket) |
| STOMP | `/topic/chat/{chatId}` (assinatura) |

---

## 9. Fluxos passo a passo

### 9.1. Cadastro
1. Aluno preenche `/cadastro` no frontend.
2. Front envia `POST /api/usuarios/registrar` com senha em texto puro (HTTPS em produção).
3. Backend valida com `@Valid` (e-mail, senha mínimo 8 chars etc.).
4. Backend hasha a senha com **BCrypt cost 10** (cada hash é única — inclui salt aleatório).
5. Backend salva com `conta_ativa = true`.
6. Backend retorna 201; front redireciona para `/login`.

> Rejeita `tipoPerfil=ADMIN` com 403 — defesa contra privilege escalation.

### 9.2. Login
1. Aluno preenche `/login`.
2. Front envia `POST /api/usuarios/login`.
3. Backend busca por e-mail, valida senha com `passwordEncoder.matches(...)`.
4. Gera **access token** (15 min, claim `tipo=access`) + **refresh token** (24h, claim `tipo=refresh`).
5. Persiste o refresh em `sessoes` (IP, user-agent, expiração).
6. Atualiza `usuarios.data_ultimo_login`.
7. Retorna `{accessToken, refreshToken, nome, email, perfil}`.
8. Front salva via `AuthContext.login(...)` → localStorage + re-render global.
9. Redireciona conforme `perfil`: ADMIN→`/admin`, PRODUTOR→`/home2`, COMPRADOR→`/home2`.

### 9.3. Request autenticado
1. Axios interceptor anexa `Authorization: Bearer <accessToken>`.
2. `SecurityFilter` (backend) valida o token (assinatura + expiração + `tipo=access`).
3. Busca o usuário pelo e-mail (subject do JWT), popula `SecurityContextHolder`.
4. `SecurityConfig` autoriza pela `tipo_perfil` (`hasAuthority("COMPRADOR")` etc.).
5. Controller recebe `@AuthenticationPrincipal Usuario usuario`.

### 9.4. Refresh (access expirou)
1. Backend retorna 401.
2. Axios interceptor detecta 401 **e** que a URL **não** é `/usuarios/login|registrar|refresh`.
3. Faz `POST /usuarios/refresh` com o refresh atual.
4. Backend valida: assinatura, `tipo=refresh`, e que **consta em `sessoes` não revogado/expirado**.
5. **Rotação obrigatória:** revoga o antigo (`revogado_em = NOW()`) + cria um novo.
6. Front salva os tokens novos, repete a request original.

### 9.5. Logout
1. Aluno clica "Sair" no UserMenu.
2. Front envia `POST /usuarios/logout` com o refresh.
3. Backend marca a sessão como revogada.
4. Front limpa localStorage + reseta AuthContext.
5. Redireciona para `/login`.

### 9.6. Onboarding de vendedor
1. Vendedor se cadastra como PRODUTOR.
2. Loga e vai para `/home2` (vitrine) ou `/painelvendedor`.
3. `/painelvendedor` detecta que ele não tem loja → wizard de criação obrigatório.
4. Vendedor preenche dados da loja (incluindo lat/long via "Usar minha localização").
5. Loja nasce com `verificada=false` → produtos não aparecem na vitrine pública.
6. ADMIN verifica a loja pelo painel.
7. Vendedor cadastra produtos → aparecem na vitrine pública imediatamente (status `APROVADO`).

### 9.7. Compra
1. COMPRADOR navega na vitrine `/home2`.
2. Adiciona itens ao carrinho (`POST /comprador/carrinho`).
3. Vai para `/carrinho`, ajusta quantidades, faz checkout.
4. Backend cria `pedido` + `item_pedido` (preço travado) + `pagamento` + `entrega`.
5. PRODUTOR vê o pedido no painel, avança status (PEDIDO_RECEBIDO → ENTREGUE).

---

## 10. Segurança — camadas

| Camada | Onde | O que protege |
|---|---|---|
| BCrypt cost 10 | `UsuarioService` | senha em repouso (resistente a brute-force) |
| HS256 + segredo de 32+ chars | `TokenService` | falsificação de token |
| Access curto (15 min) | `TokenService` | janela de exploração se vazado |
| Refresh com rotação obrigatória | `SessaoService.rotacionar` | replay de refresh roubado |
| Tabela `sessoes` revogável | `SessaoService` | logout efetivo + admin força logout |
| Autorização por perfil | `SecurityConfig.hasAuthority(...)` | acesso indevido a rotas |
| Bean Validation (`@Valid`) | DTOs | dados malformados |
| `GlobalExceptionHandler` tipado | backend | 401 / 403 / 404 / 422 distintos |
| Bloqueio de `tipoPerfil=ADMIN` no registro | `UsuarioService` | privilege escalation |
| AuthContext valida perfil contra whitelist | front | localStorage corrompido |
| CORS allowlist (não `*`) | `SecurityConfig` | requests cross-origin não autorizados |
| Senha mínimo 8 chars | DTO | senha trivial |

### Pontos de discussão honesta para a aula
1. **JWT em localStorage** é vulnerável a XSS. Alternativa: `httpOnly cookie` + CSRF token. Trade-off entre simplicidade e segurança.
2. **Por que rotacionar refresh?** Se atacante usar antes da vítima, a vítima detecta no próximo refresh (sessão revogada).
3. **15 min de access** é trade-off entre UX (não pedir relogin) e janela de exploração.
4. **`conta_ativa = TRUE` direto** facilita a aula; em produção real, confirmar por e-mail.
5. **Validação no front é UX**, não segurança — segurança real é no backend.
6. **Não há rate limit** em `/login` (próxima iteração).

---

## 11. Como criar um usuário ADMIN — três caminhos

### Caminho A (recomendado): `AdminSeeder.java`
Está em [`backend/src/main/java/com/semeia_nordeste/backend/config/AdminSeeder.java`](backend/src/main/java/com/semeia_nordeste/backend/config/AdminSeeder.java). Lê do `.env`:
```env
ADMIN_SEED_EMAIL=admin@redenordeste.com
ADMIN_SEED_SENHA=RedeNordeste@2026
ADMIN_SEED_FORCAR_RESET=true
```
A cada startup do backend, garante que esse usuário existe e tem a senha do `.env`.

### Caminho B: Promover via painel admin
Logado como ADMIN, vá em `/admin` → aba **Usuários** → clique em **Promover Admin** ao lado do usuário desejado. A UI confirma e o backend chama `PATCH /api/admin/usuarios/{id}` com `tipoPerfil=ADMIN`. Todas as sessões ativas do usuário são revogadas (ele precisa logar de novo).

### Caminho C: SQL direto (não recomendado)
```sql
INSERT INTO usuarios (...) VALUES (..., '<hash_BCrypt_real>', 'ADMIN', ...);
```
A hash precisa ser gerada via `BCryptPasswordEncoder` — não dá pra digitar à mão. Foi essa a causa do bug "Sessão expirada" da iteração inicial. **Bom exemplo de o que NÃO fazer.**

### O que está bloqueado intencionalmente
- `POST /api/usuarios/registrar` com `tipoPerfil=ADMIN` → 403 Forbidden.

---

## 12. Telas de login — quantas?

**Uma só:** `/login` ([`frontend/src/pages/Auth/Login.tsx`](frontend/src/pages/Auth/Login.tsx)).

Redirect pós-login depende do `perfil` retornado pelo backend:
| Perfil | Vai para |
|---|---|
| ADMIN | `/admin` |
| PRODUTOR | `/home2` |
| COMPRADOR | `/home2` |

Não há `/login-admin` ou `/login-vendedor`. Mesma rota, mesmo formulário, mesmos endpoints — a separação acontece **no token** (claim `perfil`) e **nos guards** do front (`<RotaProtegida permitidos={['COMPRADOR']}>`).

---

## 13. Design System

### Paleta
| Cor | Hex | Uso |
|---|---|---|
| Verde musgo | `#55833d` | Botão primário, ações de produtor |
| Laranja | `#f9943b` | Accent, ações de comprador, ADMIN |
| Azul índigo | `#394158` | Texto, headers, sidebar admin |
| Bege | `#F5F2ED` | Background |
| Vermelho granada | `#802D44` | Favorito, ícones especiais |
| Vermelho | `#ef4444` | Danger, suspender |

### Componentes (em [`frontend/src/components/ui/`](frontend/src/components/ui/))
- **`Button`** — variants: `primary`, `secondary`, `ghost`, `danger`, `warning` × sizes: `sm`, `md`, `lg`; `loading`, `iconLeft`, `iconRight`, `fullWidth`.
- **`FormField`** — input + label + erro + hint + ícones.
- **`Card`** — container com 3 paddings + opção `hover`.
- **`Modal`** — bottom-sheet em mobile, centralizado em desktop, fecha com ESC.
- **`Toast`** (via `ToastContext`) — 4 variantes (success/error/info/warning), auto-dismiss 4s, posicionamento responsivo.
- **`BottomTabBar`** — navegação fixa em mobile only, badges numéricos.
- **`UserMenu`** — dropdown com nome + perfil + Sair, em todo header autenticado.
- **`PageHeader`** — header sticky reutilizável com botão voltar inteligente (`navigate(-1)`, rota fixa ou callback), título, subtítulo, slot de ações. Padroniza navegação em todas as telas internas (DRY).
- **`StatusBadge`** — pill de status reutilizável (verificada/pendente/suspensa/rejeitada/ativa/inativa).
- **`ProfileHero`** — hero card de página de perfil com gradiente por perfil (vendedor/comprador/admin) + foto + nome + badge + CTA.

### Mobile-first
- Bottom Tab Bar em mobile (padrão app nativo).
- Header com hamburger lateral em mobile, horizontal em desktop.
- Modais viram bottom-sheets em telas pequenas.
- Breakpoint principal: `md` (768px).

---

## 14. Estado de sessão no frontend

Toda lógica de sessão passa pelo **`AuthContext`** ([`frontend/src/context/AuthContext.tsx`](frontend/src/context/AuthContext.tsx)):
- Lê localStorage uma única vez na montagem do app.
- Sincroniza entre abas via `storage` event.
- Valida `perfil` contra whitelist (`ADMIN`, `PRODUTOR`, `COMPRADOR`); se inválido, limpa tudo.
- Expõe `usuario`, `perfil`, `estaLogado`, `login()`, `logout()`, `atualizarTokens()`.

### Como usar em um componente
```tsx
import { useAuth } from '../context/AuthContext';

function MeuComponente() {
  const { usuario, estaLogado, logout } = useAuth();
  if (!estaLogado) return <Navigate to="/login" />;
  return <>Olá {usuario.nome} ({usuario.email})</>;
}
```

### Como proteger uma rota
```tsx
// App.tsx
<Route path="/carrinho" element={
  <RotaProtegida permitidos={['COMPRADOR']}>
    <Carrinho />
  </RotaProtegida>
} />
```
ADMIN passa em qualquer rota (modo impersonate). Outros perfis são redirecionados para sua home com toast amigável.

---

## 15. Troubleshooting comum

### "Sessão expirada. Faça login novamente." ao tentar logar
**Causa provável:** senha errada (o front antigo mascarava o erro).
**Verificar:** abra o DevTools → Network → veja a resposta do POST `/usuarios/login`. Se for 401, a senha está errada mesmo.
**Solução:** confira `ADMIN_SEED_SENHA` no `.env` e reinicie o backend. O `AdminSeeder` regenera a hash.

### Backend não conecta no banco
**Verificar:** `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` no `.env`. Em PostgreSQL local, normalmente `DB_URL=jdbc:postgresql://localhost:5432/rede_nordeste`.
**Teste:** `psql -U postgres -d rede_nordeste -c "SELECT 1"`. Se falhar aqui, o problema é o postgres.

### Vitrine vazia mesmo com produtos no banco
**Verificar:**
1. Loja está `verificada=true`? (`SELECT verificada, suspensa FROM lojas`)
2. Produto está `status='APROVADO'`? (`SELECT status FROM produtos`)
3. Rode `sql/diagnostico.sql` para um diagnóstico completo.

### Tudo redireciona para /admin (problema da iteração inicial)
**Causa:** localStorage com sessão fantasma de teste anterior.
**Solução rápida:** DevTools → Application → Local Storage → limpe `usuarioLogado` ou clique em "Sair" no UserMenu.

### `npm install` falha no Windows
**Solução:** use PowerShell como administrador uma vez, ou rode `npm install --legacy-peer-deps`.

### `mvnw.cmd` não roda
**Solução:** garanta Java 17 instalado (`java -version`). Se necessário, defina `JAVA_HOME`.

### Frontend dá erro de TypeScript
**Solução:** os pacotes `typescript` e `@types/*` estão em devDependencies. Rode `npm install` no `frontend/`. Para validar tipos: `npx -p typescript@5.6 tsc --noEmit`.

---

## 16. Sequência de iterações já feitas

| Versão | Data | Mudança principal |
|---|---|---|
| 1.0.0 | 2026-05-25 | Auditoria inicial — identificação do bug "marketplace vazio" + 8 cenários |
| 1.1.0 | 2026-05-25 | Exceptions tipadas, refresh corrigido, produto nasce APROVADO, .env carregado |
| 1.2.0 | 2026-05-26 | Painel admin, sessões persistidas, AuthContext+Toast, BottomTabBar, wizard de loja, verificação formal de vendedores |
| 1.2.1 | 2026-05-26 | Patch login admin (AdminSeeder + interceptor não dispara refresh em /login) |
| 1.3.0 | 2026-05-26 | Reorganização /docs → /sql; DemoSeeder com BCrypt real |
| 1.3.1 | 2026-05-26 | Botão "Promover Admin" no painel; `email` no AuthResponse |

Histórico técnico completo em [`.dev/raMemory.md`](.dev/raMemory.md).

---

## 17. Pendências e tarefas para alunos

### Prioridade alta
- [ ] **Checkout completo:** modal de seleção de pagamento (PIX/Cartão/Dinheiro mock) + endereço + confirmação.
- [ ] **Tela "Meus pedidos"** do comprador com timeline de status.
- [ ] **Confirmar pagamento** no painel do produtor (botão "marcar como pago" no pedido).
- [ ] **Tela /403** dedicada (hoje redireciona silencioso para a home).
- [ ] **Implementar "esqueci minha senha":** endpoint backend + envio de e-mail + tela de reset.

### Prioridade média
- [ ] **Rate limit** em `/login` e `/refresh` (Bucket4j).
- [ ] **Confirmação de e-mail** no cadastro (`conta_ativa = false` até clicar no link).
- [ ] **Audit log** de ações administrativas (quem aprovou loja X, quando).
- [ ] **Tela "minhas sessões"** para o usuário revogar sessões individuais.
- [ ] **Migrar lista estática `EMPREENDEDORAS`** do front para uma tabela no backend.
- [ ] **Upload de imagens via Supabase Storage** (hoje é base64 no banco — funcional, mas pesado).
- [ ] **Migrar todos os `alert()`** restantes para `useToast()`.

### Prioridade baixa
- [ ] **Polling fallback** para notificações + chat (quando WebSocket cair).
- [ ] **Storybook** dos componentes UI.
- [ ] **Gráfico de vendas** no painel do produtor (recharts já está no `package.json`).
- [ ] **Filtros avançados** no painel admin (por estado, por data, por perfil).
- [ ] **Exportação CSV** de usuários e pedidos.
- [ ] **Typing indicators** no chat (`/app/chat/{chatId}/typing`).

### Sugestões de aprendizado guiado
1. **Implemente o checkout** — exercício completo de fluxo (form + transação + estoque + carrinho).
2. **Adicione confirmação por e-mail** — você vai aprender envio de e-mail + tokens de uso único.
3. **Implemente rate limit em /login** — bom para discutir DoS e defesa em camadas.
4. **Migre lista de empreendedoras para o backend** — pratique CRUD completo (entidade + repo + service + controller + DTO + UI admin).

---

## 18. Glossário

| Termo | Significado no projeto |
|---|---|
| **JWT** | JSON Web Token — string assinada que prova identidade. Composta por header + payload (claims) + signature. |
| **Access token** | JWT curto (15 min) enviado em todo request via header `Authorization: Bearer ...`. |
| **Refresh token** | JWT longo (24h) usado **só** para obter um novo access. Persistido em `sessoes` para revogação. |
| **Rotação** | Toda vez que o refresh é usado, ele é invalidado e um novo é gerado. Detecta roubo. |
| **BCrypt** | Algoritmo de hash de senhas com salt aleatório + custo configurável. Resistente a brute-force. |
| **CORS** | Cross-Origin Resource Sharing — controla quais origens (domínios) podem chamar a API. |
| **CSRF** | Cross-Site Request Forgery — não aplicável aqui porque usamos JWT em header (não cookie). |
| **STOMP** | Protocolo de mensageria sobre WebSocket. Usado para o chat. |
| **DTO** | Data Transfer Object — record Java que representa request/response, separado da entidade. |
| **Seeder** | Classe Java que popula o banco no startup (`AdminSeeder`, `DemoSeeder`). |
| **Privilege escalation** | Atacante consegue subir o próprio perfil (ex: virar ADMIN). Bloqueado em `UsuarioService.registrar`. |
| **Impersonate (na nossa convenção)** | ADMIN pode acessar qualquer rota (inclusive `/home2` e `/home2`). Para diagnosticar problemas dos outros perfis. |

---

## 19. Como pedir ajuda

1. Antes de tudo, rode `sql/diagnostico.sql` no banco e capture o resultado.
2. Verifique os logs do backend (terminal onde rodou `run.bat`).
3. Verifique o console do navegador (F12 → Console e Network).
4. Anote: **o que tentou fazer**, **o que aconteceu**, **o que esperava**.
5. Consulte [`.dev/raMemory.md`](.dev/raMemory.md) — provavelmente algum problema parecido já foi diagnosticado.

---

**Bom trabalho!** Esse documento é vivo — atualize sempre que o sistema mudar.
