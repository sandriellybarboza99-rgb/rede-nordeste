import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Plus,
  Star, LayoutGrid, Palette, Beef, Sprout, Wheat, Carrot, Milk, Bed, Utensils, Shirt,
  MessageCircle, ChevronRight, ChevronLeft, Menu, X, BookOpen, Bell, HelpCircle, Home as HomeIcon, LayoutDashboard, Sparkles
} from 'lucide-react';
import {
  buscarProdutos, getCategorias, adicionarAoCarrinho, getNaoLidas, getCarrinho, getEmpreendedoras, getMinhaLoja
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/ui/UserMenu';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { ModalEmpreendedora } from '../../components/modals/ModalEmpreendedora';
import { TutorialModal } from '../../components/modals/TutorialModal';
import { ModalDetalheMulher } from '../../components/modals/ModalDetalheMulher';
import { ProductFilters } from '../../components/ui/ProductFilters';
import { RecipeWidget } from '../../components/ui/RecipeWidget';
import { ProductCard } from '../../components/ui/ProductCard';

const CATEGORIAS_ICONES: Record<string, any> = {
  'Todos': LayoutGrid, 'Artesanato': Palette, 'Carnes': Beef,
  'Colheita': Sprout, 'Grãos': Wheat, 'Hortifruti': Carrot,
  'Laticínios': Milk, 'Cama Mesa e Banho': Bed, 'Gastronomia': Utensils, 'Têxtil': Shirt,
};

const ESTADOS_NORDESTE = [
  { uf: '', nome: 'Todos os Estados' },
  { uf: 'AL', nome: 'Alagoas (AL)' },
  { uf: 'BA', nome: 'Bahia (BA)' },
  { uf: 'CE', nome: 'Ceará (CE)' },
  { uf: 'MA', nome: 'Maranhão (MA)' },
  { uf: 'PB', nome: 'Paraíba (PB)' },
  { uf: 'PE', nome: 'Pernambuco (PE)' },
  { uf: 'PI', nome: 'Piauí (PI)' },
  { uf: 'RN', nome: 'Rio Grande do Norte (RN)' },
  { uf: 'SE', nome: 'Sergipe (SE)' },
];

// ── Cache em memória (sobrevive entre navegações SPA) ────────────
// Evita o estado "Carregando..." ao voltar para a Home.
const pageCache: {
  categorias?: any[];
  empreendedoras?: any[];
  produtos?: { key: string; data: any[]; totalPaginas: number; facetasEstados: any[]; facetasCidades: any[] };
} = {};

const buildProdKey = (termo: string, catId?: number, pag?: number, estado?: string, cidade?: string) =>
  `${termo}|${catId ?? ''}|${pag ?? 0}|${estado ?? ''}|${cidade ?? ''}`;

export default function HomeComprador() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const isVendedor = usuario?.perfil === 'PRODUTOR';
  const isMulherProdutora = usuario?.perfil === 'PRODUTOR' && usuario?.genero === 'FEMININO';

  // ── Dados da API ─────────────────────────────────────────────────
  type CategoriaAPI = { id: number; nome: string };
  const [produtos, setProdutos] = useState<any[]>(pageCache.produtos?.data || []);
  const [categorias, setCategorias] = useState<CategoriaAPI[]>(pageCache.categorias || [{ id: 0, nome: 'Todos' }]);
  const [totalPaginas, setTotalPaginas] = useState(pageCache.produtos?.totalPaginas || 1);
  const [carregando, setCarregando] = useState(!pageCache.produtos);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [minhaLojaId, setMinhaLojaId] = useState<number | null>(null);

  // ── Filtros e UI ─────────────────────────────────────────────────
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [catAtivaId, setCatAtivaId] = useState<number | undefined>(undefined);
  const [notificacoesNaoLidas] = useState(2);
  const [busca, setBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [ordenacao, setOrdenacao] = useState('recomendados');
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [empreendedoras, setEmpreendedoras] = useState<any[]>(pageCache.empreendedoras || []);
  const [mulherSelecionada, setMulherSelecionada] = useState<any | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carrinhoCount, setCarrinhoCount] = useState(0);
  const [naoLidas, setNaoLidas] = useState(0);
  const [tutorialAberto, setTutorialAberto] = useState(false);
  const [modalEmpreendedoraAberto, setModalEmpreendedoraAberto] = useState(false);
  const [minhaLojaParaModal, setMinhaLojaParaModal] = useState<any>(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [facetasEstados, setFacetasEstados] = useState<any[]>(pageCache.produtos?.facetasEstados || []);
  const [facetasCidades, setFacetasCidades] = useState<any[]>(pageCache.produtos?.facetasCidades || []);
  const [receitaContexto, setReceitaContexto] = useState<any>(null);

  // ── Scroll horizontal das categorias ─────────────────────────────
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [podePrev, setPodePrev] = useState(false);
  const [podeNext, setPodeNext] = useState(false);

  const atualizarSetas = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setPodePrev(el.scrollLeft > 4);
    setPodeNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollCat = (dir: 'prev' | 'next') => {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'next' ? 220 : -220, behavior: 'smooth' });
    setTimeout(atualizarSetas, 350);
  };

  // ── Carrega categorias (stale-while-revalidate) ────────────────────
  useEffect(() => {
    sessionStorage.setItem('origemBlog', 'painel');

    // Tutorial
    const tutorialKey = isVendedor ? 'tutorial_visto_vendedor' : 'tutorial_visto_comprador';
    if (!localStorage.getItem(tutorialKey)) {
      setTutorialAberto(true);
      localStorage.setItem(tutorialKey, 'true');
    }

    // Carrega categorias e destaques (atualiza cache silenciosamente)
    const carregaFiltros = async () => {
      try {
        const [cats, emp] = await Promise.all([
          getCategorias(),
          getEmpreendedoras().catch(() => [])
        ]);
        const categoriasCompletas = [{ id: 0, nome: 'Todos' }, ...cats];
        setCategorias(categoriasCompletas);
        setEmpreendedoras(emp);
        pageCache.categorias = categoriasCompletas;
        pageCache.empreendedoras = emp;
        setTimeout(atualizarSetas, 100);
      } catch (err) {
        console.error('Erro ao carregar categorias ou empreendedoras:', err);
      }
    };
    carregaFiltros();

    const raw = localStorage.getItem('usuarioLogado');
    if (raw) {
      getNaoLidas().then((d: any) => setNaoLidas(d.total)).catch(() => { });
    }

    if (isVendedor) {
      getMinhaLoja().then((loja: any) => {
        if (loja && loja.id) {
          setMinhaLojaId(loja.id);
          setMinhaLojaParaModal(loja);
        } else {
          setMinhaLojaId(0);
        }
      }).catch(() => {
        setMinhaLojaId(0);
      });
    }

    const salvos = localStorage.getItem('favoritos_itens');
    if (salvos) setFavoritos(JSON.parse(salvos));
    
    const contextoSalvo = sessionStorage.getItem('receitaContexto');
    if (contextoSalvo) {
      try {
        setReceitaContexto(JSON.parse(contextoSalvo));
      } catch (e) {}
    }
  }, []);

  // ── Carrega produtos (stale-while-revalidate) ──────────────────────
  useEffect(() => {
    let isActive = true;
    const cacheKey = buildProdKey(termoPesquisado, catAtivaId, paginaAtual, estadoFiltro, cidadeFiltro);

    // Se temos cache para esses filtros exatos, mostramos imediatamente
    const cached = pageCache.produtos;
    const hasCacheHit = cached && cached.key === cacheKey;
    if (hasCacheHit) {
      setProdutos(cached.data);
      setTotalPaginas(cached.totalPaginas);
      setFacetasEstados(cached.facetasEstados);
      setFacetasCidades(cached.facetasCidades);
    }

    // Mostra loading somente se NÃO tem cache
    if (!hasCacheHit) {
      setCarregando(true);
    }
    setErroCarregamento(null);

    const carregar = async () => {
      try {
        const data = await buscarProdutos(
          termoPesquisado || undefined,
          catAtivaId,
          paginaAtual,
          estadoFiltro || undefined,
          cidadeFiltro || undefined,
          (isVendedor && minhaLojaId) ? minhaLojaId : undefined
        );

        if (!isActive) return;

        let prods = data.produtos?.content || data.content || [];

        const newTotalPaginas = data.produtos?.totalPages || data.totalPages || 1;
        const newFacetasEstados = data.facetas?.estados || [];
        const newFacetasCidades = data.facetas?.cidades || [];

        setProdutos(prev => {
          const novos = paginaAtual === 0 ? prods : [...prev, ...prods];
          // Atualiza cache em memória
          pageCache.produtos = {
            key: cacheKey,
            data: novos,
            totalPaginas: newTotalPaginas,
            facetasEstados: newFacetasEstados,
            facetasCidades: newFacetasCidades,
          };
          return novos;
        });

        setTotalPaginas(newTotalPaginas);
        setFacetasEstados(newFacetasEstados);
        setFacetasCidades(newFacetasCidades);
      } catch (err: any) {
        if (!isActive) return;
        if (!hasCacheHit) {
          setProdutos([]);
          setErroCarregamento(err?.message || 'Erro ao carregar produtos.');
        }
      } finally {
        if (isActive) {
          setCarregando(false);
          setCarregandoMais(false);
        }
      }
    };

    if (isVendedor && minhaLojaId === null) {
      return;
    }

    carregar();
    return () => { isActive = false; };
  }, [termoPesquisado, catAtivaId, paginaAtual, tentativa, isVendedor, minhaLojaId, estadoFiltro, cidadeFiltro]);

  // ── Redirect de receitas / query params ───────────────────────────
  useEffect(() => {
    const termoQuery = searchParams.get('busca');
    const termoState = (location.state as any)?.buscaReceita;
    const termo = termoQuery || termoState;

    if (termo) {
      setBusca(termo);
      setTermoPesquisado(termo);
      setCatAtiva('Todos');
      setCatAtivaId(undefined);
      setPaginaAtual(0);
    }
  }, [searchParams, location.state]);

  // ── Helpers ───────────────────────────────────────────────────────
  const handleCarregarMais = () => {
    if (!carregandoMais && paginaAtual < totalPaginas - 1) {
      setCarregandoMais(true);
      setPaginaAtual(p => p + 1);
    }
  };

  const toggleFavorito = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation();
    const novos = favoritos.includes(id)
      ? favoritos.filter(f => f !== id)
      : [...favoritos, id];
    setFavoritos(novos);
    localStorage.setItem('favoritos_itens', JSON.stringify(novos));
  }, [favoritos]);

  const adicionarRapido = useCallback(async (e: React.MouseEvent, produtoId: number) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const cartReq = await getCarrinho();
      const listaItens = cartReq.itens || cartReq.content || cartReq || [];
      const existing = listaItens.find((i: any) => String(i.produtoId || i.produto?.id) === String(produtoId));
      const novaQtd = existing ? existing.quantidade + 1 : 1;
      await adicionarAoCarrinho(produtoId, novaQtd);
      setCarrinhoCount(c => existing ? c : c + 1);
    } catch (err: any) {
      alert(err.message);
    }
  }, []);

  const handlePesquisa = () => {
    setTermoPesquisado(busca);
    setCatAtiva('Todos');
    setCatAtivaId(undefined);
    setPaginaAtual(0);
    if (busca.trim()) {
      setSearchParams({ busca: busca.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePesquisa();
  };

  const handleCategoriaClick = (cat: { id: number; nome: string }) => {
    setCatAtiva(cat.nome);
    setCatAtivaId(cat.nome === 'Todos' ? undefined : cat.id);
    setTermoPesquisado('');
    setBusca('');
    setPaginaAtual(0);
    setSearchParams({});
  };

  const handleFiltroWidget = (ingrediente: string) => {
    const termo = ingrediente
      .replace(/^[\d\/\se]+(g|kg|l|ml|xícaras?|fatias?|latas?|pacotes?|litros?)?\s*(grossas\s*)?(de\s*)?/i, '')
      .replace(/ para acompanhar| a gosto|\(já lavado\)/gi, '')
      .trim();
    
    setBusca(termo);
    setTermoPesquisado(termo);
    setCatAtiva('Todos');
    setCatAtivaId(undefined);
    setPaginaAtual(0);
    setSearchParams({ busca: termo });
  };

  const fecharWidget = () => {
    setReceitaContexto(null);
    sessionStorage.removeItem('receitaContexto');
  };

  const produtosExibidos = useMemo(() => {
    return [...produtos].sort((a, b) => {
      if (ordenacao === 'menor_preco') return a.precoAtual - b.precoAtual;
      if (ordenacao === 'maior_preco') return b.precoAtual - a.precoAtual;
      return 0;
    });
  }, [produtos, ordenacao]);

  return (
    <div className="min-h-screen bg-white text-[#394158] antialiased pb-20 font-sans">
      <header className="w-full bg-white py-4 px-4 md:px-8 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-10 flex-shrink-0">
            <Link to="/home2"><img src="/assets/logo-home.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" /></Link>
            <nav className="hidden lg:flex gap-6 text-xs md:text-sm font-medium text-[#394158]">
              <Link to="/home2" className={isVendedor ? "text-[#55833d] font-bold border-b-2 border-[#55833d] pb-1" : "text-[#f9943b] border-b-2 border-[#f9943b] pb-1"}>Início</Link>
              <Link to="/receitas" className="hover:text-[#f9943b] transition-colors">Receitas</Link>
              <Link to="/blog" className="hover:text-[#f9943b] transition-colors">Notícias</Link>
              {isVendedor && <Link to="/painelvendedor" className="hover:text-[#f9943b] transition-colors">Painel Vendedor</Link>}
            </nav>
          </div>

          <div className="relative flex-1 max-w-xl hidden md:block">
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="O que procura?"
              className="w-full bg-[#F5F2ED] py-2.5 pl-5 pr-12 rounded-full outline-none text-sm" />
            <button onClick={handlePesquisa}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#55833d] text-white p-2 rounded-full">
              <Search size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Link title="Notificações" to="/notificacoes" className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <Bell className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
                {notificacoesNaoLidas > 0 && (
                  <span className="absolute top-0 right-0 md:top-1 md:right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white group-hover:border-[#f9943b]">
                    {notificacoesNaoLidas}
                  </span>
                )}
              </Link>
              <Link title="Chat" to="/chat" className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <MessageCircle className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </Link>
              <Link title="Carrinho" to="/carrinho" className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <ShoppingCart className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
                {carrinhoCount > 0 && (
                  <span className="absolute top-0 right-0 md:top-1 md:right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white group-hover:border-[#f9943b]">
                    {carrinhoCount}
                  </span>
                )}
              </Link>
              <UserMenu perfilPath={isVendedor ? "/perfilvendedor" : "/perfil"} />
            </div>

            {/* Mobile: menu hambúrguer + UserMenu compacto (se for Vendedor) */}
            <div className="flex lg:hidden items-center gap-3">
              {isVendedor && <UserMenu perfilPath="/perfilvendedor" />}
              <button onClick={() => setMenuAberto(true)} className={`${isVendedor ? 'p-1' : 'md:hidden p-1'} text-[#394158] hover:text-[#f9943b]`}><Menu size={24} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Menu Mobile ───────────────────────────────────────────────── */}
      {menuAberto && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-8 flex flex-col gap-8">
            <button onClick={() => setMenuAberto(false)} className="self-end p-2 bg-[#F5F2ED] rounded-full"><X size={24} /></button>
            <nav className={`flex flex-col gap-5 ${isVendedor ? 'text-sm md:text-base font-medium' : 'text-sm font-black uppercase tracking-widest'} text-[#394158]`}>
              <Link to="/home2" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={14} /> Início</Link>
              <Link to="/receitas" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={14} /> Receitas</Link>
              <Link to="/blog" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={14} /> Notícias</Link>
              {isVendedor && <Link to="/painelvendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={14} /> Painel Vendedor</Link>}
              <button onClick={() => { setMenuAberto(false); setTutorialAberto(true); }} className="flex items-center gap-4 hover:text-[#55833d] text-left"><HelpCircle size={14} /> Guia Rápido</button>
              <hr className="border-gray-100" />
              <Link to="/notificacoes" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]">
                <div className="relative">
                  <Bell size={20} />
                  {notificacoesNaoLidas > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{notificacoesNaoLidas}</span>}
                </div>
                Notificações
              </Link>
              <Link to="/chat" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><MessageCircle size={20} /> Chat</Link>
              <Link to="/carrinho" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]">
                <div className="relative">
                  <ShoppingCart size={20} />
                  {carrinhoCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{carrinhoCount}</span>}
                </div>
                Carrinho
              </Link>
              <Link to="/perfil" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><User size={20} /> Meu Perfil</Link>
            </nav>
          </div>
        </div>
      )}

      <TutorialModal open={tutorialAberto} onClose={() => setTutorialAberto(false)} />

      <ModalDetalheMulher mulher={mulherSelecionada} onClose={() => setMulherSelecionada(null)} />

      {/* MODAL EMPREENDEDORA (CTA) */}
      <ModalEmpreendedora
        open={modalEmpreendedoraAberto}
        onClose={() => setModalEmpreendedoraAberto(false)}
        dadosAtuais={{
          fotoEmpreendedoraUrl: minhaLojaParaModal?.fotoEmpreendedoraUrl,
          historiaEmpreendedora: minhaLojaParaModal?.historiaEmpreendedora,
        }}
        onSalvo={() => {
          // Recarrega lista de empreendedoras para refletir a nova foto/historia
          getEmpreendedoras().then(setEmpreendedoras).catch(() => {});
        }}
      />

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <div className="relative w-full mb-8 md:hidden">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="O que procura?"
            className="w-full bg-white py-3 pl-6 pr-12 rounded-full border border-gray-100 shadow-sm outline-none text-sm" />
          <button onClick={handlePesquisa} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#55833d] text-white p-2 rounded-full">
            <Search size={16} />
          </button>
        </div>

        {/* QUADRO EMPREENDEDORAS */}
        <section className="w-full max-w-6xl mb-12 bg-[#fededf] p-4 md:p-8 rounded-[2rem] border border-[#fededf] mx-auto shadow-xl">
          <div className="flex items-center justify-between mb-6 px-2 text-[#394158]">
            <div className="flex items-center gap-2 md:gap-3">
              <Star size={18} className="fill-[#FFCD0D] text-[#FFCD0D]" />
              <h2 className="text-sm md:text-xl font-black italic uppercase tracking-widest">Empreendedoras de Sergipe</h2>
            </div>
            <Link to="/empreendedoras" className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-[#f9943b] hover:text-[#55833d] transition-colors flex items-center gap-1 group">
              Ver mais <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Botao CTA — visivel apenas para mulheres produtoras */}
          {isMulherProdutora && (() => {
            const jaNoMural = !!(minhaLojaParaModal?.fotoEmpreendedoraUrl || minhaLojaParaModal?.historiaEmpreendedora);
            return (
              <div className="px-2 mb-5">
                <button
                  onClick={() => setModalEmpreendedoraAberto(true)}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all ${
                    jaNoMural
                      ? 'bg-white border-2 border-[#f9943b] text-[#f9943b] hover:bg-[#fff5ef]'
                      : 'bg-gradient-to-r from-[#f9943b] to-[#e07a28] text-white'
                  }`}
                >
                  <Sparkles size={16} className={jaNoMural ? 'text-[#f9943b]' : 'fill-white'} />
                  {jaNoMural ? 'Editar minha historia no mural' : 'Exiba seu negocio aqui!'}
                </button>
              </div>
            );
          })()}


          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
            {empreendedoras.map(mulher => (
              <div key={mulher.id} onClick={() => setMulherSelecionada(mulher)}
                className="min-w-[240px] bg-white rounded-[1rem] p-3 shadow-lg flex items-center gap-3 group cursor-pointer hover:bg-[#aab2c1] transition-all duration-500 border border-white">
                <img src={mulher.fotoEmpreendedoraUrl || mulher.fotoPerfilUrl || mulher.logoUrl || 'https://via.placeholder.com/150'} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#394158]/20" alt={mulher.nomeProprietaria || mulher.nomeLoja} />
                <div>
                  <h3 className="text-xs font-black uppercase text-[#394158] group-hover:text-white transition-colors leading-tight">{mulher.nomeProprietaria || 'Produtora'}</h3>
                  <span className="text-[10px] font-bold text-[#394158]/60 group-hover:text-white/80 transition-colors uppercase italic">{mulher.nomeLoja}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PAINEL DE CATEGORIAS (separado) */}
        <section className="w-full max-w-6xl mx-auto mb-4">
          <div className="bg-white rounded-[1rem] border border-gray-200 shadow-sm p-4 md:p-8">
            <h2 className="text-xs md:text-base font-black uppercase tracking-widest italic mb-5 text-[#394158]">Categorias</h2>

            {/* Wrapper com setas */}
            <div className="relative">
              {/* Seta esquerda */}
              <button
                onClick={() => scrollCat('prev')}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition-all ${podePrev ? 'opacity-100 hover:bg-[#f9943b] hover:text-white hover:border-[#f9943b]' : 'opacity-0 pointer-events-none'}`}
                aria-label="Anterior"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Container com scroll horizontal + 2 linhas */}
              <div
                ref={catScrollRef}
                onScroll={atualizarSetas}
                onLoad={atualizarSetas}
                className="overflow-x-auto no-scrollbar"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Grid de 2 linhas × N colunas; cada coluna é a largura de um botão */}
                <div
                  className="grid gap-y-4 gap-x-3 md:gap-x-5"
                  style={{
                    gridTemplateRows: 'repeat(2, 1fr)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: 'calc((100% - (4 * 20px)) / 5)', // 5 columns visible on desktop
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  }}
                >
                  {categorias.map(cat => {
                    const Icone = CATEGORIAS_ICONES[cat.nome] || LayoutGrid;
                    const ativo = catAtiva === cat.nome;
                    return (
                      <button
                        key={cat.id || cat.nome}
                        onClick={() => handleCategoriaClick(cat)}
                        className="flex flex-col items-center gap-1.5 w-full group"
                      >
                        <div className={`w-[48px] h-[48px] md:w-[72px] md:h-[72px] rounded-[16px] md:rounded-[24px] flex items-center justify-center border transition-all ${ativo
                          ? 'bg-[#f9943b] border-[#f9943b] text-white shadow-md scale-105'
                          : 'bg-[#F5F2ED] border-transparent text-[#394158] group-hover:border-[#f9943b] group-hover:text-[#f9943b]'
                          }`}>
                          <Icone className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                        </div>
                        <span className={`text-[10px] md:text-[11px] leading-[1.2] text-center px-0.5 ${ativo ? 'font-bold text-[#f9943b]' : 'font-medium text-gray-600'
                          }`}>{cat.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seta direita */}
              <button
                onClick={() => scrollCat('next')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition-all ${podeNext ? 'opacity-100 hover:bg-[#f9943b] hover:text-white hover:border-[#f9943b]' : 'opacity-0 pointer-events-none'}`}
                aria-label="Próximo"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* PAINEL DE PRODUTOS */}
        <section className="w-full max-w-6xl mx-auto bg-gray-100/50 p-4 md:p-10 rounded-[1rem] border border-gray-200 shadow-inner mb-12">
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h2 className="text-xl font-black italic uppercase text-[#394158]">{catAtiva !== 'Todos' ? catAtiva : 'Nossos Produtos'}</h2>
              
              <ProductFilters
                estadoFiltro={estadoFiltro}
                cidadeFiltro={cidadeFiltro}
                ordenacao={ordenacao}
                facetasEstados={facetasEstados}
                facetasCidades={facetasCidades}
                estadosNordeste={ESTADOS_NORDESTE}
                onEstadoChange={estado => { setEstadoFiltro(estado); setCidadeFiltro(''); setPaginaAtual(0); }}
                onCidadeChange={cidade => { setCidadeFiltro(cidade); setPaginaAtual(0); }}
                onOrdenacaoChange={setOrdenacao}
              />
            </div>

            {carregando ? (
              <div className="text-center py-20 text-sm font-black uppercase text-gray-300">Carregando...</div>
            ) : erroCarregamento ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <p className="text-sm font-black uppercase text-red-400">Erro ao carregar produtos</p>
                <p className="text-xs font-medium text-gray-400 max-w-md">{erroCarregamento}</p>
                <button
                  onClick={() => setTentativa(t => t + 1)}
                  className="bg-[#55833d] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Tentar novamente
                </button>
              </div>
            ) : produtosExibidos.length === 0 ? (
              <div className="text-center py-20 text-sm font-black uppercase text-gray-300">Nenhum produto encontrado</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
                {produtosExibidos.map(prod => (
                  <ProductCard
                    key={prod.id}
                    prod={prod}
                    isFavorito={favoritos.includes(prod.id)}
                    onToggleFavorito={toggleFavorito}
                    onAdicionarRapido={adicionarRapido}
                  />
                ))}
              </div>
            )}

            {/* BOTÃO CARREGAR MAIS */}
            {!carregando && produtosExibidos.length > 0 && paginaAtual < totalPaginas - 1 && (
              <div className="mt-12 mb-4 flex justify-center">
                <button
                  onClick={handleCarregarMais}
                  disabled={carregandoMais}
                  className={`
                    flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-sm tracking-wide transition-all shadow-md active:scale-95
                    ${carregandoMais 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#55833d] text-white hover:bg-[#466e32] hover:shadow-lg'
                    }
                  `}
                >
                  {carregandoMais ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Carregando mais...
                    </>
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={2.5} />
                      Carregar Mais Produtos
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <RecipeWidget
        receitaContexto={receitaContexto}
        termoPesquisado={termoPesquisado}
        onIngredienteClick={handleFiltroWidget}
        onClose={fecharWidget}
      />

      <BottomTabBar
        tabs={
          isVendedor
            ? [
              { to: '/home2', label: 'Vitrine', Icon: HomeIcon },
              { to: '/painelvendedor', label: 'Painel', Icon: LayoutDashboard },
              { to: '/receitas', label: 'Receitas', Icon: BookOpen },
              { to: '/chat', label: 'Chat', Icon: MessageCircle, badge: naoLidas },
              { to: '/perfilvendedor', label: 'Perfil', Icon: User },
            ]
            : [
              { to: '/home2', label: 'Início', Icon: HomeIcon },
              { to: '/receitas', label: 'Receitas', Icon: BookOpen },
              { to: '/carrinho', label: 'Carrinho', Icon: ShoppingCart, badge: carrinhoCount },
              { to: '/chat', label: 'Chat', Icon: MessageCircle, badge: naoLidas },
              { to: '/perfil', label: 'Perfil', Icon: User },
            ]
        }
      />
    </div>
  );
}
