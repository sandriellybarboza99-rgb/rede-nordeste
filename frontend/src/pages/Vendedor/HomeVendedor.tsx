import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Plus, Filter, MapPin,
  Star, LayoutGrid, Palette, Beef, Sprout, Wheat, Carrot, Milk, Bed, Utensils, Shirt,
  MessageCircle, Heart, ChevronRight, Menu, X, BookOpen, Store, Bell, ChevronLeft, HelpCircle,
  Home as HomeIcon, LayoutDashboard
} from 'lucide-react';
import {
  buscarProdutos, getCategorias, adicionarAoCarrinho, getNaoLidas
} from '../../services/api';
import { UserMenu } from '../../components/ui/UserMenu';
import { BottomTabBar } from '../../components/ui/BottomTabBar';

const CATEGORIAS_ICONES: Record<string, any> = {
  'Todos': LayoutGrid, 'Artesanato': Palette, 'Carnes': Beef,
  'Colheita': Sprout, 'Grãos': Wheat, 'Hortifruti': Carrot,
  'Laticínios': Milk, 'Cama Mesa e Banho': Bed, 'Gastronomia': Utensils, 'Têxtil': Shirt,
};

const EMPREENDEDORAS = [
  { id: 1, nome: "Dona Maria", negocio: "Cerâmicas do Povo", territorio: "Baixo São Francisco", historia: "Mestra ceramista há 30 anos em Santana do São Francisco. Aprendeu a arte com sua avó e hoje lidera uma cooperativa de 12 mulheres.", img: "https://cdn.awsli.com.br/2500x2500/1616/1616697/produto/109903915/e2bbd94d12.jpg" },
  { id: 2, nome: "Chef Ana Nunes", negocio: "Sabor de Mulher", territorio: "Grande Aracaju", historia: "Especialista em gastronomia afetiva, Ana utiliza apenas ingredientes de produtores locais para criar pratos que contam a história de Sergipe.", img: "https://www.brasildefato.com.br/wp-content/uploads/2024/09/image_processing20201106-23882-1kiy8l9.jpeg" },
  { id: 3, nome: "Lúcia da Palha", negocio: "Arte Ilha do Ferro", territorio: "Sertão Ocidental", historia: "Lúcia transforma a palha de Ouricuri em peças de design moderno sem perder a essência do artesanato tradicional.", img: "https://agenciasebrae.com.br/wp-content/uploads/2026/02/artesanato-7.jpeg" },
];

export default function HomeComprador() {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Dados da API ─────────────────────────────────────────────────
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Todos']);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(false);

  // ── Filtros e UI ─────────────────────────────────────────────────
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [ordenacao, setOrdenacao] = useState('recomendados');
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mulherSelecionada, setMulherSelecionada] = useState<typeof EMPREENDEDORAS[0] | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carrinhoCount, setCarrinhoCount] = useState(0);
  const [naoLidas, setNaoLidas] = useState(0);
  const [tutorialAberto, setTutorialAberto] = useState(false);

  // ── Carrega categorias ────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem('origemBlog', 'painel');
    
    // Tutorial
    if (!localStorage.getItem('tutorial_visto_vendedor')) {
      setTutorialAberto(true);
      localStorage.setItem('tutorial_visto_vendedor', 'true');
    }

    getCategorias()
      .then((data: any[]) => setCategorias(['Todos', ...data.map((c: any) => c.nome)]))
      .catch(() => setCategorias(['Todos']));

    const raw = localStorage.getItem('usuarioLogado');
    if (raw) {
      getNaoLidas().then((d: any) => setNaoLidas(d.total)).catch(() => {});
    }

    const salvos = localStorage.getItem('favoritos_itens');
    if (salvos) setFavoritos(JSON.parse(salvos));
  }, []);

  // ── Carrega produtos ──────────────────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const data = await buscarProdutos(
          termoPesquisado || undefined,
          undefined,
          paginaAtual
        );
        setProdutos(data.content);
        setTotalPaginas(data.totalPages);
      } catch {
        setProdutos([]);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [termoPesquisado, catAtiva, paginaAtual]);

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
      await adicionarAoCarrinho(produtoId, 1);
      setCarrinhoCount(c => c + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePesquisa = () => {
    setTermoPesquisado(busca);
    setCatAtiva('Todos');
    setPaginaAtual(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePesquisa();
  };

  const handleCategoriaClick = (nome: string) => {
    setCatAtiva(nome);
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
            <Link to="/vendedor"><img src="/assets/logo-home.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" /></Link>
            <nav className="hidden lg:flex gap-6 text-xs md:text-sm font-medium text-[#394158]">
              <Link to="/vendedor" className="text-[#55833d] font-bold border-b-2 border-[#55833d] pb-1">Início</Link>
              <Link to="/receitasvendedor" className="hover:text-[#f9943b] transition-colors">Receitas</Link>
              <Link to="/blog" className="hover:text-[#f9943b] transition-colors">Notícias</Link>
              <Link to="/painelvendedor" className="hover:text-[#f9943b] transition-colors">Painel Vendedor</Link>
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
              <button title="Ajuda" onClick={() => setTutorialAberto(true)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158]">
                <HelpCircle className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </button>
              <Link title="Notificações" to="/notificacoes" className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <Bell className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
                {naoLidas > 0 && (
                  <span className="absolute top-0 right-0 md:top-1 md:right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white group-hover:border-[#f9943b]">
                    {naoLidas}
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
              <UserMenu perfilPath="/perfilvendedor" />
            </div>

            {/* Mobile: só o menu hambúrguer + UserMenu compacto */}
            <div className="flex lg:hidden items-center gap-3">
              <UserMenu perfilPath="/perfilvendedor" />
              <button onClick={() => setMenuAberto(true)} className="p-1 text-[#394158] hover:text-[#f9943b]"><Menu size={24} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* ── RESTANTE DO CÓDIGO PERMANECE IGUAL ────────────────────── */}
      {/* ... (Menu Mobile, Modais, Main Content, Footer) */}
      {menuAberto && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-8 flex flex-col gap-8">
            <button onClick={() => setMenuAberto(false)} className="self-end p-2 bg-[#F5F2ED] rounded-full"><X size={24} /></button>
            <nav className="flex flex-col gap-5 text-sm md:text-base font-medium text-[#394158]">
              <Link to="/vendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={16} /> Início</Link>
              <Link to="/receitasvendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={16} /> Receitas</Link>
              <Link to="/blog" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={16} /> Notícias</Link>
              <Link to="/painelvendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={16} /> Painel Vendedor</Link>
              <button onClick={() => { setMenuAberto(false); setTutorialAberto(true); }} className="flex items-center gap-4 hover:text-[#55833d] text-left"><HelpCircle size={16} /> Guia Rápido</button>
              <hr className="border-gray-100" />
              <Link to="/notificacoes" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]">
                <div className="relative">
                  <Bell size={20} />
                  {naoLidas > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{naoLidas}</span>}
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
              <Link to="/perfilvendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><User size={20} /> Meu Perfil</Link>
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
                <div className="p-3 bg-white text-[#f9943b] rounded-full shadow-sm shrink-0"><Search size={20}/></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Busca & Filtros</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Use a busca no topo ou clique nas categorias (Laticínios, Hortifruti) para achar exatamente o que precisa.</p></div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="p-3 bg-white text-[#55833d] rounded-full shadow-sm shrink-0"><ShoppingCart size={20}/></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Carrinho</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Clique no botão laranja com "+" nos produtos para adicionar ao carrinho, depois vá no ícone superior para fechar a compra.</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="p-3 bg-white text-red-500 rounded-full shadow-sm shrink-0"><Heart size={20}/></div>
                <div><h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Favoritar</h4><p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Gostou de algo mas não quer comprar agora? Clique no coração no canto dos produtos para salvá-lo na sua lista.</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><Bell size={14}/></div>
                    <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><MessageCircle size={14}/></div>
                  </div>
                  <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm w-fit mx-auto"><User size={14}/></div>
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

      {mulherSelecionada && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMulherSelecionada(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[1rem] overflow-hidden shadow-2xl">
            <button onClick={() => setMulherSelecionada(null)} className="absolute top-6 right-6 z-10 bg-white/80 p-2 rounded-full"><X size={20} /></button>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={mulherSelecionada.img} className="w-full h-full object-cover" alt={mulherSelecionada.nome} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#55833d]/60 to-transparent" />
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#55833d] mb-2"><MapPin size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{mulherSelecionada.territorio}</span></div>
                <h2 className="text-2xl font-black text-[#394158] mb-1">{mulherSelecionada.nome}</h2>
                <span className="text-[#f9943b] font-black italic uppercase text-xs mb-6">{mulherSelecionada.negocio}</span>
                <div className="bg-[#F5F2ED] p-5 rounded-3xl mb-8">
                  <div className="flex items-center gap-2 mb-3 text-[#394158]/50 uppercase font-black text-[9px]"><BookOpen size={12} /> Nossa História</div>
                  <p className="text-sm text-[#394158] leading-relaxed italic">"{mulherSelecionada.historia}"</p>
                </div>
                <button onClick={() => setMulherSelecionada(null)} className="w-full bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3"><Store size={16} /> Ver Loja</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <div className="relative w-full mb-8 md:hidden">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="O que procura?"
            className="w-full bg-white py-3 pl-6 pr-12 rounded-full border border-gray-100 shadow-sm outline-none text-sm" />
          <button onClick={handlePesquisa} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#55833d] text-white p-2 rounded-full">
            <Search size={16} />
          </button>
        </div>

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
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
            {EMPREENDEDORAS.map(mulher => (
              <div key={mulher.id} onClick={() => setMulherSelecionada(mulher)}
                className="min-w-[240px] bg-white rounded-[1rem] p-3 shadow-lg flex items-center gap-3 group cursor-pointer hover:bg-[#aab2c1] transition-all duration-500 border border-white">
                <img src={mulher.img} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#394158]/20" alt={mulher.nome} />
                <div>
                  <h3 className="text-xs font-black uppercase text-[#394158] group-hover:text-white transition-colors leading-tight">{mulher.nome}</h3>
                  <span className="text-[10px] font-bold text-[#394158]/60 group-hover:text-white/80 transition-colors uppercase italic">{mulher.negocio}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-6xl mx-auto bg-gray-100/50 p-4 md:p-10 rounded-[1rem] border border-gray-200 shadow-inner mb-12">
          <div className="mb-12">
            <h2 className="text-xs md:text-xl font-black uppercase tracking-widest italic mb-10 text-[#394158]">Categorias</h2>
            <div className="flex flex-wrap justify-center gap-y-5 gap-x-2 md:grid md:grid-cols-5 md:gap-8 justify-items-center max-w-4xl mx-auto px-1">
              {categorias.map(nome => {
                const Icone = CATEGORIAS_ICONES[nome] || LayoutGrid;
                return (
                  <button key={nome} onClick={() => handleCategoriaClick(nome)}
                    className="flex flex-col items-center gap-1.5 md:gap-3 w-[78px] md:w-[120px] group">
                    <div className={`w-[52px] h-[52px] md:w-[72px] md:h-[72px] rounded-[18px] md:rounded-[24px] flex items-center justify-center border transition-all ${catAtiva === nome ? 'bg-[#f9943b] border-[#f9943b] text-white shadow-md scale-105' : 'bg-white border-gray-100 text-[#394158] shadow-sm group-hover:border-[#f9943b] group-hover:text-[#f9943b]'}`}>
                      <Icone className="w-[22px] h-[22px] md:w-8 md:h-8" strokeWidth={1.5} />
                    </div>
                    <span className={`text-[11px] md:text-[13px] leading-[1.1] text-center px-0.5 ${catAtiva === nome ? 'font-bold text-[#f9943b]' : 'font-medium text-gray-700'}`}>{nome}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h2 className="text-xl font-black italic uppercase text-[#394158]">{catAtiva !== 'Todos' ? catAtiva : 'Nossos Produtos'}</h2>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm self-start">
                <Filter size={14} className="text-[#55833d]" />
                <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer">
                  <option value="recomendados">Recomendados</option>
                  <option value="menor_preco">Menor Preço</option>
                  <option value="maior_preco">Maior Preço</option>
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="text-center py-20 text-sm font-black uppercase text-gray-300">Carregando...</div>
            ) : produtosExibidos.length === 0 ? (
              <div className="text-center py-20 text-sm font-black uppercase text-gray-300">Nenhum produto encontrado</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-8">
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
                    <span className="text-[6px] md:text-[9px] font-black uppercase text-[#55833d] mb-1">{prod.nomeCategoria}</span>
                    <Link to={`/produto/${prod.id}`}>
                      <h3 className="font-bold text-[#394158] text-[8px] md:text-sm leading-tight mb-1 line-clamp-1 hover:text-[#55833d] transition-colors">{prod.nome}</h3>
                    </Link>
                    <div className="flex items-center gap-1 text-[#394158]/50 mb-2 uppercase font-bold text-[6px] md:text-[9px]">
                      <MapPin size={8} /> {prod.nomeLoja}
                    </div>
                    <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[10px] md:text-lg font-black text-[#394158]">
                        R$ {Number(prod.precoAtual).toFixed(2)}
                        <span className="text-[7px] md:text-[10px] opacity-40 ml-1">/{prod.unidadeMedida}</span>
                      </span>
                      <Link to={`/produto/${prod.id}`} className="hidden md:block text-[9px] font-black uppercase bg-[#394158] text-white px-4 py-1.5 rounded-xl hover:bg-[#55833d]">Detalhes</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-gray-100">
                <button onClick={() => setPaginaAtual(p => Math.max(0, p - 1))} disabled={paginaAtual === 0}
                  className={`p-2 rounded-full transition-all ${paginaAtual === 0 ? 'text-gray-200' : 'hover:bg-white text-[#394158] shadow-sm'}`}>
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPaginas)].map((_, i) => (
                  <button key={i} onClick={() => setPaginaAtual(i)}
                    className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${paginaAtual === i ? 'bg-[#394158] text-white shadow-md' : 'bg-white text-[#394158]/40 hover:bg-gray-200 shadow-sm'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas - 1, p + 1))} disabled={paginaAtual === totalPaginas - 1}
                  className={`p-2 rounded-full transition-all ${paginaAtual === totalPaginas - 1 ? 'text-gray-200' : 'hover:bg-white text-[#394158] shadow-sm'}`}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full text-center p-20 bg-gray-50 border-t border-gray-100 mb-16 md:mb-0">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#394158]/60">© 2026 Rede Nordeste - Todos os direitos reservados.</span>
      </footer>

      <BottomTabBar
        tabs={[
          { to: '/vendedor',         label: 'Vitrine',  Icon: HomeIcon },
          { to: '/painelvendedor',   label: 'Painel',   Icon: LayoutDashboard },
          { to: '/receitasvendedor', label: 'Receitas', Icon: BookOpen },
          { to: '/chat',             label: 'Chat',     Icon: MessageCircle, badge: naoLidas },
          { to: '/perfilvendedor',   label: 'Perfil',   Icon: User },
        ]}
      />
    </div>
  );
}