import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Volume2, VolumeX } from 'lucide-react';
import { getNoticiaPorId } from "../../services/api";

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);

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

  // --- FUNÇÃO PARA CONTROLAR A VOZ (AGORA LÊ TUDO E SÓ NO CLIQUE) ---
  const toggleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isReading) {
        window.speechSynthesis.cancel();
        setIsReading(false);
      } else {
        const textoParaLer = `${post.titulo}. ${post.subtitulo}. ${post.conteudo}`;
        const utterance = new SpeechSynthesisUtterance(textoParaLer);
        utterance.lang = 'pt-BR';
        utterance.onend = () => setIsReading(false);
        window.speechSynthesis.speak(utterance);
        setIsReading(true);
      }
    }
  };

  useEffect(() => {
    const carregarPost = async () => {
      const postId = Number(id);
      
      try {
        const adminPost = await getNoticiaPorId(postId);
        if (adminPost) {
          const postEncontrado = {
            id: adminPost.id,
            titulo: adminPost.titulo,
            subtitulo: adminPost.subtitulo,
            categoria: adminPost.categoria || "NOTÍCIA",
            imagem: adminPost.imagemUrl || adminPost.imagem,
            data: adminPost.dataCriacao ? new Date(adminPost.dataCriacao).toLocaleDateString() : 'Recente',
            leitura: adminPost.tempoLeitura || '3 min',
            conteudo: adminPost.descricao || '',
            citacao: adminPost.citacao || ''
          };
          setPost(postEncontrado);
        }
      } catch (error) {
        console.error("Erro ao carregar noticia por ID", error);
      }
    };
    
    carregarPost();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [id]);

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center font-black uppercase italic text-[#394158]">Post não encontrado!</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans text-[#394158]">
      
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 py-3 md:py-4 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/assets/logo-home.png" alt="Logo" className="h-8 md:h-12 w-auto object-contain" />
          </div>
          
          <div className="flex gap-6 md:gap-8 items-center">
            <button onClick={() => navigate('/blog')} className="text-[#f9943b] font-black uppercase text-[10px] md:text-xs tracking-widest border-b-2 border-[#f9943b]">Blog</button>
            {!mostrarPainel ? (
              <button onClick={() => navigate("/")} className="text-[#394158] font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-[#f9943b] transition-colors">Início</button>
            ) : (
              <button onClick={irParaPainel} className="text-[#394158] font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-[#f9943b] transition-colors cursor-pointer">Meu Painel</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        
        <div className="flex justify-between items-center mb-6 md:mb-10 gap-2">
          <button 
            className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-3 bg-white border border-gray-100 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:-translate-x-1 transition-all cursor-pointer"
            onClick={() => navigate("/blog")}
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Voltar para o Blog</span><span className="sm:hidden">Voltar</span>
          </button>

          {/* BOTÃO PARA INICIAR/PARAR O ÁUDIO */}
          <button 
            onClick={toggleSpeech}
            className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-6 md:py-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isReading ? 'bg-[#f9943b] text-white' : 'bg-white text-[#f9943b] border border-[#f9943b]'}`}
          >
            {isReading ? <><VolumeX className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Parar Áudio</span><span className="sm:hidden">Parar</span></> : <><Volume2 className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Ouvir Notícia</span><span className="sm:hidden">Ouvir</span></>}
          </button>
        </div>

        <header className="mb-6 md:mb-10">
          <span className="inline-block bg-[#55833d] text-white text-[7px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-md uppercase tracking-widest mb-2 md:mb-4">
            {post.categoria}
          </span>
          <h1 className="text-[1.25rem] md:text-5xl font-black text-[#394158] uppercase italic leading-tight tracking-tighter mb-3 md:mb-6">
            {post.titulo}
          </h1>
          
          <div className="flex flex-wrap gap-4 md:gap-6 text-[7px] md:text-[10px] font-black uppercase tracking-widest text-[#394158]/50">
            <span className="flex items-center gap-1 md:gap-2">
              <Calendar className="text-[#f9943b] w-3 h-3 md:w-4 md:h-4" /> {post.data}
            </span>
            <span className="flex items-center gap-1 md:gap-2">
              <Clock className="text-[#55833d] w-3 h-3 md:w-4 md:h-4" /> {post.leitura} de leitura
            </span>
          </div>
        </header>

        <div className="w-full aspect-video rounded-xl md:rounded-[2.5rem] overflow-hidden shadow-lg md:shadow-2xl mb-6 md:mb-12 border-2 md:border-4 border-white">
          <img src={post.imagem} alt={post.titulo} className="w-full h-full object-cover" />
        </div>

        <article className="space-y-4 md:space-y-8">
          <h2 className="text-sm md:text-2xl font-black text-[#55833d] uppercase italic leading-snug md:leading-tight">
            {post.subtitulo}
          </h2>
          
          <div className="text-[13px] md:text-lg font-medium leading-relaxed text-[#394158]/80 space-y-3 md:space-y-6">
            {post.conteudo.split('\n').map((line: string, index: number) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          
          <div className="bg-[#f9943b]/10 border-l-2 md:border-l-4 border-[#f9943b] p-4 md:p-8 italic text-[13px] md:text-xl font-medium rounded-r-lg md:rounded-r-2xl">
            "{post.citacao || "A tecnologia não substitui o produtor, mas potencializa seu conhecimento e sua produção."}"
          </div>
        </article>

        <footer className="mt-20 pt-10 border-t border-gray-100 text-center">
             <button 
                onClick={() => navigate('/blog')}
                className="text-[#55833d] font-black uppercase text-xs border-b-2 border-[#55833d] pb-1 hover:text-[#f9943b] hover:border-[#f9943b] transition-all cursor-pointer"
             >
                Explorar mais notícias
             </button>
        </footer>
      </main>
    </div>
  );
}