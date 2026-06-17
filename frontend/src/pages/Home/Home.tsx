import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, ShoppingBag, ArrowRight, MousePointerClick, 
  Truck, PackageCheck, Leaf, Target 
} from 'lucide-react';
import { getBanners } from '../../services/api';

const SLIDES_DESTAQUE = [
  { 
    id: 1, 
    tipo: "SAFRA DO MÊS",
    titulo: "A melhor época para comprar manga",
    subtitulo: "Produtos frescos e com preços especiais direto do produtor.",
    img: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?q=80&w=2000", 
    corDestaque: "text-[#f9943b]",
    blogId: 3 
  },
  { 
    id: 2, 
    tipo: "HISTÓRIA DE SUCESSO",
    titulo: "Como o seu João dobrou a renda com os morangos",
    subtitulo: "Conheça a trajetória do agricultor que apostou na venda direta.",
    img: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=2000&auto=format&fit=crop", 
    corDestaque: "text-[#55833d]",
    blogId: 5 
  },
  { 
    id: 3, 
    tipo: "TECNOLOGIA NO CAMPO",
    titulo: "A revolução digital chegou ao roçado",
    subtitulo: "Drones e dados auxiliam na precisão da colheita familiar.",
    img: "https://images.pexels.com/photos/34182385/pexels-photo-34182385.jpeg?auto=compress&cs=tinysrgb&w=1260", 
    corDestaque: "text-[#C4D663]",
    blogId: 0 
  }
];

const TRAJETO_DB = [
  { id: 1, titulo: "Escolha", desc: "Selecione produtos frescos direto do catálogo.", Icon: MousePointerClick },
  { id: 2, titulo: "Colheita", desc: "O produtor recebe o pedido e prepara na hora.", Icon: Leaf },
  { id: 3, titulo: "Logística", desc: "Escolha entre frete rápido ou retirada local.", Icon: Truck },
  { id: 4, titulo: "Entrega", desc: "Receba em casa com garantia de origem.", Icon: PackageCheck }
];

const HISTORIAS_DB = [
  { id: 1, nome: "Seu João", local: "Aracaju, SE", perfil: "Produtor", foto: "https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=600", texto: "Desde que comecei a anunciar no site, minhas vendas dobraram. O suporte logístico me permitiu focar no que amo." },
  { id: 2, nome: "Dona Maria", local: "Olinda, PE", perfil: "Artesã", foto: "https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=600", texto: "O site deu visibilidade ao meu artesanato para além da minha cidade. Hoje recebo pedidos de todo o Brasil." },
  { id: 3, nome: "Seu Cícero", local: "Crato, CE", perfil: "Apicultor", foto: "https://images.pexels.com/photos/2583847/pexels-photo-2583847.jpeg?auto=compress&cs=tinysrgb&w=600", texto: "Vender mel direto pela plataforma mudou nossa cooperativa. O pagamento cai direto e seguro." }
];

export default function Home() {
  const [destaques, setDestaques] = useState<any[]>(SLIDES_DESTAQUE);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('origemBlog', 'inicio');
    const loadDestaques = async () => {
      try {
        const data = await getBanners();
        if (data && data.length > 0) {
          const activeBanners = data.filter((b: any) => b.ativo !== false);
          if (activeBanners.length > 0) {
            setDestaques(activeBanners.map((b: any) => ({
              id: b.id,
              tipo: b.tipo || 'DESTAQUE',
              titulo: b.titulo,
              subtitulo: b.subtitulo,
              img: b.imagemUrl,
              corDestaque: b.corDestaque || "text-[#f9943b]",
              blogId: b.linkBlogId || 0
            })));
          } else {
            setDestaques(SLIDES_DESTAQUE);
          }
        } else {
          setDestaques(SLIDES_DESTAQUE);
        }
      } catch (error) {
        console.error("Erro ao carregar banners", error);
        setDestaques(SLIDES_DESTAQUE);
      }
    };
    loadDestaques();
  }, []);

  useEffect(() => {
    if (destaques.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % destaques.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [destaques.length]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F5F2ED] font-sans overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full bg-white flex justify-center py-4 px-6 border-b border-gray-100 shadow-sm z-[100] sticky top-0">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <Link to="/"><img src="/assets/logo-home.png" alt="Rede Nordeste" className="h-12 object-contain" /></Link>
          <Link to="/login" className="bg-[#394158] text-white px-8 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#55833d] transition-all">Entrar</Link>
        </div>
      </header>

      {/* CARROSSEL HERO */}
      <section className="w-full relative overflow-hidden h-[500px] z-10">
        <div className="flex h-full transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {destaques.map((slide) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
              <img src={slide.img} className="w-full h-full object-cover" alt={slide.titulo} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-16 left-0 w-full flex justify-center px-6">
                <div className="w-full max-w-5xl flex flex-col items-start space-y-3">
                  <span className={`font-black uppercase tracking-[0.3em] text-[10px] py-1 px-3 bg-black/40 rounded-full ${slide.corDestaque}`}>{slide.tipo}</span>
                  <h2 className="font-black text-3xl md:text-5xl text-white uppercase italic leading-tight tracking-tight max-w-3xl">{slide.titulo}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 w-full justify-between">
                    <p className="text-sm md:text-base text-white/80 font-medium max-w-xl">{slide.subtitulo}</p>
                    <button 
                      onClick={() => navigate(`/blog/${slide.blogId}`)}
                      className="cursor-pointer flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest bg-white/10 hover:bg-white/30 py-3 px-6 rounded-full border border-white/20 transition-all z-50"
                    >
                      Saiba Mais <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50">
          {destaques.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full cursor-pointer ${i === current ? 'bg-white scale-150' : 'bg-white/30'}`} />
          ))}
        </div>
      </section>

      <main className="w-full flex flex-col items-center">
        {/* TEXTO DE CHAMADA */}
        <div className="text-center space-y-4 py-16 px-6">
          <h1 className="text-4xl font-black italic uppercase text-[#394158]">Conectando quem produz a quem consome</h1>
          <p className="text-[#394158]/70 font-medium">A infraestrutura digital do Nordeste para o comércio direto.</p>
        </div>

        {/* BOTÕES DE ACESSO */}
        <div className="flex flex-wrap justify-center gap-6 mb-24 px-6">
         <Link
          to="/cadastro"
          state={{ tipoPerfil: 'PRODUTOR' }}
          className="flex flex-col items-center bg-[#55833d] text-white p-8 w-64 rounded-[2.5rem] hover:scale-105 transition-all shadow-lg text-center group"
      >
          <Store size={24} className="mb-2" />
          <span className="font-black uppercase text-sm tracking-widest">Sou vendedor</span>
          <span className="text-[9px] font-bold opacity-70 italic">Quero anunciar meus produtos</span>
     </Link>
    <Link
          to="/cadastro"
          state={{ tipoPerfil: 'COMPRADOR' }}
          className="flex flex-col items-center bg-[#f9943b] text-white p-8 w-64 rounded-[2.5rem] hover:scale-105 transition-all shadow-lg text-center group"
      >
        <ShoppingBag size={24} className="mb-2" />
        <span className="font-black uppercase text-sm tracking-widest">Sou comprador</span>
        <span className="text-[9px] font-bold opacity-70 italic">Procuro produtos da região</span>
   </Link>
  </div>
        {/* MISSÃO - FUNDO BRANCO CORRIGIDO */}
        <section className="w-full bg-white flex justify-center py-24 border-y border-gray-100">
          <div className="w-full max-w-7xl px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#55833d]">
                <Target size={20} />
                <h2 className="font-black uppercase italic tracking-widest text-xs text-gray-400">Nossa Missão</h2>
              </div>
              <h3 className="text-4xl font-black text-[#394158] uppercase italic leading-tight">Por que usar a Rede Nordeste?</h3>
              <div className="space-y-4 text-gray-600 font-medium leading-relaxed">
                <p>A Rede Nordeste nasceu para dar voz e escala ao talento das empreendedoras e produtores da nossa terra. Unimos a força do artesanato e da produção regional à inovação digital para remover as barreiras que limitam o crescimento do pequeno negócio.</p>
                <p>Acreditamos na colaboração como motor de mudança. Por isso, oferecemos uma plataforma que conecta quem produz com paixão a quem busca produtos autênticos, garantindo uma logística inteligente e um mercado mais justo, humano e conectado para todos.</p>
              </div>
            </div>
            <div className="rounded-[1rem] overflow-hidden shadow-2xl h-120 bg-gray-50">
              <img src="/assets/image-home3.png" className="w-full h-full object-cover" alt="Nossa Missão" />
            </div>
          </div>
        </section>

        {/* HISTÓRIAS */}
        <section className="w-full max-w-7xl py-24 px-8">
          <h2 className="font-black uppercase italic tracking-widest text-xs text-[#f9943b] mb-12">Histórias de Sucesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HISTORIAS_DB.map((hist) => (
              <div key={hist.id} className="bg-[#ff8a23] p-8 rounded-[1rem] text-white space-y-4 hover:-translate-y-2 transition-all shadow-xl">
                <div className="flex items-center gap-4">
                  <img src={hist.foto} className="w-16 h-16 object-cover rounded-2xl border-2 border-white/20" alt="" />
                  <div>
                    <span className="text-[8px] font-black uppercase text-[#394158] bg-white/20 px-2 py-0.5 rounded-full">{hist.perfil}</span>
                    <h4 className="text-lg font-black uppercase italic">{hist.nome}</h4>
                    <p className="text-[9px] font-bold opacity-60 uppercase">{hist.local}</p>
                  </div>
                </div>
                <p className="text-xs font-medium italic opacity-90 leading-relaxed">"{hist.texto}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRAJETO */}
        <section className="w-full bg-white py-24 flex justify-center border-t border-gray-100">
          <div className="w-full max-w-7xl px-8">
            <h2 className="font-black uppercase italic tracking-widest text-xs text-gray-400 mb-16">Da Rede Nordeste à sua mesa</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
              <div className="hidden md:block absolute top-10 left-10 right-10 border-t-2 border-dashed border-gray-100"></div>
              {TRAJETO_DB.map((item) => (
                <div key={item.id} className="flex flex-col items-center text-center space-y-4 relative z-10 group">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-gray-50 text-[#394158] group-hover:bg-[#55833d] group-hover:text-white transition-all duration-300">
                    <item.Icon size={32} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-xs tracking-widest">{item.titulo}</h4>
                    <p className="text-[10px] text-gray-400 font-bold italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full text-center p-20 bg-gray-50 border-t border-gray-100">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#394158]/60">© 2026 Rede Nordeste - Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}