import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Ear, Tractor, ChevronRight, Leaf, Lightbulb, Store, Droplets, Package } from "lucide-react";
import { getNoticias } from "../../services/api";
import "./Blog.css";

export default function Blog() {
  const navigate = useNavigate();
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [ordem, setOrdem] = useState<"recentes" | "antigas">("recentes");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [posts, setPosts] = useState<any[]>([]);

  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuarioLogado = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  const origemBlog = sessionStorage.getItem('origemBlog');
  const mostrarPainel = origemBlog === 'painel' && usuarioLogado && usuarioLogado.perfil;

  const irParaPainel = () => {
    if (usuarioLogado?.perfil === 'PRODUTOR') {
      navigate('/vendedor');
    } else if (usuarioLogado?.perfil === 'COMPRADOR') {
      navigate('/home2');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroAtivo, ordem]);

  useEffect(() => {
    const carregarPosts = async () => {
      try {
        const data = await getNoticias(0); // Assuming you want the first page of news
        const noticias = data.content || data;
        const arrayNoticias = Array.isArray(noticias) ? noticias : [];
        const adminPosts = arrayNoticias.map((n: any) => ({
          id: n.id,
          titulo: n.titulo,
          subtitulo: n.subtitulo,
          categoria: n.categoria || "NOTÍCIA",
          imagem: n.imagemUrl || n.imagem,
          data: n.dataCriacao ? new Date(n.dataCriacao).toLocaleDateString() : 'Recente',
          leitura: n.tempoLeitura || '3 min',
          conteudo: n.descricao || '',
          citacao: n.citacao || ''
        }));
        setPosts(adminPosts);
      } catch (error) {
        console.error("Erro ao carregar notícias", error);
      }
    };
    carregarPosts();
  }, []);

  const categorias = ["Todos", "Tecnologia", "Sustentabilidade", "Inovação", "Manejo", "Produtor", "Mercado", "Notícia"];

  let postsFiltrados = filtroAtivo === "Todos"
    ? [...posts]
    : posts.filter(p => p.categoria.toLowerCase() === filtroAtivo.toLowerCase());

  // Ordenação
  postsFiltrados.sort((a, b) => {
    if (ordem === "recentes") return b.id - a.id;
    return a.id - b.id;
  });

  // Paginação
  const POSTS_POR_PAGINA = 6;
  const totalPaginas = Math.ceil(postsFiltrados.length / POSTS_POR_PAGINA) || 1;
  const postsPaginados = postsFiltrados.slice((paginaAtual - 1) * POSTS_POR_PAGINA, paginaAtual * POSTS_POR_PAGINA);

  return (
    <div className="blog-container w-full bg-[#F5F2ED] font-sans">

      {/* NAVBAR ALTERADA PARA ABSOLUTE PARA NÃO ACOMPANHAR A ROLAGEM */}
      <nav className="absolute top-0 left-0 w-full bg-white/95 backdrop-blur-md z-[100] border-b border-gray-100 py-3 md:py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/assets/logo-blog.png" alt="Logo Rede Nordeste" className="h-8 md:h-12 object-contain" />
          </div>
          <div className="flex gap-6 md:gap-8 items-center">
            <button className="text-[#f9943b] font-black uppercase text-[10px] md:text-xs tracking-widest border-b-2 border-[#f9943b]">Blog</button>
            {!mostrarPainel ? (
              <button onClick={() => navigate("/")} className="text-[#394158] font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-[#f9943b] transition-colors">Início</button>
            ) : (
              <button onClick={irParaPainel} className="text-[#394158] font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-[#f9943b] transition-colors cursor-pointer">Meu Painel</button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="video-hero relative w-full h-[30vh] md:h-[50vh] overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/assets/video-blog.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-4">
          <h1 className="text-white text-2xl md:text-6xl font-black italic mb-2 md:mb-4">NOTÍCIAS REDE NORDESTE</h1>
          <p className="text-white/80 text-[10px] md:text-lg mb-4 md:mb-8 uppercase tracking-widest">Conectando o produtor ao mercado nacional</p>
          <button
            onClick={() => document.getElementById("cards-section")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white text-[#394158] px-6 py-2 md:px-10 md:py-4 rounded-full font-black uppercase text-[10px] md:text-xs shadow-xl hover:scale-105 transition-transform"
          >
            Ver Notícias
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">

        {/* CONTROLES (FILTROS E ORDENAÇÃO) */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 pb-8">

          {/* FILTROS */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 w-full lg:w-auto justify-center lg:justify-start">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setFiltroAtivo(cat)}
                className={`px-3 py-1.5 md:px-5 md:py-2 rounded-md font-black text-[7.5px] md:text-[9px] uppercase tracking-widest border transition-all duration-300 ${filtroAtivo === cat ? "bg-[#55833d] text-white border-[#55833d] shadow-md" : "bg-white text-[#394158] border-gray-200 shadow-sm hover:bg-[#f9943b] hover:text-white hover:border-[#f9943b] hover:-translate-y-1"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ORDENAÇÃO */}
          <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-2 md:gap-3">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Ordenar:</span>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as "recentes" | "antigas")}
              className="bg-white border border-gray-100 shadow-sm text-[#394158] text-[7px] md:text-[9px] font-black uppercase tracking-widest px-3 py-1.5 md:px-5 md:py-2 rounded-md outline-none hover:border-[#f9943b] focus:border-[#f9943b] transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23f9943b\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em', paddingRight: '2rem' }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
            </select>
          </div>
        </div>

        {/* GRID DE NOTÍCIAS (3 COLUNAS) */}
        <div id="cards-section" className="grid grid-cols-3 gap-3 md:gap-8">
          {postsPaginados.map((post) => (
            <article
              key={post.id}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="bg-white rounded-xl md:rounded-[1rem] overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col"
            >
              <div className="aspect-video md:aspect-[4/3] overflow-hidden">
                <img src={post.imagem} alt={post.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-3 md:p-8 flex flex-col flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 md:mb-4 gap-2 md:gap-0">
                  <span className="bg-[#55833d]/10 text-[#55833d] px-2 py-0.5 md:px-3 md:py-1 rounded-md text-[6px] md:text-[9px] font-black uppercase">{post.categoria}</span>
                  <span className="text-[#f9943b] text-[8px] md:text-[10px] font-black uppercase tracking-widest">{post.data}</span>
                </div>

                <h3 className="text-[#394158] font-black text-[8px] md:text-xl mb-1 md:mb-3 uppercase italic leading-tight line-clamp-3 md:line-clamp-2">{post.titulo}</h3>
                <p className="hidden md:block text-gray-400 text-xs leading-relaxed mb-6 line-clamp-3">{post.subtitulo}</p>

                {/* RODAPÉ DO CARD COM LER E OUVIR */}
                <div className="mt-auto pt-2 md:pt-6 border-t border-gray-50 flex justify-between items-center text-gray-400">
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* Ícone Livro + LER */}
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} className="w-3 h-3 md:w-4 md:h-4 text-[#55833d]" />
                      <span className="text-[7px] md:text-[10px] font-black uppercase">Ler</span>
                    </div>
                    {/* Ícone Orelha + OUVIR */}
                    <div className="flex items-center gap-1">
                      <Ear size={14} className="w-3 h-3 md:w-4 md:h-4 text-[#55833d]" />
                      <span className="text-[7px] md:text-[10px] font-black uppercase">Ouvir</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#f9943b] w-3 h-3 md:w-5 md:h-5" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* PAGINAÇÃO COM TRATOR INTEGRADO */}
        {totalPaginas > 1 ? (
          <div className="py-16 md:py-24 max-w-2xl mx-auto relative px-4">
            <div className="relative w-full">
              {/* LINHA DE FUNDO (vai do centro da primeira bolinha ao centro da última) */}
              <div className="absolute top-1/2 left-[16px] right-[16px] h-0.5 bg-gray-200 -translate-y-1/2 rounded-full"></div>

              {/* LINHA DE PROGRESSO VERDE */}
              <div
                className="absolute top-1/2 left-[16px] h-0.5 bg-[#55833d] -translate-y-1/2 rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: `calc((100% - 32px) * ${((paginaAtual - 1) / (totalPaginas - 1))})` }}
              ></div>

              {/* TRATOR */}
              <div
                className="absolute top-1/2 -mt-2 z-10 transition-all duration-1000 ease-in-out flex flex-col items-center"
                style={{
                  left: `calc(16px + (100% - 32px) * ${((paginaAtual - 1) / (totalPaginas - 1))})`,
                  transform: `translate(-50%, -100%)`
                }}
              >
                <Tractor size={28} className="text-[#55833d] drop-shadow-sm" />
                <span className="absolute -top-6 text-[7px] font-black uppercase text-[#f9943b] tracking-widest whitespace-nowrap bg-[#F5F2ED] px-2 py-0.5 rounded-full shadow-sm border border-[#f9943b]/20 hidden md:block">
                  Página {paginaAtual}
                </span>
              </div>

              {/* BOLINHAS DA PAGINAÇÃO */}
              <div className="relative z-20 flex justify-between items-center w-full">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      setPaginaAtual(num);
                      document.getElementById("cards-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-6 h-6 flex justify-center items-center rounded-full text-[10px] font-black transition-all bg-[#F5F2ED] ${paginaAtual === num
                      ? 'text-[#f9943b] border border-[#f9943b] shadow-md shadow-[#f9943b]/20 bg-white'
                      : 'text-gray-400 hover:text-[#f9943b] border border-transparent hover:border-gray-200 hover:bg-white'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 overflow-hidden relative">
            <div className="h-px bg-gray-100 w-full absolute top-1/2"></div>
            <div className="relative flex items-center gap-4 animate-tractor whitespace-nowrap bg-[#F5F2ED] pr-10 w-fit">
              <Tractor size={32} className="text-[#55833d]" />
              <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">Levando o melhor do campo até você...</span>
            </div>
          </div>
        )}

        {/* SEÇÃO APRENDIZADO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-[#55833d] p-6 md:p-10 rounded-[1rem] md:rounded-[1rem] text-white shadow-xl">
            <div className="flex items-center gap-4 mb-6"><Leaf size={32} /><h4 className="font-black uppercase italic text-xl md:text-2xl leading-none">Semeando Sustentabilidade</h4></div>
            <div className="space-y-6 text-white/90">
              <div className="flex gap-4"><Droplets className="shrink-0 opacity-70" /><p className="text-xs md:text-sm"><strong>Reuso de Água:</strong> Utilize a água da lavagem de vegetais para regar suas plantas.</p></div>
              <div className="flex gap-4"><Package className="shrink-0 opacity-70" /><p className="text-xs md:text-sm"><strong>Embalagem Consciente:</strong> Troque o plástico por papel reciclado ou palha.</p></div>
            </div>
          </div>
          <div className="bg-[#f9943b] p-6 md:p-10 rounded-[1rem] md:rounded-[1rem] text-white shadow-xl">
            <div className="flex items-center gap-4 mb-6"><Lightbulb size={32} /><h4 className="font-black uppercase italic text-xl md:text-2xl leading-none">Papo de Empreendedora</h4></div>
            <div className="space-y-6 text-white/90">
              <div className="flex gap-4"><BookOpen className="shrink-0 opacity-70" /><p className="text-xs md:text-sm"><strong>Dica de Ouro:</strong> Fotos atraentes vendem mais! Use a luz natural da manhã.</p></div>
              <div className="flex gap-4"><Store className="shrink-0 opacity-70" /><p className="text-xs md:text-sm"><strong>Na Feirinha:</strong> Conte a história por trás do seu produto. Pessoas compram experiências.</p></div>
            </div>
          </div>
        </section>

        <footer className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest border-t border-gray-200">
          © 2026 Rede Nordeste — Blog Oficial do Produtor
        </footer>
      </main>
    </div>
  );
}