import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, ShoppingBag, ArrowRight, MousePointerClick,
  Truck, PackageCheck, Leaf, Target, ChevronLeft, ChevronRight, Quote,
  Apple, Flower2, TreePine, Wheat, Sprout, Sun, Cherry, Citrus, Phone, Mail
} from 'lucide-react';
import { getBanners } from '../../services/api';



const TRAJETO_DB = [
  { id: 1, titulo: "Escolha", desc: "Selecione produtos frescos direto do catálogo.", Icon: MousePointerClick },
  { id: 2, titulo: "Colheita", desc: "O produtor recebe o pedido e prepara na hora.", Icon: Leaf },
  { id: 3, titulo: "Logística", desc: "Escolha entre frete rápido ou retirada local.", Icon: Truck },
  { id: 4, titulo: "Entrega", desc: "Receba em casa com garantia de origem.", Icon: PackageCheck }
];

const CATEGORIAS_DB = [
  { id: 1, titulo: "Produtos Agrícolas", desc: "Frutas, verduras e grãos cultivados com dedicação, garantindo frescor e qualidade direto da roça para sua mesa.", img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", gradient: "from-green-50 to-green-900" },
  { id: 2, titulo: "Artesanato", desc: "Peças únicas feitas à mão que carregam a identidade, cultura e a tradição dos talentosos artesãos nordestinos.", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=600&auto=format&fit=crop", gradient: "from-amber-50 to-amber-500" },
  { id: 3, titulo: "Produtos Têxteis", desc: "Roupas, bordados e tecidos produzidos com cuidado e técnicas tradicionais que valorizam a moda regional.", img: "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=600", gradient: "from-[#f5e6d3] to-[#A0522D]" },
  { id: 4, titulo: "Laticínios", desc: "Queijos artesanais, manteiga da terra e laticínios frescos produzidos com leite de alta qualidade e tradição regional.", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", gradient: "from-yellow-50 to-yellow-600" },
  { id: 5, titulo: "Carnes", desc: "Carnes selecionadas, cortes especiais e embutidos artesanais, valorizando o pequeno produtor e a qualidade local.", img: "https://images.unsplash.com/photo-1728042359930-c0145f0fd442?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", gradient: "from-red-50 to-red-900" },
  { id: 6, titulo: "Gastronomia", desc: "Pratos típicos, doces caseiros e iguarias regionais feitas com afeto, trazendo o verdadeiro sabor do Nordeste.", img: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", gradient: "from-orange-50 to-orange-700" }
];

/* ── Componente de texto com reveal no scroll (estilo releaf.bio) ── */
const REVEAL_WORDS = [
  { text: "A", bold: false },
  { text: "Rede", bold: true },
  { text: "Nordeste", bold: true },
  { text: "nasceu", bold: false },
  { text: "para", bold: false },
  { text: "conectar", bold: true },
  { text: "quem", bold: false },
  { text: "produz", bold: true },
  { text: "com", bold: false },
  { text: "paixão", bold: true },
  { text: "a", bold: false },
  { text: "quem", bold: false },
  { text: "busca", bold: true },
  { text: "produtos", bold: false },
  { text: "autênticos,", bold: false },
  { text: "garantindo", bold: false },
  { text: "uma", bold: false },
  { text: "logística", bold: true },
  { text: "inteligente", bold: true },
  { text: "e", bold: false },
  { text: "um", bold: false },
  { text: "mercado", bold: false },
  { text: "mais", bold: false },
  { text: "justo,", bold: true },
  { text: "humano", bold: true },
  { text: "e", bold: false },
  { text: "conectado.", bold: true },
];

function ScrollRevealText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    // Começa a revelar quando o topo do container atinge 80% da tela
    // Termina quando o topo atinge 20% da tela
    const start = windowH * 0.85;
    const end = windowH * 0.15;
    const rawProgress = (start - rect.top) / (start - end);
    setProgress(Math.max(0, Math.min(1, rawProgress)));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const totalWords = REVEAL_WORDS.length;

  return (
    <div ref={containerRef} className="text-left">
      <p className="text-xl md:text-3xl leading-relaxed md:leading-relaxed tracking-tight">
        {REVEAL_WORDS.map((word, i) => {
          const wordProgress = (progress * totalWords - i);
          const opacity = Math.max(0.15, Math.min(1, wordProgress));
          return (
            <span
              key={i}
              className={`inline-block mr-[0.25em] transition-opacity duration-300 ${word.bold ? 'font-black italic' : 'font-medium'
                }`}
              style={{
                opacity,
                color: '#A0522D',
              }}
            >
              {word.text}
            </span>
          );
        })}
      </p>
      <p
        className="mt-6 text-sm md:text-base font-medium transition-opacity duration-500"
        style={{ opacity: progress > 0.8 ? 1 : 0.3, color: '#A0522D' }}
      >
        A infraestrutura digital do Nordeste para o comércio direto.
      </p>
    </div>
  );
}

const AnimatedTitle = () => {
  const [progress, setProgress] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!titleRef.current) return;
      const rect = titleRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight * 0.95;
      const end = windowHeight * 0.4;

      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <h2
      ref={titleRef}
      className="text-[1.1rem] sm:text-2xl md:text-4xl font-black uppercase italic text-center mb-16 tracking-tight md:tracking-tighter relative z-10 whitespace-nowrap"
    >
      <span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(to right, #4a6741 ${progress * 100}%, #4a674130 ${progress * 100 + 40}%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          transition: 'background-image 0.1s ease-out'
        }}
      >
        O QUE VOCÊ ENCONTRA AQUI
      </span>
    </h2>
  );
};

export default function Home() {
  const [destaques, setDestaques] = useState<any[]>([]);
  const [carregandoBanners, setCarregandoBanners] = useState(true);
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
          }
        }
      } catch (error) {
        console.error("Erro ao carregar banners", error);
      } finally {
        setCarregandoBanners(false);
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
      <header className="w-full bg-white flex justify-center py-4 px-6 border-b border-gray-100 shadow-sm z-[100] fixed top-0 left-0 transition-all duration-300">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <Link to="/"><img src="/assets/logo-home.png" alt="Rede Nordeste" className="h-12 object-contain" /></Link>
          <div className="flex items-center gap-3">
            <Link to="/cadastro" className="border-2 border-[#55833d] text-[#55833d] px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#55833d] hover:text-white transition-all">Cadastrar</Link>
            <Link to="/login" className="bg-[#394158] text-white px-8 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#e68c3e] transition-all">Entrar</Link>
          </div>
        </div>
      </header>
      {/* Espaçador para compensar a navbar fixa */}
      <div className="w-full h-[72px]" />

      {/* CARROSSEL HERO */}
      {carregandoBanners ? (
        <section className="w-full relative overflow-hidden h-[500px] z-10 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 font-black uppercase tracking-widest text-sm">Carregando destaques...</span>
        </section>
      ) : destaques.length === 0 ? (
        <section className="w-full relative overflow-hidden h-[500px] z-10">
          <div className="w-full h-full relative">
            <img src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Rede Nordeste" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-16 left-0 w-full flex justify-center px-6">
              <div className="w-full max-w-5xl flex flex-col items-start space-y-3">
                <span className={`font-black uppercase tracking-[0.3em] text-[10px] py-1 px-3 bg-black/40 rounded-full text-[#55833d]`}>BEM-VINDO</span>
                <h2 className="font-black text-3xl md:text-5xl text-white uppercase italic leading-tight tracking-tight max-w-3xl">Rede Nordeste</h2>
                <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 w-full justify-between">
                  <p className="text-sm md:text-base text-white/80 font-medium max-w-xl">Conectando quem produz a quem consome.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
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
          {destaques.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((prev) => (prev - 1 + destaques.length) % destaques.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-all z-50 cursor-pointer border border-white/10"
                aria-label="Anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setCurrent((prev) => (prev + 1) % destaques.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-all z-50 cursor-pointer border border-white/10"
                aria-label="Próximo"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50">
                {destaques.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full cursor-pointer ${i === current ? 'bg-white scale-150' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <main className="w-full flex flex-col items-center">
        {/* TEXTO + BOTÕES LADO A LADO */}
        <div className="w-full relative overflow-hidden py-28">
          {/* Ícones decorativos de natureza no fundo */}
          <Leaf size={80} className="absolute top-8 left-[5%] text-[#55833d]/[0.06] rotate-[-25deg]" />
          <Apple size={60} className="absolute top-16 right-[8%] text-[#f9943b]/[0.07] rotate-[15deg]" />
          <Flower2 size={70} className="absolute bottom-12 left-[12%] text-[#f9943b]/[0.05] rotate-[30deg]" />
          <TreePine size={90} className="absolute top-1/2 left-[2%] -translate-y-1/2 text-[#55833d]/[0.04] rotate-[-10deg]" />
          <Wheat size={65} className="absolute bottom-8 right-[15%] text-[#55833d]/[0.06] rotate-[20deg]" />
          <Sprout size={50} className="absolute top-12 left-[40%] text-[#55833d]/[0.05] rotate-[-15deg]" />
          <Sun size={55} className="absolute bottom-20 left-[55%] text-[#f9943b]/[0.05] rotate-[10deg]" />
          <Leaf size={45} className="absolute top-1/3 right-[3%] text-[#55833d]/[0.06] rotate-[45deg]" />
          <Cherry size={50} className="absolute bottom-1/3 left-[25%] text-[#f9943b]/[0.05] rotate-[-20deg]" />
          <Citrus size={55} className="absolute top-20 right-[30%] text-[#f9943b]/[0.04] rotate-[25deg]" />
          <Leaf size={35} className="absolute bottom-6 right-[40%] text-[#55833d]/[0.05] rotate-[60deg]" />
          <Sprout size={40} className="absolute top-2/3 right-[6%] text-[#55833d]/[0.05] rotate-[35deg]" />

          <div className="w-full max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-28 relative z-10">
            {/* Texto scroll-reveal à esquerda */}
            <div className="flex-1 max-w-2xl w-full">
              <ScrollRevealText />
            </div>
            {/* Botões empilhados à direita, mais embaixo */}
            <div className="flex flex-col gap-5 flex-shrink-0 md:mt-24 w-full md:w-auto items-center">
              <Link
                to="/cadastro"
                state={{ tipoPerfil: 'PRODUTOR' }}
                className="flex flex-col items-center bg-[#4a6741] text-white py-5 px-10 w-full max-w-[340px] md:w-[340px] rounded-[1.5rem] hover:scale-105 transition-all shadow-lg text-center group"
              >
                <Store size={22} className="mb-2" />
                <span className="font-black uppercase text-sm tracking-widest">Sou vendedor</span>
                <span className="text-[11px] font-semibold italic text-white/90 mt-1">Quero anunciar meus produtos</span>
              </Link>
              <Link
                to="/cadastro"
                state={{ tipoPerfil: 'COMPRADOR' }}
                className="flex flex-col items-center bg-[#e68c3e] text-white py-5 px-10 w-full max-w-[340px] md:w-[340px] rounded-[1.5rem] hover:scale-105 transition-all shadow-lg text-center group"
              >
                <ShoppingBag size={22} className="mb-2" />
                <span className="font-black uppercase text-sm tracking-widest">Sou comprador</span>
                <span className="text-[11px] font-semibold italic text-white mt-1">Procuro produtos da região</span>
              </Link>
            </div>
          </div>
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

        {/* CATEGORIAS */}
        <section className="w-full max-w-7xl py-24 px-8 mx-auto relative">
          {/* Folhinhas de Manjericão de Fundo Estáticas */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden md:block">
            <Leaf size={40} className="absolute top-[5%] left-[2%] text-[#4a6741]/10 rotate-12" strokeWidth={1.5} />
            <Leaf size={25} className="absolute top-[25%] left-[10%] text-[#4a6741]/10 -rotate-45" strokeWidth={1.5} />
            <Leaf size={50} className="absolute top-[15%] left-[85%] text-[#4a6741]/10 rotate-45" strokeWidth={1.5} />
            <Leaf size={20} className="absolute top-[40%] left-[92%] text-[#4a6741]/10 rotate-90" strokeWidth={1.5} />
            <Leaf size={60} className="absolute top-[70%] left-[5%] text-[#4a6741]/10 -rotate-12" strokeWidth={1.5} />
            <Leaf size={30} className="absolute top-[85%] left-[18%] text-[#4a6741]/10 rotate-180" strokeWidth={1.5} />
            <Leaf size={70} className="absolute top-[65%] left-[88%] text-[#4a6741]/10 -rotate-45" strokeWidth={1.5} />
            <Leaf size={35} className="absolute top-[90%] left-[75%] text-[#4a6741]/10 rotate-45" strokeWidth={1.5} />
            <Leaf size={45} className="absolute top-[10%] left-[45%] text-[#4a6741]/10 rotate-12" strokeWidth={1.5} />
            <Leaf size={25} className="absolute top-[85%] left-[50%] text-[#4a6741]/10 -rotate-90" strokeWidth={1.5} />
          </div>

          <AnimatedTitle />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 relative z-10">
            {CATEGORIAS_DB.map((cat) => (
              <div
                key={cat.id}
                className={`group relative p-[4px] md:p-[6px] shadow-xl cursor-pointer bg-gradient-to-b ${cat.gradient}`}
              >
                <div className="relative h-[220px] md:h-[450px] w-full overflow-hidden bg-white">
                  {/* Imagem de Fundo */}
                  <div className="absolute inset-0">
                    <img
                      src={cat.img}
                      alt={cat.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/30"></div>
                  </div>

                  {/* Caixa Branca Central */}
                  <div className="absolute inset-x-1 md:inset-x-6 top-1/2 -translate-y-1/2 bg-white flex flex-col items-center justify-center p-2 md:p-6 shadow-2xl transition-all duration-500">
                    <h3 className="text-[11px] sm:text-sm md:text-2xl font-serif text-[#394158] text-center whitespace-nowrap">
                      {cat.titulo}
                    </h3>

                    {/* Conteúdo Expansível no Hover */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 w-full">
                      <div className="overflow-hidden flex flex-col items-center">
                        <p className="hidden md:block text-[10px] md:text-sm text-gray-500 text-center mt-2 md:mt-4 mb-3 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">
                          {cat.desc}
                        </p>
                        <button onClick={() => navigate('/home2')} className="text-[8px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#394158] hover:text-[#f9943b] transition-colors border-b border-[#394158] hover:border-[#f9943b] pb-0.5 md:pb-1 mt-2 md:mt-0">
                          Ver Produtos &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANIMAÇÃO MARQUEE ESTILO RELEAF.BIO - INTEGRADA COM A SEÇÃO DE CIMA */}
        <section className="w-full py-20 overflow-hidden flex items-center relative h-[300px] md:h-[400px]">
          <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-10 bg-gradient-to-r from-[#F5F2ED] via-transparent to-[#F5F2ED]" style={{ width: '100%' }}></div>
          <div className="animate-marquee flex items-center text-[#e68c3e]">
            {/* O conteúdo é duplicado para criar o efeito infinito sem quebra */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center mx-4 md:mx-8">
                <span className="text-[2.2rem] md:text-[4rem] font-bold tracking-tight lowercase whitespace-nowrap">
                  do campo pra mesa
                </span>
                <Flower2 className="w-10 h-10 md:w-[70px] md:h-[70px] mx-6 md:mx-20 animate-spin-slow text-[#e68c3e]" strokeWidth={2.5} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* RODAPÉ ESTILO RELEAF.BIO VERDE MUSGO COM FOLHA DECORATIVA */}
      <footer className="w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1920px] mx-auto bg-[#4a6741] relative overflow-hidden rounded-[2rem] mb-4 md:mb-6 shadow-2xl">
        {/* Folhas decorativas SVG no fundo (linhas finas inspiradas no releaf) */}
        <svg className="absolute top-0 right-0 w-[800px] h-[800px] text-white/[0.1] -translate-y-1/4 translate-x-1/4" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100,10 Q140,50 130,100 Q120,150 80,180 Q60,140 50,100 Q40,60 100,10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M95,15 L100,180" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.6" />
          <path d="M70,60 Q85,55 95,50" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
          <path d="M65,90 Q80,80 97,75" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
          <path d="M70,120 Q82,110 96,105" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
          <path d="M80,145 Q88,138 97,132" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-[600px] h-[600px] text-white/[0.08] translate-y-1/4 -translate-x-1/4 rotate-45" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100,10 Q140,50 130,100 Q120,150 80,180 Q60,140 50,100 Q40,60 100,10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M95,15 L100,180" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.6" />
          <path d="M70,60 Q85,55 95,50" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
          <path d="M65,90 Q80,80 97,75" stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.5" />
        </svg>

        {/* Conteúdo principal do rodapé */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pt-12 md:pt-24 pb-8 md:pb-12 flex flex-col justify-between min-h-[300px] md:min-h-[500px]">

          <div className="flex flex-row justify-between items-start w-full gap-4 md:gap-0">
            {/* Coluna Esquerda: Logo e Infos */}
            <div className="flex flex-col justify-between h-full space-y-8 md:space-y-20 w-[60%] md:w-auto">
              <div className="space-y-4 md:space-y-6">
                <Link to="/">
                  <img src="/assets/logo-rodape.png" alt="Rede Nordeste" className="h-20 md:h-[140px] object-contain" />
                </Link>
                <div className="space-y-1">
                  <p className="text-white text-[10px] md:text-lg font-medium leading-tight">A infraestrutura digital do</p>
                  <p className="text-white text-[10px] md:text-lg font-medium leading-tight">Nordeste para o comércio direto</p>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <a href="tel:+5579999999999" className="flex items-center gap-2 md:gap-4 text-white text-[9px] md:text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap">
                  <Phone strokeWidth={1.5} className="w-3 h-3 md:w-[18px] md:h-[18px]" /> +55 (79) 9999-9999
                </a>
                <a href="mailto:contato@redenordeste.com.br" className="flex items-center gap-2 md:gap-4 text-white text-[9px] md:text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap">
                  <Mail strokeWidth={1.5} className="w-3 h-3 md:w-[18px] md:h-[18px]" /> contato@redenordeste.com.br
                </a>
              </div>
            </div>

            {/* Coluna Direita: Links Grandes e Pequenos */}
            <div className="flex flex-col items-end w-[40%] md:w-auto">

              {/* Links Grandes */}
              <nav className="flex flex-col space-y-4 md:space-y-5 text-right mb-10 md:mb-16">
                <Link to="/" className="text-white text-sm md:text-2xl font-semibold hover:text-[#f9943b] transition-colors">Nossa Missão</Link>
                <Link to="/" className="text-white text-sm md:text-2xl font-semibold hover:text-[#f9943b] transition-colors">Trabalhe conosco</Link>
                <Link to="/" className="text-white text-sm md:text-2xl font-semibold hover:text-[#f9943b] transition-colors">Atendimento</Link>
                <Link to="/" className="text-white text-sm md:text-2xl font-semibold hover:text-[#f9943b] transition-colors">Sobre nós</Link>
              </nav>

              {/* Links Pequenos */}
              <nav className="flex flex-col space-y-2 md:space-y-4 text-right">
                <a href="#" className="text-white text-[8px] md:text-sm font-medium hover:underline">Redenordeste.com.br</a>
                <a href="#" className="text-white text-[8px] md:text-sm font-medium hover:underline">Termos de uso</a>
                <a href="#" className="text-white text-[8px] md:text-sm font-medium hover:underline">Política de Privacidade</a>
                <a href="#" className="text-white text-[8px] md:text-sm font-medium hover:underline">Cookies</a>
              </nav>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}