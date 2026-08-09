import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const STORAGE_KEY = "usuarioLogado";
const STORAGE_LIXOS = [
  "user_role",
  "mock_carrinho",
  "tutorial_visto_comprador",
  "tutorial_visto_vendedor",
  "favoritos_itens",
];

// ============================================================
// INSTÂNCIA BASE
// ============================================================
export const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8090/api",
  headers: { "Content-Type": "application/json" },
});

// ============================================================
// INTERCEPTOR — injeta token em toda requisição
// ============================================================
apiService.interceptors.request.use((config) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const dados = JSON.parse(raw);
      if (dados?.accessToken) {
        config.headers.Authorization = `Bearer ${dados.accessToken}`;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return config;
});

const limparSessaoLocal = () => {
  localStorage.removeItem(STORAGE_KEY);
  STORAGE_LIXOS.forEach((k) => localStorage.removeItem(k));
};

const AUTH_PUBLIC_PATHS = [
  "/usuarios/login",
  "/usuarios/registrar",
  "/usuarios/refresh",
];
const isAuthPublic = (url?: string) =>
  !!url && AUTH_PUBLIC_PATHS.some((p) => url.includes(p));

// ============================================================
// INTERCEPTOR — trata erros e faz refresh automático
// ============================================================
// Estado compartilhado para serializar refreshes concorrentes.
// Se múltiplas requests retornam 401 ao mesmo tempo, todas esperam
// o mesmo promise de refresh em vez de cada uma tentar por conta própria.
let refreshingPromise: Promise<string> | null = null;

apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthPublic(original?.url)
    ) {
      original._retry = true;
      try {
        // Se já há um refresh em andamento, aguarda o mesmo promise
        if (!refreshingPromise) {
          refreshingPromise = (async () => {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) throw new Error("Sem sessão");

            const dados = JSON.parse(raw);
            const baseURL =
              import.meta.env.VITE_API_URL || "http://localhost:8090/api";
            const res = await axios.post(`${baseURL}/usuarios/refresh`, {
              refreshToken: dados.refreshToken,
            });

            const novos = { ...dados, ...res.data };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(novos));
            window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
            return res.data.accessToken as string;
          })().finally(() => {
            refreshingPromise = null;
          });
        }

        const newToken = await refreshingPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiService(original);
      } catch {
        limparSessaoLocal();
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Sessão expirada. Faça login novamente."),
        );
      }
    }

    let mensagem = "Erro inesperado no servidor.";
    if (error.response) {
      const data = error.response.data;
      if (typeof data === "string" && data.trim() !== "") {
        mensagem = data;
      } else if (data && typeof data === "object") {
        mensagem =
          data.message ||
          data.erro ||
          data.error ||
          data.details ||
          "Erro ao processar requisição.";
      }
    } else if (error.request) {
      mensagem =
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.";
    }

    return Promise.reject(new Error(mensagem));
  },
);

// ============================================================
// AUTH
// ============================================================
export const registrarUsuario = async (dados: {
  nomeCompleto: string;
  cpfCnpj: string;
  telefone: string;
  genero: string;
  email: string;
  senha: string;
  tipoPerfil: string;
}) => {
  const res = await apiService.post("/usuarios/registrar", dados);
  return res.data;
};

export const login = async (email: string, senha: string) => {
  const res = await apiService.post("/usuarios/login", { email, senha });
  return res.data;
};

export const refresh = async (refreshToken: string) => {
  const res = await apiService.post("/usuarios/refresh", { refreshToken });
  return res.data;
};

export const logoutBackend = async (refreshToken: string) => {
  await apiService.post("/usuarios/logout", { refreshToken });
};

export const getMeuPerfil = async () => {
  const res = await apiService.get("/usuarios/me");
  return res.data;
};

export const atualizarMeuPerfil = async (dados: {
  nomeCompleto?: string;
  email?: string;
  telefone?: string;
  fotoPerfilUrl?: string;
  senhaAtual?: string;
  novaSenha?: string;
}) => {
  const res = await apiService.patch("/usuarios/me", dados);
  return res.data;
};

// ============================================================
// ENDEREÇOS
// ============================================================
export const getMeusEnderecos = async () => {
  const res = await apiService.get("/usuarios/enderecos");
  return res.data;
};

export const criarEndereco = async (dados: {
  destinatario: string;
  telefone?: string;
  cep: string;
  estadoCidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
  latitudeDestino?: number;
  longitudeDestino?: number;
  principal?: boolean;
}) => {
  const res = await apiService.post("/usuarios/enderecos", dados);
  return res.data;
};

export const atualizarEndereco = async (id: number, dados: any) => {
  const res = await apiService.put(`/usuarios/enderecos/${id}`, dados);
  return res.data;
};

export const deletarEndereco = async (id: number) => {
  await apiService.delete(`/usuarios/enderecos/${id}`);
};

// ============================================================
// CEP — Consulta e Geocodificação
// ============================================================

export interface DadosCep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  estadoCidade?: string; // formatted
}

/**
 * Busca dados de endereço por CEP usando o endpoint proxy do backend
 * (que por sua vez consulta a ViaCEP). Fallback direto para ViaCEP caso
 * o backend não esteja disponível.
 */
export const consultarCep = async (cep: string): Promise<DadosCep | null> => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;

  try {
    // Tenta pelo backend proxy (evita CORS em produção)
    const res = await apiService.get(`/cep/${cepLimpo}`);
    const d = res.data;
    if (d.erro) return null;
    return { ...d, estadoCidade: `${d.uf} - ${d.localidade}` };
  } catch {
    // Fallback direto para ViaCEP
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const d = await res.json();
      if (d.erro) return null;
      return { ...d, estadoCidade: `${d.uf} - ${d.localidade}` };
    } catch {
      return null;
    }
  }
};

/**
 * Geocodifica um endereço usando Nominatim (OpenStreetMap).
 * Tenta progressive fallback: endereço completo → rua+cidade → cidade+estado.
 * Retorna lat/lon ou null se não encontrar.
 */
export const geocodificarEndereco = async (
  logradouro: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
): Promise<{ lat: number; lon: number } | null> => {
  const BASE = 'https://nominatim.openstreetmap.org/search';
  const HEADERS = { 'Accept-Language': 'pt-BR', 'User-Agent': 'RedeNordeste/1.0' };

  const trySearch = async (params: Record<string, string>) => {
    const qs = new URLSearchParams({ ...params, format: 'json', limit: '1', countrycodes: 'br' });
    try {
      const res = await fetch(`${BASE}?${qs}`, { headers: HEADERS });
      const data = await res.json();
      if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch { /* continua */ }
    return null;
  };

  // 1. Endereço completo com structured search
  if (logradouro && cidade) {
    const street = [logradouro.trim(), numero?.trim()].filter(Boolean).join(' ');
    const result = await trySearch({ street, city: cidade, state: uf });
    if (result) return result;
  }

  // 2. Só rua + cidade (sem número)
  if (logradouro && cidade) {
    const result = await trySearch({ street: logradouro.trim(), city: cidade, state: uf });
    if (result) return result;
  }

  // 3. Bairro + cidade
  if (bairro && cidade) {
    const result = await trySearch({ q: `${bairro}, ${cidade}, ${uf}, Brazil` });
    if (result) return result;
  }

  // 4. Só cidade/estado (fallback final)
  if (cidade) {
    const result = await trySearch({ city: cidade, state: uf, country: 'Brazil' });
    if (result) return result;
  }

  return null;
};

// ============================================================
// CARTÕES
// ============================================================
export const getMeusCartoes = async () => {
  const res = await apiService.get("/usuarios/cartoes");
  return res.data;
};

export const criarCartao = async (dados: {
  titular: string;
  numero: string;
  validade: string;
  cvv: string;
}) => {
  const res = await apiService.post("/usuarios/cartoes", dados);
  return res.data;
};

export const deletarCartao = async (id: number) => {
  await apiService.delete(`/usuarios/cartoes/${id}`);
};

// ============================================================
// NOTIFICAÇÕES
// ============================================================
export const getMinhasNotificacoes = async () => {
  const res = await apiService.get("/usuarios/notificacoes");
  return res.data;
};

export const contarNotificacoesNaoLidas = async () => {
  const res = await apiService.get("/usuarios/notificacoes/contagem-nao-lidas");
  return res.data;
};

export const marcarNotificacaoComoLida = async (id: number) => {
  const res = await apiService.patch(`/usuarios/notificacoes/${id}/lida`);
  return res.data;
};

export const marcarTodasNotificacoesComoLidas = async () => {
  await apiService.patch("/usuarios/notificacoes/todas-lidas");
};

export const deletarNotificacao = async (id: number) => {
  await apiService.delete(`/usuarios/notificacoes/${id}`);
};

export const limparTodasNotificacoes = async () => {
  await apiService.delete("/usuarios/notificacoes");
};

// ============================================================
// LOJA
// ============================================================
export const criarLoja = async (dados: any) => {
  const res = await apiService.post("/produtor/loja", dados);
  return res.data;
};

export const atualizarLoja = async (dados: any) => {
  const res = await apiService.put("/produtor/loja", dados);
  return res.data;
};

export const getMinhaLoja = async () => {
  const res = await apiService.get("/produtor/loja");
  return res.data;
};

export const getLojaPorId = async (id: number | string) => {
  const res = await apiService.get(`/lojas/${id}`);
  return res.data;
};

// ============================================================
// CATEGORIAS
// ============================================================
export const getCategorias = async () => {
  const res = await apiService.get("/categorias");
  return res.data;
};

// ============================================================
// PRODUTOS
// ============================================================
export const criarProduto = async (dados: any) => {
  const res = await apiService.post("/produtor/produtos", dados);
  return res.data;
};

export const atualizarProduto = async (id: number, dados: any) => {
  const res = await apiService.put(`/produtor/produtos/${id}`, dados);
  return res.data;
};

export const deletarProduto = async (id: number) => {
  await apiService.delete(`/produtor/produtos/${id}`);
};

export const getProdutosPorLoja = async (lojaId: number, page = 0) => {
  const res = await apiService.get(`/lojas/${lojaId}/produtos?page=${page}`);
  return res.data;
};

export const buscarProdutos = async (
  nome?: string,
  categoriaId?: number,
  page = 0,
  estado?: string,
  cidade?: string,
  excluirLojaId?: number
) => {
  const params = new URLSearchParams();
  if (nome) params.append("nome", nome);
  if (categoriaId) params.append("categoriaId", String(categoriaId));
  if (estado) params.append("estado", estado);
  if (cidade) params.append("cidade", cidade);
  if (excluirLojaId) params.append("excluirLojaId", String(excluirLojaId));
  params.append("page", String(page));
  const res = await apiService.get(`/produtos?${params.toString()}`);
  return res.data;
};

export const getProdutoPorId = async (id: number) => {
  const res = await apiService.get(`/produtos/${id}`);
  return res.data;
};

export const getProdutosHome = async () => {
  const res = await apiService.get("/produtos/home");
  return res.data;
};

// ============================================================
// ADMIN — PRODUTOS PENDENTES
// ============================================================
export const getProdutosPendentes = async (page = 0) => {
  const res = await apiService.get(`/admin/produtos/pendentes?page=${page}`);
  return res.data;
};

export const aprovarOuRejeitarProduto = async (
  id: number,
  status: "APROVADO" | "REJEITADO",
) => {
  const res = await apiService.patch(`/admin/produtos/${id}/status`, {
    status,
  });
  return res.data;
};

// ============================================================
// CARRINHO
// ============================================================
export const getCarrinho = async () => {
  const res = await apiService.get("/comprador/carrinho");
  return res.data;
};

export const adicionarAoCarrinho = async (
  produtoId: number,
  quantidade: number,
) => {
  const res = await apiService.post("/comprador/carrinho", {
    produtoId,
    quantidade,
  });
  return res.data;
};

export const removerDoCarrinho = async (produtoId: number) => {
  const res = await apiService.delete(`/comprador/carrinho/${produtoId}`);
  return res.data;
};

export const limparCarrinho = async () => {
  await apiService.delete("/comprador/carrinho");
};

// ============================================================
// PEDIDOS & CHECKOUT
// ============================================================
export const checkout = async (dados: {
  metodoPagamento: string;
  retiradaNaLoja: boolean;
  enderecoEntrega?: string;
  cidadeDestino?: string;
  latitudeDestino?: number;
  longitudeDestino?: number;
  observacoes?: string;
  cartaoId?: number;
}) => {
  const res = await apiService.post("/comprador/pedidos/checkout", dados);
  return res.data;
};

export const getMeusPedidos = async (page = 0) => {
  const res = await apiService.get(`/comprador/pedidos?page=${page}`);
  return res.data;
};

export const getPedidoDetalhe = async (id: number) => {
  const res = await apiService.get(`/comprador/pedidos/${id}`);
  return res.data;
};

export const getPedidosDaLoja = async (page = 0) => {
  const res = await apiService.get(`/produtor/pedidos?page=${page}`);
  return res.data;
};

export const atualizarStatusEntrega = async (
  pedidoId: number,
  status: string,
) => {
  const res = await apiService.patch(
    `/produtor/pedidos/${pedidoId}/status?status=${status}`,
  );
  return res.data;
};

// ============================================================
// FRETE
// ============================================================
export const simularFrete = async (
  lojaId: number,
  latitudeDestino: number,
  longitudeDestino: number,
) => {
  const res = await apiService.post("/frete/simular", {
    lojaId,
    latitudeDestino,
    longitudeDestino,
  });
  return res.data;
};

export const simularFreteMultiLoja = async (
  lojaIds: number[],
  latitudeDestino: number,
  longitudeDestino: number,
) => {
  const promises = lojaIds.map(async (lojaId) => {
    try {
      const res = await simularFrete(lojaId, latitudeDestino, longitudeDestino);
      // Pega dados básicos da loja se possível para ter o nome
      let nomeLoja = `Loja ${lojaId}`;
      try {
        const lojaData = await getLojaPorId(lojaId);
        if (lojaData && lojaData.nomeLoja) nomeLoja = lojaData.nomeLoja;
      } catch (e) {
        // Ignora
      }
      return { lojaId, nomeLoja, ...res };
    } catch (error) {
      console.error(`Erro simulando frete para loja ${lojaId}:`, error);
      return { lojaId, nomeLoja: `Loja ${lojaId}`, valorFrete: 0, erro: true };
    }
  });

  return Promise.all(promises);
};

// ============================================================
// ENTREGADORES
// ============================================================
export const cadastrarEntregador = async (dados: {
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  cidade: string;
  latitudeBase?: number;
  longitudeBase?: number;
  tipoVeiculo: string;
  placaVeiculo?: string;
  numeroCnh?: string;
}) => {
  const res = await apiService.post("/entregadores/cadastrar", dados);
  return res.data;
};

export const alterarDisponibilidade = async (
  id: number,
  disponivel: boolean,
) => {
  await apiService.patch(
    `/entregadores/${id}/disponibilidade?disponivel=${disponivel}`,
  );
};

// ============================================================
// CHAT — REST
// ============================================================
export const abrirChat = async (lojaId: number) => {
  const res = await apiService.post(`/comprador/chats/abrir?lojaId=${lojaId}`);
  return res.data;
};

export const getChatsComprador = async () => {
  const res = await apiService.get("/comprador/chats");
  return res.data;
};

export const getChatsDaLoja = async () => {
  const res = await apiService.get("/produtor/chats");
  return res.data;
};

export const getMensagens = async (chatId: number, page = 0) => {
  const res = await apiService.get(
    `/chats/${chatId}/mensagens?page=${page}&sort=dataEnvio,asc`,
  );
  return res.data;
};

export const enviarMensagemREST = async (chatId: number, conteudo: string) => {
  const res = await apiService.post(`/chats/${chatId}/mensagens`, { conteudo });
  return res.data;
};

export const getNaoLidas = async () => {
  const res = await apiService.get("/chats/nao-lidas");
  return res.data;
};

// ============================================================
// CHAT — WebSocket com STOMP
// ============================================================
let stompClient: Client | null = null;

const lerTokenAtual = (): string | null => {
  const raw = localStorage.getItem("usuarioLogado");
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const conectarWebSocket = (
  chatId: number,
  onMensagem: (msg: any) => void,
  onNotificacao?: (notif: any) => void,
) => {
  const wsBase =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8090";

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${wsBase}/ws/chat`) as WebSocket,
    beforeConnect: () => {
      const token = lerTokenAtual();
      if (stompClient && token) {
        stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
      }
    },
    onConnect: () => {
      stompClient?.subscribe(`/topic/chat/${chatId}`, (frame) => {
        onMensagem(JSON.parse(frame.body));
      });
      if (onNotificacao) {
        stompClient?.subscribe("/user/queue/notificacoes", (frame) => {
          onNotificacao(JSON.parse(frame.body));
        });
      }
    },
    onDisconnect: () => console.log("WebSocket desconectado"),
    onStompError: (frame) => console.error("STOMP error:", frame),
    reconnectDelay: 5000,
  });

  stompClient.activate();
  return stompClient;
};

export const enviarMensagemWS = (chatId: number, conteudo: string) => {
  if (stompClient?.connected) {
    stompClient.publish({
      destination: `/app/chat/${chatId}`,
      body: JSON.stringify({ conteudo }),
    });
    return true;
  }
  return false;
};

export const desconectarWebSocket = () => {
  stompClient?.deactivate();
  stompClient = null;
};

// ============================================================
// EMPREENDEDORAS
// ============================================================
export const getEmpreendedoras = async () => {
  const res = await apiService.get("/lojas/empreendedoras");
  return res.data;
};

export const atualizarPerfilEmpreendedora = async (dados: {
  fotoEmpreendedoraUrl?: string;
  historiaEmpreendedora?: string;
}) => {
  const res = await apiService.patch("/produtor/loja/empreendedora", dados);
  return res.data;
};

export const deletarPerfilEmpreendedora = async () => {
  await apiService.delete("/produtor/loja/empreendedora");
};

// ============================================================
// BANNERS
// ============================================================
export const getBanners = async () => {
  const res = await apiService.get("/banners");
  return res.data;
};

export const adminListarBanners = async () => {
  const res = await apiService.get("/admin/banners");
  return res.data;
};

export const adminCriarBanner = async (dados: any) => {
  const res = await apiService.post("/admin/banners", dados);
  return res.data;
};

export const adminAtualizarBanner = async (id: number, dados: any) => {
  const res = await apiService.put(`/admin/banners/${id}`, dados);
  return res.data;
};

export const adminDeletarBanner = async (id: number) => {
  await apiService.delete(`/admin/banners/${id}`);
};

// ============================================================
// NOTÍCIAS
// ============================================================
export const getNoticias = async (page = 0) => {
  const res = await apiService.get(`/noticias?page=${page}`);
  return res.data;
};

export const getNoticiaPorId = async (id: number) => {
  const res = await apiService.get(`/noticias/${id}`);
  return res.data;
};

export const adminListarNoticias = async (page = 0) => {
  const res = await apiService.get(`/admin/noticias?page=${page}`);
  return res.data;
};

export const adminCriarNoticia = async (dados: any) => {
  const res = await apiService.post("/admin/noticias", dados);
  return res.data;
};

export const adminAtualizarNoticia = async (id: number, dados: any) => {
  const res = await apiService.put(`/admin/noticias/${id}`, dados);
  return res.data;
};

export const adminDeletarNoticia = async (id: number) => {
  await apiService.delete(`/admin/noticias/${id}`);
};

// ============================================================
// ADMIN
// ============================================================
export const adminGetMetricas = async () => {
  const res = await apiService.get("/admin/metricas");
  return res.data;
};

export const adminListarUsuarios = async (page = 0) => {
  const res = await apiService.get(`/admin/usuarios?page=${page}`);
  return res.data;
};

export const adminAtualizarUsuario = async (
  id: number,
  dados: {
    contaAtiva?: boolean;
    tipoPerfil?: string;
    motivoSuspensao?: string;
    novaSenha?: string;
  },
) => {
  const res = await apiService.patch(`/admin/usuarios/${id}`, dados);
  return res.data;
};

export const adminListarLojas = async (page = 0) => {
  const res = await apiService.get(`/admin/lojas?page=${page}`);
  return res.data;
};

export const adminListarLojasPendentes = async (page = 0) => {
  const res = await apiService.get(`/admin/lojas/pendentes?page=${page}`);
  return res.data;
};

export const adminVerificarLoja = async (id: number) => {
  const res = await apiService.patch(`/admin/lojas/${id}/verificar`);
  return res.data;
};

export const adminSuspenderLoja = async (id: number, motivo?: string) => {
  const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";
  const res = await apiService.patch(`/admin/lojas/${id}/suspender${params}`);
  return res.data;
};

export const adminReativarLoja = async (id: number) => {
  const res = await apiService.patch(`/admin/lojas/${id}/reativar`);
  return res.data;
};

export const adminCriarCategoria = async (dados: {
  nome: string;
  descricao?: string;
  imagemIconeUrl?: string;
}) => {
  const res = await apiService.post("/admin/categorias", dados);
  return res.data;
};

export const adminAtualizarCategoria = async (id: number, dados: any) => {
  const res = await apiService.put(`/admin/categorias/${id}`, dados);
  return res.data;
};

export const adminDeletarCategoria = async (id: number) => {
  await apiService.delete(`/admin/categorias/${id}`);
};

export default apiService;
