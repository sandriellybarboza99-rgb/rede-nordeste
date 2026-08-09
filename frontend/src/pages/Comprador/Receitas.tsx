import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, UtensilsCrossed, Clock, 
  ChevronLeft, X, Flame, ChefHat, ScrollText, ShoppingBag, MessageCircle, Search, ChevronRight, Menu, Bell,
  Trash2, Truck, Tag, Info, Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/ui/UserMenu';

const NOTIFICACOES_DATA = [
  { id: 1, titulo: 'Pedido a caminho!', mensagem: 'Seu pedido #4582 saiu para entrega.', tempo: 'Há 2 horas', lida: false, icone: Truck, cor: 'text-[#f9943b]', bg: 'bg-[#f9943b]/10' },
  { id: 2, titulo: 'Promoção do Dia 🍎', mensagem: 'Tomate Cereja com 20% de desconto.', tempo: 'Há 5 horas', lida: false, icone: Tag, cor: 'text-[#55833d]', bg: 'bg-[#55833d]/10' },
  { id: 3, titulo: 'Bem-vindo(a)!', mensagem: 'Explore os produtos da nossa terra.', tempo: 'Há 1 dia', lida: true, icone: Info, cor: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const RECEITAS_DATA = [
  { 
    id: 1, 
    titulo: 'Escondidinho de Carne', 
    tempo: '45 min', 
    dificuldade: 'Média',
    img: 'https://images.unsplash.com/photo-1595666548990-788e19dc3885?q=80&w=1170&auto=format&fit=crop',
    descricao: 'O clássico sertanejo com macaxeira cremosa e queijo coalho gratinado.',
    ingredientes: ['500g de carne de sol', '1kg de macaxeira cozida', '200g de queijo coalho', '1 cebola roxa', 'Nata a gosto'],
    preparo: 'Dessalgue a carne, refogue com cebola. Amasse a macaxeira com nata para o purê. Monte em camadas e gratine com o queijo.'
  },
  { 
    id: 2, 
    titulo: 'Tapioca Gourmet de Queijo', 
    tempo: '10 min', 
    dificuldade: 'Fácil',
    img: 'https://sabores-new.s3.amazonaws.com/public/2024/11/tapiocaalecrim_comqueijo.jpeg',
    descricao: 'Crocante e recheada com o melhor queijo da nossa terra.',
    ingredientes: ['1 xícara de goma de tapioca', '2 fatias grossas de queijo coalho', 'Manteiga de garrafa'],
    preparo: 'Peneire a goma na frigideira quente. Quando ligar, coloque o queijo. Dobre e pincele manteiga de garrafa.'
  },
  { 
    id: 3, 
    titulo: 'Cuscuz Nordestino', 
    tempo: '20 min', 
    dificuldade: 'Fácil',
    img: 'https://www.sabornamesa.com.br/media/k2/items/cache/4fd575b03eae045941eb58c35ab6b353_XL.jpg',
    descricao: 'O café da manhã perfeito com ovos caipira e queijo derretido.',
    ingredientes: ['2 xícaras de flocão de milho', '1 xícara de água', 'Sal a gosto', 'Ovos e queijo para acompanhar'],
    preparo: 'Hidrate o flocão por 10 min. Cozinhe no vapor por 10 min. Sirva com ovos fritos na manteiga e queijo derretido.'
  },
  { 
    id: 4, 
    titulo: 'Bolo de Rolo', 
    tempo: '1h 20min', 
    dificuldade: 'Difícil',
    img: 'https://images.unsplash.com/photo-1593872423141-bb230bd352c6?q=80&w=687&auto=format&fit=crop',
    descricao: 'A iguaria mais famosa de Pernambuco, com camadas finas e goiabada cascão.',
    ingredientes: ['Manteiga', 'Açúcar', 'Farinha de Trigo', 'Goiabada Cascão'],
    preparo: 'Asse camadas finas, recheie com a goiabada derretida e enrole com cuidado ainda quente.'
  },
  { 
    id: 5, 
    titulo: 'Baião de Dois', 
    tempo: '40 min', 
    dificuldade: 'Média',
    img: 'https://www.yoki.com.br/_next/image?url=https%3A%2F%2Fprodcontent.yoki.com.br%2Fwp-content%2Fuploads%2F2024%2F09%2FBaiao-de-dois-800x450-1.jpg&w=1400&q=75',
    descricao: 'O arroz com feijão de corda que é a cara do Nordeste. Prático e delicioso.',
    ingredientes: ['Arroz', 'Feijão de corda', 'Queijo coalho', 'Toucinho'],
    preparo: 'Cozinhe o feijão, adicione o arroz e finalize com pedaços generosos de queijo coalho.'
  },
  { 
    id: 6, 
    titulo: 'Arroz doce verdadeiro', 
    tempo: '1h 30min', 
    dificuldade: 'Média',
    img: 'https://bakeandcakegourmet.com.br/uploads/site/receitas/arroz-doce-sem-leite-ikz3g2us.jpg',
    descricao: 'Para os amantes de doces clássicos, a receita de arroz doce verdadeiro é uma opção perfeita!',
    ingredientes: ['1 e 1/2 litro de leite', '3 xícaras de açúcar', '1 lata de leite condensado', '2 xícaras de arroz branco (já lavado)', 'canela em pau a gosto'],
    preparo: 'Cozinhe o arroz no leite, juntamente com a canela (utilize uma panela grande para que o leite ferva e não derrame). Após 20 minutos, mexa de tempos em tempos. Acrescente o açúcar e deixe por 20 minutos. Logo em seguida, acrescente o leite condensado e deixe por mais 20 minutos. Coloque em uma linda travessa.'
  }
];

export default function Receitas() {
  const [receitas, setReceitas] = useState<any[]>(RECEITAS_DATA);
  const [receitaAberta, setReceitaAberta] = useState<any>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [dificuldadeFiltro, setDificuldadeFiltro] = useState('Todas');
  const [menuAberto, setMenuAberto] = useState(false); 
  const [notifAberta, setNotifAberta] = useState(false); 
  const [notificacoes, setNotificacoes] = useState(NOTIFICACOES_DATA); 
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const isVendedor = perfil === 'PRODUTOR';

  const [carrinhoCount, setCarrinhoCount] = useState(() => {
    const salvo = localStorage.getItem('carrinho_count');
    return salvo ? parseInt(salvo) : 0;
  });

  useEffect(() => {
    const carregarReceitas = () => {
      const salvas = localStorage.getItem('receitas_globais');
      if (salvas) {
        setReceitas(JSON.parse(salvas));
      } else {
        localStorage.setItem('receitas_globais', JSON.stringify(RECEITAS_DATA));
      }
    };
    carregarReceitas();

    const atualizarDados = () => {
      const salvoCarrinho = localStorage.getItem('carrinho_count');
      setCarrinhoCount(salvoCarrinho ? parseInt(salvoCarrinho) : 0);
      carregarReceitas();
    };
    window.addEventListener('storage', atualizarDados);
    return () => window.removeEventListener('storage', atualizarDados);
  }, []);

  const marcarComoLida = (id: number) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const limparNotificacoes = () => {
    if(window.confirm('Deseja limpar todas as notificações?')) setNotificacoes([]);
  };

  const receitasFiltradas = receitas.filter(rec => {
    const correspondeBusca = rec.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                             rec.descricao.toLowerCase().includes(termoBusca.toLowerCase());
    const correspondeDificuldade = dificuldadeFiltro === 'Todas' || rec.dificuldade === dificuldadeFiltro;
    return correspondeBusca && correspondeDificuldade;
  });

  const extrairTermoBusca = (ingrediente: string) => {
    return ingrediente
      .replace(/^[\d\/\se]+(g|kg|l|ml|xícaras?|fatias?|latas?|pacotes?|litros?)?\s*(grossas\s*)?(de\s*)?/i, '')
      .replace(/ para acompanhar| a gosto|\(já lavado\)/gi, '')
      .trim();
  };

  const comprarIngrediente = (ingrediente: string) => {
    const termo = extrairTermoBusca(ingrediente);
    if (receitaAberta) {
      sessionStorage.setItem('receitaContexto', JSON.stringify({
        id: receitaAberta.id,
        titulo: receitaAberta.titulo,
        ingredientes: receitaAberta.ingredientes,
      }));
    }
    navigate(`/home2?busca=${encodeURIComponent(termo)}`, { state: { buscaReceita: termo } });
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased pb-10 font-sans">
      <header className="w-full bg-white py-4 px-4 md:px-8 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-10 flex-shrink-0">
            <Link to="/home2">
              <img src="/assets/logo-home.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
            </Link>
            <nav className="hidden lg:flex gap-6 text-xs md:text-sm font-medium text-[#394158]">
              <Link to="/home2" className="hover:text-[#f9943b] transition-colors">Início</Link>
              <Link to="/receitas" className="text-[#f9943b] border-b-2 border-[#f9943b] pb-1">Receitas</Link>
              <Link to="/blog" className="hover:text-[#f9943b]">Notícias</Link>
              {isVendedor && <Link to="/painelvendedor" className="hover:text-[#f9943b]">Painel Vendedor</Link>}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setNotifAberta(!notifAberta)} 
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 relative group ${notifAberta ? 'bg-[#f9943b] text-white shadow-lg' : 'hover:bg-[#f9943b] text-[#394158] hover:text-white'}`}
                >
                  <Bell className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
                  {notificacoes.filter(n => !n.lida).length > 0 && (
                    <span className="absolute top-0 right-0 md:top-1 md:right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white group-hover:border-[#f9943b]">
                      {notificacoes.filter(n => !n.lida).length}
                    </span>
                  )}
                </button>

                {notifAberta && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setNotifAberta(false)}></div>
                    <div className="absolute top-14 right-0 md:right-auto md:-left-44 w-[320px] md:w-[380px] bg-white rounded-[1rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 z-[70] animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                      <header className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
                        <h3 className="text-sm font-black uppercase italic text-[#394158]">Notificações</h3>
                        <div className="flex gap-2">
                           <button onClick={limparNotificacoes} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                           <button onClick={() => setNotifAberta(false)} className="text-gray-400 hover:text-[#394158] p-1"><X size={16}/></button>
                        </div>
                      </header>
                      <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                        {notificacoes.map(n => (
                          <div key={n.id} onClick={() => marcarComoLida(n.id)} className={`flex gap-4 p-4 border-b border-gray-50 transition-all cursor-pointer hover:bg-gray-50 relative ${!n.lida ? 'bg-[#f9943b]/5' : 'opacity-60'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.bg} ${n.cor}`}><n.icone size={18}/></div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-[11px] font-black uppercase truncate text-[#394158]">{n.titulo}</h4>
                               <p className="text-[10px] font-bold text-gray-500 leading-snug line-clamp-2">{n.mensagem}</p>
                            </div>
                            {!n.lida && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#f9943b] rounded-full"></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link to="/chat" className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <MessageCircle className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </Link>
              <Link to="/carrinho" className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[#f9943b] hover:text-white text-[#394158] group">
                <ShoppingCart className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
                {carrinhoCount > 0 && (
                  <span className="absolute top-0 right-0 md:top-1 md:right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white group-hover:border-[#f9943b]">
                    {carrinhoCount}
                  </span>
                )}
              </Link>
              <UserMenu perfilPath={isVendedor ? "/perfilvendedor" : "/perfil"} />
            </div>

            {/* Mobile */}
            <div className="flex lg:hidden items-center gap-3">
              <UserMenu perfilPath={isVendedor ? "/perfilvendedor" : "/perfil"} />
              <button onClick={() => setMenuAberto(true)} className="md:hidden p-1 text-[#394158] hover:text-[#f9943b] transition-colors"><Menu size={24} /></button>
            </div>
          </div>
        </div>

        {menuAberto && (
          <div className="fixed inset-0 z-[110] md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuAberto(false)}></div>
            <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-8 flex flex-col gap-8">
              <button onClick={() => setMenuAberto(false)} className="self-end p-2 bg-[#F5F2ED] rounded-full text-[#394158] hover:bg-red-500 hover:text-white transition-all">
                <X size={24} />
              </button>
              <nav className="flex flex-col gap-5 text-sm font-black uppercase tracking-widest text-[#394158]">
                <Link to="/home2" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ChevronRight size={14}/> Início</Link>
                <Link to="/receitas" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 text-[#55833d]"><ChevronRight size={14}/> Receitas</Link>
                <Link to="/blog" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#f9943b]"><ChevronRight size={14}/> Notícias</Link>
                {isVendedor && <Link to="/painelvendedor" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#f9943b]"><ChevronRight size={14}/> Painel Vendedor</Link>}
                <hr className="border-gray-50 my-2" />
                <button onClick={() => { setMenuAberto(false); setNotifAberta(true); }} className="flex items-center gap-4 hover:text-[#55833d] uppercase font-black text-sm tracking-widest">
                  <div className="relative">
                    <Bell size={20} />
                    {notificacoes.filter(n => !n.lida).length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{notificacoes.filter(n => !n.lida).length}</span>}
                  </div>
                  Notificações
                </button>
                <Link to="/chat" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><MessageCircle size={20}/> Chat</Link>
                <Link to="/carrinho" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    {carrinhoCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{carrinhoCount}</span>}
                  </div>
                  Carrinho
                </Link>
                <Link to="/perfil" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><User size={20}/> Meu Perfil</Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* ... Restante do conteúdo das receitas permanece exatamente igual ... */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Link to="/home2" className="p-1.5 bg-white rounded-full shadow-sm hover:text-[#f9943b] transition-all">
                <ChevronLeft size={16} />
              </Link>
              <div className="flex items-center gap-2 text-[#55833d]">
                <UtensilsCrossed size={24} />
                <h1 className="text-lg md:text-2xl font-black italic uppercase tracking-tighter">Sabores do Sertão</h1>
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 ml-10">
              Aproveite nossas receitas! Se faltar algo, clique no nome do ingrediente para comprar agora.
            </p>
          </div>
          
          <div className="relative w-full md:w-64 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar receitas..." 
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full bg-white border-none p-3 pl-11 rounded-full text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-[#55833d]/20 transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10 ml-10">
          {['Todas', 'Fácil', 'Média', 'Difícil'].map((nivel) => (
            <button
              key={nivel}
              onClick={() => setDificuldadeFiltro(nivel)}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                dificuldadeFiltro === nivel 
                ? 'bg-[#55833d] text-white shadow-md' 
                : 'bg-white text-gray-400 hover:bg-gray-100'
              }`}
            >
              {nivel}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {receitasFiltradas.length > 0 ? (
            receitasFiltradas.map(rec => (
              <div 
                key={rec.id} 
                onClick={() => setReceitaAberta(rec)}
                className="bg-white rounded-[1rem] overflow-hidden shadow-lg shadow-gray-200/50 group cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-white h-full flex flex-col"
              >
                <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
                  <img src={rec.img || rec.imagem} alt={rec.titulo} className="w-full h-full object-cover block group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#394158] shadow-sm">
                    <Clock size={8} className="text-[#f9943b]" /> {rec.tempo}
                  </div>
                </div>
                <div className="p-3 sm:p-5 flex flex-col flex-1">
                  <span className="text-[#55833d] text-[7px] sm:text-[8px] font-black uppercase tracking-widest italic mb-1 block">{rec.dificuldade}</span>
                  <h3 className="text-[10px] sm:text-sm font-black text-[#394158] mb-1 uppercase italic leading-tight group-hover:text-[#802D44] transition-colors line-clamp-2">{rec.titulo}</h3>
                  <p className="hidden sm:line-clamp-2 text-[10px] text-[#394158]/50 leading-tight mt-1 mb-3 font-medium">{rec.descricao}</p>
                  <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                     <span className="text-[7px] sm:text-[8px] font-black uppercase text-gray-400 tracking-widest">Ver Receita</span>
                     <div className="p-1 bg-[#F5F2ED] rounded-full text-[#394158] group-hover:bg-[#802D44] group-hover:text-white transition-all"><ChevronRight size={12} /></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma receita encontrada...</p>
            </div>
          )}
        </div>
      </main>

      {receitaAberta && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={() => setReceitaAberta(null)}></div>
          <div className="bg-white w-full max-w-3xl max-h-[95vh] rounded-[1rem] relative z-10 overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <button onClick={() => setReceitaAberta(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-white/90 backdrop-blur rounded-[1rem] hover:bg-red-50 hover:text-red-500 transition-all z-30 shadow-md">
              <X size={20} />
            </button>
            <div className="overflow-y-auto no-scrollbar">
              <div className="w-full aspect-video relative overflow-hidden bg-gray-200">
                <img src={receitaAberta.img || receitaAberta.imagem} className="w-full h-full object-cover block" alt={receitaAberta.titulo} />
              </div>
              <div className="p-6 md:p-12 bg-white">
                <div className="flex gap-4 mb-6">
                  <span className="bg-[#F5F2ED] px-4 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm italic"><Clock size={12} className="text-[#f9943b]" /> {receitaAberta.tempo}</span>
                  <span className="bg-[#F5F2ED] px-4 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm italic"><Flame size={12} className="text-[#55833d]" /> {receitaAberta.dificuldade}</span>
                </div>
                <h2 className="text-xl md:text-3xl font-black text-[#394158] uppercase italic mb-10 tracking-tighter leading-none">{receitaAberta.titulo}</h2>
                <div className="space-y-12">
                  <div>
                    <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#394158]/40 mb-6 border-b pb-2"><ChefHat size={18} /> Ingredientes</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(Array.isArray(receitaAberta.ingredientes) ? receitaAberta.ingredientes : (receitaAberta.ingredientes || '').split('\n').filter(Boolean)).map((ing: string, i: number) => (
                        <li key={i} onClick={() => comprarIngrediente(ing)} className="cursor-pointer group flex items-center gap-3 bg-[#F5F2ED]/50 p-4 rounded-[1rem] hover:bg-[#f9943b]/10 transition-all border border-transparent hover:border-[#f9943b]/20">
                          <ShoppingBag size={16} className="text-[#f9943b] group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-bold text-[#394158]/80">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#F5F2ED] p-8 md:p-10 rounded-[1rem] border border-[#394158]/5 shadow-inner">
                    <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#394158] mb-6"><ScrollText size={18} /> Modo de Preparo</h4>
                    <p className="text-base font-medium leading-relaxed text-[#394158]/80 whitespace-pre-line italic">{receitaAberta.preparo}</p>
                  </div>
                </div>
                <button onClick={() => setReceitaAberta(null)} className="w-full mt-12 py-6 bg-[#f9943b] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[1rem] hover:bg-[#55833d] transition-all shadow-xl active:scale-95">Voltar para as receitas</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full text-center p-20 bg-gray-50 border-t border-gray-100">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#394158]/60">© 2026 Rede Nordeste - Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}