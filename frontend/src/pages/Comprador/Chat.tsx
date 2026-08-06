import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Home as HomeIcon,
  BookOpen,
  ShoppingCart,
  User,
  Store,
} from "lucide-react";

import {
  abrirChat,
  getChatsComprador,
  getChatsDaLoja,
  getMensagens,
  enviarMensagemREST,
  conectarWebSocket,
  enviarMensagemWS,
  desconectarWebSocket,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Navbar } from '../../components/ui/Navbar';
import { BottomTabBar } from "../../components/ui/BottomTabBar";
import { ChatListItem } from "../../components/ui/ChatListItem";
import { MensagemBolha } from "../../components/ui/MensagemBolha";
import { CabecalhoChat } from "../../components/ui/CabecalhoChat";
import { InputMensagem } from "../../components/ui/InputMensagem";

interface ChatItem {
  id: number;
  compradorId: number;
  nomeComprador: string;
  lojaId: number;
  nomeLoja: string;
  logoLoja?: string | null;
  dataInicio: string;
  naoLidas: number;
  ultimaMensagem?: string | null;
  dataUltimaMensagem?: string | null;
  remetenteUltimaMensagem?: number | null;
  origem: "comprador" | "loja";
}

interface MensagemItem {
  id: number;
  chatId: number;
  remetenteId: number;
  nomeRemetente: string;
  conteudo: string;
  lida: boolean;
  dataEnvio: string;
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, perfil } = useAuth();

  const queryLojaId = new URLSearchParams(location.search).get("lojaId");
  const lojaIdParam =
    (location.state as any)?.lojaId ?? (queryLojaId ? Number(queryLojaId) : null);

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatAtivoId, setChatAtivoId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectado, setConectado] = useState(false);

  const fimRef = useRef<HTMLDivElement>(null);

  // Identifica mensagens próprias comparando o nome do usuário logado.
  // Trade-off: nome pode colidir se houver homônimos no mesmo chat,
  // mas comprador↔produtor são sempre 2 pessoas distintas no chat.
  const meuNome = usuario?.nome ?? "";

  const chatAtivo = useMemo(
    () => chats.find((c) => c.id === chatAtivoId) ?? null,
    [chats, chatAtivoId]
  );

  // ── Carregar lista de conversas ───────────────────────────────
  const carregarChats = useCallback(async () => {
    setCarregando(true);
    try {
      const promises: Promise<any[]>[] = [];
      // COMPRADOR sempre vê seus chats; PRODUTOR também pode comprar.
      promises.push(getChatsComprador().catch(() => []));
      if (perfil === "PRODUTOR") promises.push(getChatsDaLoja().catch(() => []));

      const [doComprador, daLoja = []] = await Promise.all(promises);

      const todos: ChatItem[] = [
        ...doComprador.map((c: any) => ({ ...c, origem: "comprador" as const })),
        ...daLoja.map((c: any) => ({ ...c, origem: "loja" as const })),
      ];

      todos.sort((a, b) => {
        const da = a.dataUltimaMensagem ?? a.dataInicio;
        const db = b.dataUltimaMensagem ?? b.dataInicio;
        return new Date(db).getTime() - new Date(da).getTime();
      });

      setChats(todos);
    } finally {
      setCarregando(false);
    }
  }, [perfil]);

  useEffect(() => {
    carregarChats();
  }, [carregarChats]);

  // ── Abertura por lojaId via navigate (comprador clica "Falar com a loja") ──
  useEffect(() => {
    if (!lojaIdParam) return;
    (async () => {
      try {
        const chat = await abrirChat(Number(lojaIdParam));
        await carregarChats();
        setChatAtivoId(chat.id);
        // Limpa o state da rota para não reabrir ao voltar.
        navigate("/chat", { replace: true });
      } catch (e) {
        console.error("Falha ao abrir chat com loja:", e);
      }
    })();
    // só responde a mudança de lojaIdParam — carregarChats é estável o suficiente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaIdParam]);

  // ── Carregar mensagens + WebSocket do chat ativo ───────────────
  useEffect(() => {
    if (!chatAtivoId) {
      desconectarWebSocket();
      setConectado(false);
      setMensagens([]);
      return;
    }

    let cancelado = false;

    getMensagens(chatAtivoId).then((page) => {
      if (!cancelado) setMensagens(page.content ?? []);
    });

    // Zera o badge localmente — o backend já marca como lidas ao listar.
    setChats((prev) =>
      prev.map((c) => (c.id === chatAtivoId ? { ...c, naoLidas: 0 } : c))
    );

    const client = conectarWebSocket(
      chatAtivoId,
      (nova: MensagemItem) => {
        setMensagens((prev) =>
          prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]
        );
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatAtivoId
              ? {
                  ...c,
                  ultimaMensagem: nova.conteudo,
                  dataUltimaMensagem: nova.dataEnvio,
                  remetenteUltimaMensagem: nova.remetenteId,
                }
              : c
          )
        );
      }
    );

    // Heurística: stomp.connected nem sempre é síncrono — observa após 800ms
    const t = setTimeout(() => setConectado(Boolean((client as any)?.connected)), 800);

    return () => {
      cancelado = true;
      clearTimeout(t);
      desconectarWebSocket();
      setConectado(false);
    };
  }, [chatAtivoId]);

  // ── Auto-scroll ao final ───────────────────────────────────────
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length, chatAtivoId]);

  // ── Enviar mensagem ────────────────────────────────────────────
  const enviar = async (texto: string) => {
    if (!chatAtivoId) return;
    const enviouWS = enviarMensagemWS(chatAtivoId, texto);
    if (!enviouWS) {
      // Fallback REST — também dispara push para outros assinantes via backend
      const msg = await enviarMensagemREST(chatAtivoId, texto);
      setMensagens((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
    // Atualiza prévia local imediatamente (a mensagem WS volta logo em seguida)
    setChats((prev) =>
      prev
        .map((c) =>
          c.id === chatAtivoId
            ? { ...c, ultimaMensagem: texto, dataUltimaMensagem: new Date().toISOString() }
            : c
        )
        .sort((a, b) => {
          const da = a.dataUltimaMensagem ?? a.dataInicio;
          const db = b.dataUltimaMensagem ?? b.dataInicio;
          return new Date(db).getTime() - new Date(da).getTime();
        })
    );
  };

  const handleVoltar = () => {
    if (chatAtivoId) {
      setChatAtivoId(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased pb-20 font-sans">
      <Navbar rotaAtiva="/chat" />
      <main className="max-w-6xl mx-auto px-4 py-4">
        <PageHeader
          titulo="Conversas"
          subtitulo={
            perfil === "PRODUTOR"
              ? "Suas conversas como comprador e como loja"
              : "Converse com as lojas dos produtores"
          }
          voltarPara={handleVoltar}
        />

        <div className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="flex h-[70vh] min-h-[500px]">
            {/* ── Sidebar de conversas ── */}
            <aside
              className={`${
                chatAtivoId ? "hidden md:flex" : "flex"
              } w-full md:w-80 md:border-r border-gray-200 flex-col`}
            >
              <div className="px-4 py-3 border-b border-gray-100 bg-[#F5F2ED] md:rounded-tl-2xl">
                <h2 className="font-semibold text-gray-800">
                  {chats.length} {chats.length === 1 ? "conversa" : "conversas"}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto bg-white">
                {carregando && (
                  <p className="p-6 text-center text-sm text-gray-500">
                    Carregando...
                  </p>
                )}

                {!carregando && chats.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-500">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Você ainda não tem conversas.</p>
                    <p className="mt-1 text-xs">
                      Abra uma loja na vitrine e clique em "Falar com a loja".
                    </p>
                  </div>
                )}

                {chats.map((c) => {
                  const nomeExibicao = c.origem === "comprador" ? c.nomeLoja : c.nomeComprador;
                  const avatar = c.origem === "comprador" ? c.logoLoja : null;
                  const variante = c.origem === "comprador" ? "loja" : "comprador";
                  return (
                    <ChatListItem
                      key={c.id}
                      nome={nomeExibicao}
                      avatarUrl={avatar}
                      ultimaMensagem={c.ultimaMensagem}
                      dataUltimaMensagem={c.dataUltimaMensagem}
                      naoLidas={c.naoLidas}
                      ativo={c.id === chatAtivoId}
                      variante={variante}
                      onClick={() => setChatAtivoId(c.id)}
                    />
                  );
                })}
              </div>
            </aside>

            {/* ── Janela do chat ── */}
            <section
              className={`${
                chatAtivoId ? "flex" : "hidden md:flex"
              } flex-1 flex-col bg-gray-100`}
            >
              {!chatAtivo && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-[#55833d]/10 text-[#55833d] rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <MessageCircle size={32} />
                  </div>
                  <p className="text-[#394158] font-bold">Selecione uma conversa para começar</p>
                </div>
              )}

              {chatAtivo && (
                <>
                  <CabecalhoChat
                    nome={
                      chatAtivo.origem === "comprador"
                        ? chatAtivo.nomeLoja
                        : chatAtivo.nomeComprador
                    }
                    subtitulo={
                      chatAtivo.origem === "comprador" ? "Loja" : "Comprador"
                    }
                    avatarUrl={chatAtivo.origem === "comprador" ? chatAtivo.logoLoja : null}
                    variante={chatAtivo.origem === "comprador" ? "loja" : "comprador"}
                    conectado={conectado}
                    onVoltar={() => setChatAtivoId(null)}
                  />

                  <div className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5]">
                    {mensagens.length === 0 && (
                      <p className="text-center text-sm text-gray-500 mt-8">
                        Nenhuma mensagem ainda. Diga olá!
                      </p>
                    )}
                    {mensagens.map((m) => (
                      <MensagemBolha
                        key={m.id}
                        conteudo={m.conteudo}
                        dataEnvio={m.dataEnvio}
                        propria={m.nomeRemetente === meuNome}
                        lida={m.lida}
                      />
                    ))}
                    <div ref={fimRef} />
                  </div>

                  <InputMensagem onEnviar={enviar} />
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <BottomTabBar
        tabs={
          perfil === "PRODUTOR"
            ? [
                { to: "/vendedor", label: "Início", Icon: HomeIcon },
                { to: "/painelvendedor", label: "Painel", Icon: Store },
                { to: "/chat", label: "Chat", Icon: MessageCircle },
                { to: "/perfilvendedor", label: "Perfil", Icon: User },
              ]
            : [
                { to: "/home2", label: "Início", Icon: HomeIcon },
                { to: "/receitas", label: "Receitas", Icon: BookOpen },
                { to: "/carrinho", label: "Carrinho", Icon: ShoppingCart },
                { to: "/chat", label: "Chat", Icon: MessageCircle },
                { to: "/perfil", label: "Perfil", Icon: User },
              ]
        }
      />
    </div>
  );
}
