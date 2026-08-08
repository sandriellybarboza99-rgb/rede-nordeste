import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Plus, Filter, MapPin,
  Star, LayoutGrid, Palette, Beef, Sprout, Wheat, Carrot, Milk, Bed, Utensils, Shirt,
  MessageCircle, Heart, ChevronRight, ChevronLeft, Menu, X, BookOpen, Store, Bell, HelpCircle, Home as HomeIcon, LayoutDashboard, Sparkles
} from 'lucide-react';
import {
  buscarProdutos, getCategorias, adicionarAoCarrinho, getNaoLidas, getCarrinho, getEmpreendedoras, getMinhaLoja
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/ui/UserMenu';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { ModalEmpreendedora } from '../../components/modals/ModalEmpreendedora';

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

export default function HomeComprador() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const isVendedor = usuario?.perfil === 'PRODUTOR';
  const isMulherProdutora = usuario?.perfil === 'PRODUTOR' && usuario?.genero === 'FEMININO';

  // ── Dados da API ─────────────────────────────────────────────────
  type CategoriaAPI = { id: number; nome: string };
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([{ id: 0, nome: 'Todos' }]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0); // incrementar força re-fetch
  const [minhaLojaId, setMinhaLojaId] = useState<number | null>(null);

  // ── Filtros e UI ─────────────────────────────────────────────────
  // catAtiva guarda o NOME para destacar o chip; catAtivaId guarda o ID para filtrar
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [catAtivaId, setCatAtivaId] = useState<number | undefined>(undefined);
  const [notificacoesNaoLidas] = useState(2); // Mock para contagem visual de notificações
  const [busca, setBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [ordenacao, setOrdenacao] = useState('recomendados');
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [empreendedoras, setEmpreendedoras] = useState<any[]>([]);
  const [mulherSelecionada, setMulherSelecionada] = useState<any | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carrinhoCount, setCarrinhoCount] = useState(0);
  const [naoLidas, setNaoLidas] = useState(0);
  const [tutorialAberto, setTutorialAberto] = useState(false);
  const [modalEmpreendedoraAberto, setModalEmpreendedoraAberto] = useState(false);
  const [minhaLojaParaModal, setMinhaLojaParaModal] = useState<any>(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [facetasEstados, setFacetasEstados] = useState<any[]>([]);
  const [facetasCidades, setFacetasCidades] = useState<any[]>([]);

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

  // ── Carrega categorias ────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem('origemBlog', 'painel');

    // Tutorial
    const tutorialKey = isVendedor ? 'tutorial_visto_vendedor' : 'tutorial_visto_comprador';
    if (!localStorage.getItem(tutorialKey)) {
      setTutorialAberto(true);
      localStorage.setItem(tutorialKey, 'true');
    }

    // Carrega categorias e destaques
    const carregaFiltros = async () => {
      try {
        const [cats, emp] = await Promise.all([
          getCategorias(),
          getEmpreendedoras().catch(() => []) // se falhar, retorna array vazio
        ]);
        setCategorias([{ id: 0, nome: 'Todos' }, ...cats]);
        setEmpreendedoras(emp);
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
          // Guarda dados da loja para uso no modal de empreendedora
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
  }, []);

  // ── Carrega produtos ──────────────────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      setErroCarregamento(null);
      try {
        const data = await buscarProdutos(
          termoPesquisado || undefined,
          catAtivaId, // ID real da categoria (undefined quando "Todos")
          paginaAtual,
          estadoFiltro || undefined,
          cidadeFiltro || undefined
        );

        let prods = data.produtos?.content || data.content || [];
        if (isVendedor && minhaLojaId) {
          prods = prods.filter((p: any) => p.lojaId !== minhaLojaId);
        }

        setProdutos(prods);
        setTotalPaginas(data.produtos?.totalPages || data.totalPages || 1);
        
        if (data.facetas) {
          setFacetasEstados(data.facetas.estados || []);
          setFacetasCidades(data.facetas.cidades || []);
        }
      } catch (err: any) {
        // Não esconder o erro: distinguir "falha de carregamento" de "vitrine vazia".
        setProdutos([]);
        setErroCarregamento(err?.message || 'Erro ao carregar produtos.');
      } finally {
        setCarregando(false);
      }
    };

    // Se for vendedor, aguarda descobrir o lojaId antes de buscar os produtos
    if (isVendedor && minhaLojaId === null) {
      return;
    }

    carregar();
  }, [termoPesquisado, catAtivaId, paginaAtual, tentativa, isVendedor, minhaLojaId, estadoFiltro, cidadeFiltro]);

  // ── Redirect de receitas ──────────────────────────────────────────
  useEffect(() => {
    if (location.state && (location.state as any).buscaReceita) {
      const termo = (location.state as any).buscaReceita;
      setBusca(termo);
      setTermoPesquisado(termo);
      setCatAtiva('Todos');
      setPaginaAtual(0);
    }
  }, [location.state]);

  // ── Helpers ───────────────────────────────────────────────────────
  const toggleFavorito = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation();
    const novos = favoritos.includes(id)
      ? favoritos.filter(f => f !== id)
      : [...favoritos, id];
    setFavoritos(novos);
    localStorage.setItem('favoritos_itens', JSON.stringify(novos));
  };

  const adicionarRapido = async (e: React.MouseEvent, produtoId: number) => {
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
  };

  const handlePesquisa = () => {
    setTermoPesquisado(busca);
    setCatAtiva('Todos');
    setCatAtivaId(undefined);
    setPaginaAtual(0);
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
  };

  const produtosExibidos = [...produtos].sort((a, b) => {
    if (ordenacao === 'menor_preco') return a.precoAtual - b.precoAtual;
    if (ordenacao === 'maior_preco') return b.precoAtual - a.precoAtual;
    return 0;
  });

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

      {/* MODAL DO TUTORIAL */}
      {tutorialAberto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTutorialAberto(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95">
            <button onClick={() => setTutorialAberto(false)} className="absolute top-6 right-6 p-2 bg-[#F5F2ED] rounded-full hover:bg-gray-200"><X size={20} /></button>

            <div className="text-center space-y-2 mt-4 md:mt-0">
              <h2 className="text-xl md:text-2xl font-black italic uppercase text-[#394158]">Guia Rápido</h2>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Aprenda a usar a plataforma</p>
            </div>

            <div className="space-y-3 max-h-[50vh] md:max-h-[60vh] overflow-y-auto no-scrollbar pb-4 px-2">
              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="p-3 bg-white text-[#f9943b] rounded-full shadow-sm shrink-0"><Search size={20} /></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Busca & Filtros</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Use a busca no topo ou clique nas categorias (Laticínios, Hortifruti) para achar exatamente o que precisa.</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="p-3 bg-white text-[#55833d] rounded-full shadow-sm shrink-0"><ShoppingCart size={20} /></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Carrinho</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Clique no botão laranja com "+" nos produtos para adicionar ao carrinho, depois vá no ícone superior para fechar a compra.</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="p-3 bg-white text-red-500 rounded-full shadow-sm shrink-0"><Heart size={20} /></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Favoritar</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Gostou de algo mas não quer comprar agora? Clique no coração no canto dos produtos para salvá-lo na sua lista.</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><Bell size={14} /></div>
                    <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><MessageCircle size={14} /></div>
                  </div>
                  <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm w-fit mx-auto"><User size={14} /></div>
                </div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Menu Superior (PC) / Lateral (Celular)</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Notificações, Chat direto com vendedores e Meu Perfil ficam sempre acessíveis nos ícones do cabeçalho ou menu.</p></div>
              </div>
            </div>

            <button onClick={() => setTutorialAberto(false)} className="w-full bg-[#55833d] text-white py-4 rounded-[1rem] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg hover:bg-[#436b2f] transition-colors mt-2">
              Entendi, Vamos Lá!
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALHE MULHER */}
      {mulherSelecionada && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMulherSelecionada(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[1rem] overflow-hidden shadow-2xl">
            <button onClick={() => setMulherSelecionada(null)} className="absolute top-6 right-6 z-10 bg-white/80 p-2 rounded-full"><X size={20} /></button>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={mulherSelecionada.fotoEmpreendedoraUrl || mulherSelecionada.fotoPerfilUrl || mulherSelecionada.logoUrl || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt={mulherSelecionada.nomeProprietaria || mulherSelecionada.nomeLoja} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#55833d]/60 to-transparent" />
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#55833d] mb-2"><MapPin size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{mulherSelecionada.cidade || 'Sergipe'}</span></div>
                <h2 className="text-2xl font-black text-[#394158] mb-1">{mulherSelecionada.nomeProprietaria || 'Produtora'}</h2>
                <span className="text-[#f9943b] font-black italic uppercase text-xs mb-6">{mulherSelecionada.nomeLoja}</span>
                <div className="bg-[#F5F2ED] p-5 rounded-3xl mb-8">
                  <div className="flex items-center gap-2 mb-3 text-[#394158]/50 uppercase font-black text-[9px]"><BookOpen size={12} /> Nossa Historia</div>
                  <p className="text-sm text-[#394158] leading-relaxed italic">"{mulherSelecionada.historiaEmpreendedora || mulherSelecionada.descricaoBio || 'Sem descricao.'}"</p>
                </div>
                <button onClick={() => { setMulherSelecionada(null); navigate(`/loja/${mulherSelecionada.id}`); }} className="w-full bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3"><Store size={16} /> Ver Loja</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro por Estado */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <MapPin size={14} className="text-[#55833d]" />
                  <select 
                    value={estadoFiltro} 
                    onChange={e => {
                      setEstadoFiltro(e.target.value);
                      setCidadeFiltro('');
                      setPaginaAtual(0);
                    }}
                    className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#394158]"
                  >
                    <option value="">Todos os Estados</option>
                    {facetasEstados.map(f => {
                      const est = ESTADOS_NORDESTE.find(e => e.uf === f.chave);
                      return (
                        <option key={f.chave} value={f.chave}>
                          {est ? est.nome : f.chave} ({f.quantidade})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Filtro por Cidade */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <select 
                    value={cidadeFiltro} 
                    onChange={e => {
                      setCidadeFiltro(e.target.value);
                      setPaginaAtual(0);
                    }}
                    className="bg-transparent text-[10px] font-bold outline-none w-24 md:w-32 text-[#394158] uppercase cursor-pointer"
                  >
                    <option value="">Todas as Cidades</option>
                    {facetasCidades.map(f => (
                      <option key={f.chave} value={f.chave}>
                        {f.chave} ({f.quantidade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenação */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <Filter size={14} className="text-[#55833d]" />
                  <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#394158]">
                    <option value="recomendados">Recomendados</option>
                    <option value="menor_preco">Menor Preço</option>
                    <option value="maior_preco">Maior Preço</option>
                  </select>
                </div>
              </div>
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
                  <div key={prod.id} className="relative bg-white p-2 md:p-5 rounded-[1rem] shadow-xl flex flex-col group border border-transparent hover:border-[#55833d]/20 transition-all">
                    <button onClick={e => toggleFavorito(e, prod.id)}
                      className="absolute top-3 left-3 z-20 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform">
                      <Heart size={14} className={favoritos.includes(prod.id) ? "fill-[#802D44] text-[#802D44]" : "text-gray-400"} />
                    </button>
                    <div className="relative overflow-hidden rounded-[1rem] mb-3 md:mb-4 aspect-square">
                      <Link to={`/produto/${prod.id}`}>
                        <img src={prod.imagemUrl || 'https://via.placeholder.com/400'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={prod.nome} />
                      </Link>
                      <button onClick={e => adicionarRapido(e, prod.id)}
                        className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[#f9943b] text-white p-1.5 md:p-2.5 rounded-full shadow-xl z-10 active:scale-90">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black uppercase text-[#55833d] mb-1">{prod.nomeCategoria}</span>
                    <Link to={`/produto/${prod.id}`}>
                      <h3 className="font-bold text-[#394158] text-[11px] md:text-sm leading-tight mb-1 line-clamp-1 hover:text-[#55833d] transition-colors">{prod.nome}</h3>
                    </Link>
                    <div className="flex items-center gap-1 text-[#394158]/50 mb-2 uppercase font-bold text-[8px] md:text-[9px]">
                      <MapPin size={8} /> {prod.nomeLoja}{prod.cidade ? ` • ${prod.cidade}${prod.estado ? `/${prod.estado}` : ''}` : ''}
                    </div>
                    <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-xs md:text-lg font-black text-[#394158]">
                        R$ {prod.precoAtual?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

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
