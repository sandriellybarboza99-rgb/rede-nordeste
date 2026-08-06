import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, Package, Tag, Truck, Info, MessageCircle, Store as StoreIcon,
  Trash2, Search, CheckCheck, Inbox,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Navbar } from '../../components/ui/Navbar';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import {
  getMinhasNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  limparTodasNotificacoes,
} from '../../services/api';

type FiltroTipo = 'todos' | 'pedidos' | 'promocoes' | 'sistema';

interface NotificacaoBackend {
  id: number;
  tipo: 'PEDIDO' | 'PROMOCAO' | 'SISTEMA' | 'CHAT' | 'LOJA';
  titulo: string;
  mensagem: string;
  linkAcao?: string;
  lida: boolean;
  dataCriacao: string;
  dataLeitura?: string;
}

// ── Mapeamento visual por tipo de notificação ──────────────────────
const TIPO_VISUAL: Record<
  NotificacaoBackend['tipo'],
  { Icon: any; cor: string; bg: string; filtro: FiltroTipo }
> = {
  PEDIDO:   { Icon: Truck,          cor: 'text-[#f9943b]', bg: 'bg-[#f9943b]/10', filtro: 'pedidos' },
  PROMOCAO: { Icon: Tag,             cor: 'text-[#55833d]', bg: 'bg-[#55833d]/10', filtro: 'promocoes' },
  SISTEMA:  { Icon: Info,            cor: 'text-blue-500',  bg: 'bg-blue-500/10',  filtro: 'sistema' },
  CHAT:     { Icon: MessageCircle,   cor: 'text-purple-500', bg: 'bg-purple-500/10', filtro: 'sistema' },
  LOJA:     { Icon: StoreIcon,       cor: 'text-[#802D44]', bg: 'bg-[#802D44]/10', filtro: 'sistema' },
};

// Converte ISO de data para "Há X horas" / "Há X dias"
function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Agora há pouco';
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} hora${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Há ${d} dia${d > 1 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function Notificacao() {
  const { success, error: toastError } = useToast();
  const [notificacoes, setNotificacoes] = useState<NotificacaoBackend[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');

  // ── Carrega notificações do backend ──────────────────────────────
  const recarregar = async () => {
    try {
      const data = await getMinhasNotificacoes();
      setNotificacoes(data);
    } catch (e: any) {
      toastError(e.message || 'Não foi possível carregar notificações');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((n) => {
      const visual = TIPO_VISUAL[n.tipo];
      const passaFiltro = filtro === 'todos' || visual.filtro === filtro;
      const txt = busca.trim().toLowerCase();
      const passaBusca =
        txt === '' ||
        n.titulo.toLowerCase().includes(txt) ||
        n.mensagem.toLowerCase().includes(txt);
      return passaFiltro && passaBusca;
    });
  }, [notificacoes, filtro, busca]);

  const marcarComoLida = async (id: number) => {
    // Otimistic update
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    try {
      await marcarNotificacaoComoLida(id);
    } catch {
      // Reverte se falhar
      recarregar();
    }
  };

  const marcarTodasLidas = async () => {
    try {
      await marcarTodasNotificacoesComoLidas();
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      success('Todas as notificações foram marcadas como lidas');
    } catch (e: any) {
      toastError(e.message || 'Erro ao marcar como lidas');
    }
  };

  const limparNotificacoes = async () => {
    if (!window.confirm('Limpar TODAS as notificações? Esta ação não pode ser desfeita.')) return;
    try {
      await limparTodasNotificacoes();
      setNotificacoes([]);
      success('Notificações limpas');
    } catch (e: any) {
      toastError(e.message || 'Erro ao limpar');
    }
  };

  const contadorPorFiltro = (f: FiltroTipo) =>
    notificacoes.filter((n) => f === 'todos' || TIPO_VISUAL[n.tipo].filtro === f).length;

  const filtros: { id: FiltroTipo; label: string; badge: number }[] = [
    { id: 'todos', label: 'Todos', badge: notificacoes.length },
    { id: 'pedidos', label: 'Pedidos', badge: contadorPorFiltro('pedidos') },
    { id: 'promocoes', label: 'Promoções', badge: contadorPorFiltro('promocoes') },
    { id: 'sistema', label: 'Sistema', badge: contadorPorFiltro('sistema') },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans antialiased">
      <Navbar rotaAtiva="/notificacoes" />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 page-enter">
        <PageHeader
          titulo="Notificações"
          subtitulo={
            carregando
              ? 'Carregando…'
              : naoLidas > 0
              ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}`
              : 'Tudo em dia'
          }
          voltarPara="back"
          acoesDireita={
            <>
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodasLidas}
                  title="Marcar todas como lidas"
                  className="p-2 text-[#55833d] hover:bg-[#55833d]/10 rounded-full transition-colors"
                  aria-label="Marcar todas como lidas"
                >
                  <CheckCheck size={18} />
                </button>
              )}
              {notificacoes.length > 0 && (
                <button
                  onClick={limparNotificacoes}
                  title="Limpar tudo"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Limpar todas as notificações"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          }
        />

        {/* BARRA DE BUSCA */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar nas notificações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white py-3 pl-12 pr-4 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-[#f9943b] transition-all shadow-sm"
          />
        </div>

        {/* TABS DE FILTRO — scrollable em mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1 pb-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                filtro === f.id
                  ? 'bg-[#f9943b] text-white shadow-md'
                  : 'bg-white text-[#394158]/60 hover:text-[#394158] shadow-sm'
              }`}
            >
              {f.label}
              {f.badge > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    filtro === f.id ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {f.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* LISTA */}
        {carregando ? (
          <Card padding="lg" className="text-center py-16">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <Bell size={48} className="animate-pulse" />
              <p className="text-sm font-black uppercase tracking-widest">Carregando…</p>
            </div>
          </Card>
        ) : notificacoesFiltradas.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <Inbox size={48} />
              <p className="text-sm font-black uppercase tracking-widest">
                {notificacoes.length === 0 ? 'Tudo limpo por aqui' : 'Nenhuma notificação corresponde'}
              </p>
              {notificacoes.length > 0 && (
                <button
                  onClick={() => {
                    setBusca('');
                    setFiltro('todos');
                  }}
                  className="text-xs font-bold text-[#55833d] hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {notificacoesFiltradas.map((n, idx) => {
              const visual = TIPO_VISUAL[n.tipo];
              const Icon = visual.Icon;
              return (
                <button
                  key={n.id}
                  onClick={() => marcarComoLida(n.id)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={`w-full text-left bg-white rounded-2xl shadow-sm border transition-all touch-feedback page-enter flex items-start gap-3 md:gap-4 p-3 md:p-4 hover:shadow-md ${
                    !n.lida ? 'border-[#f9943b]/30 ring-1 ring-[#f9943b]/10' : 'border-gray-100'
                  }`}
                >
                  <div
                    className={`shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${visual.bg} ${visual.cor}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={`text-xs md:text-sm font-black uppercase tracking-tight leading-tight pr-2 ${
                          !n.lida ? 'text-[#394158]' : 'text-gray-500'
                        }`}
                      >
                        {n.titulo}
                      </h3>
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-400 whitespace-nowrap mt-0.5">
                        {tempoRelativo(n.dataCriacao)}
                      </span>
                    </div>
                    <p className="text-[11px] md:text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">
                      {n.mensagem}
                    </p>
                  </div>
                  {!n.lida && (
                    <span
                      className="shrink-0 w-2 h-2 bg-[#f9943b] rounded-full mt-2 animate-pulse"
                      aria-label="Não lida"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* DICA NO RODAPÉ */}
        {!carregando && notificacoes.length > 0 && (
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-20 md:mb-8">
            Toque em uma notificação para marcá-la como lida
          </p>
        )}
      </main>
    </div>
  );
}
