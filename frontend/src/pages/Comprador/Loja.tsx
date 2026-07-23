import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Store, MapPin, Star, ShoppingCart, Info, MessageCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getLojaPorId, getProdutosPorLoja } from '../../services/api';

export default function Loja() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loja, setLoja] = useState<any>({
    nomeLoja: 'Fazenda Alvorada',
    descricao: 'Bem-vindo à nossa lojinha! Aqui você encontra os melhores produtos.',
    cidade: 'Aracaju',
    estado: 'SE',
    logoUrl: ''
  });
  
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const carregarLoja = async () => {
      try {
        const dadosLoja = await getLojaPorId(id);
        if (dadosLoja) setLoja(dadosLoja);
      } catch (error) {
        console.error("Erro ao carregar loja", error);
      }
    };

    const carregarProdutos = async () => {
      try {
        const dadosProdutos = await getProdutosPorLoja(Number(id));
        setProdutos(dadosProdutos.content || dadosProdutos);
      } catch (error) {
        console.error("Erro ao carregar produtos", error);
      }
    };

    carregarLoja();
    carregarProdutos();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased pb-10">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 space-y-8 md:space-y-12 page-enter">
        <PageHeader
          titulo={loja.nomeLoja}
          subtitulo="Loja Parceira"
          voltarPara="back"
        />
        
        {/* BANNER DA LOJA */}
        <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left relative overflow-hidden">
           {/* Fundo Decorativo */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#55833d]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

           {loja.logoUrl ? (
             <img src={loja.logoUrl} className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover shadow-xl border-4 border-white z-10" alt="Logo da Loja" />
           ) : (
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-[#F5F2ED] flex items-center justify-center text-[#55833d] shadow-xl border-4 border-white z-10">
                <Store size={48} />
             </div>
           )}

           <div className="z-10 flex-1 flex flex-col justify-center">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                 <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-[#394158]">{loja.nomeLoja}</h2>
                 <div className="bg-[#f9943b]/10 text-[#f9943b] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest self-center md:self-auto flex items-center gap-1">
                    <Star size={12} fill="currentColor"/> 4.9
                 </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                 <MapPin size={12} /> {loja.cidade}, {loja.estado}
              </div>
              
              {loja.descricao && (
                <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl border border-[#55833d]/10 max-w-2xl">
                   <p className="text-sm font-medium leading-relaxed opacity-80 italic">"{loja.descricao}"</p>
                </div>
              )}

              {id && (
                <button
                  onClick={() => navigate('/chat', { state: { lojaId: Number(id) } })}
                  className="mt-4 self-center md:self-start inline-flex items-center gap-2 bg-[#55833d] text-white px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#394158] transition-colors active:scale-95"
                >
                  <MessageCircle size={14} /> Conversar com esta loja
                </button>
              )}
           </div>
        </section>

        {/* PRODUTOS DA LOJA */}
        <section>
           <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-[#394158] mb-6 flex items-center gap-2">
             <Store size={20} className="text-[#55833d]" /> Produtos desta Loja
           </h3>

           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {produtos.length > 0 ? produtos.map(p => (
                 <Link to={`/produto/${p.id}`} key={p.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-transparent hover:border-[#f9943b]/30 hover:shadow-lg transition-all group flex flex-col h-full">
                    <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-100">
                       <img src={p.img || p.imagemUrl} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#55833d] tracking-widest mb-1 line-clamp-1">{p.categoria || p.nomeCategoria}</span>
                    <h4 className="font-bold text-[#394158] text-xs md:text-sm leading-snug mb-2 line-clamp-2 flex-1 group-hover:text-[#f9943b] transition-colors">{p.nome}</h4>
                    
                    <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-50">
                       <div className="flex items-end gap-1">
                          <span className="text-sm md:text-lg font-black text-[#f9943b]">R$ {Number(p.preco || p.precoAtual).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-gray-400 mb-0.5">/{p.un || p.unidadeMedida}</span>
                       </div>
                       <button className="w-full bg-[#394158] text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-[#55833d] transition-colors flex items-center justify-center gap-1">
                         <ShoppingCart size={12}/> Ver Detalhes
                       </button>
                    </div>
                 </Link>
              )) : (
                 <div className="col-span-full bg-white p-10 rounded-[2rem] border border-dashed border-gray-200 text-center flex flex-col items-center gap-4 opacity-50">
                    <Info size={32} className="text-gray-400" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum produto cadastrado nesta loja ainda.</p>
                 </div>
              )}
           </div>
        </section>

      </main>

      <footer className="w-full text-center p-20 bg-gray-50 border-t border-gray-100 mt-10">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#394158]/60">© 2026 Rede Nordeste - Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
