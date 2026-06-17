import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Store, Info, Minus, Plus, CheckCircle2, Star, ChevronRight, MessageCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getProdutoPorId, adicionarAoCarrinho, getLojaPorId } from '../../services/api';

export default function ProdutoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produto, setProduto] = useState<any>(null);
  const [loja, setLoja] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [feedbackCompra, setFeedbackCompra] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [podeAvaliar, setPodeAvaliar] = useState(false);
  const [userRole, setUserRole] = useState('comprador');
  const [novaEstrelas, setNovaEstrelas] = useState(5);
  const [novoComentario, setNovoComentario] = useState('');
  const [respostaTemp, setRespostaTemp] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    getProdutoPorId(Number(id))
      .then(async (data) => {
        setProduto(data);
        if (data.lojaId) {
          const l = await getLojaPorId(data.lojaId);
          setLoja(l);
        }
      })
      .catch(() => setErro('Produto não encontrado.'))
      .finally(() => setCarregando(false));

    // Carregar avaliações
    const avs = JSON.parse(localStorage.getItem('avaliacoes_globais') || '[]');
    setAvaliacoes(avs.filter((a: any) => String(a.produtoId) === String(id)));

    // Verificar se pode avaliar
    const pedidosGlobais = JSON.parse(localStorage.getItem('pedidos_globais') || '[]');
    const temPedidoFinalizado = pedidosGlobais.some((p: any) => 
      p.status === 'Entregue' && p.produtos.some((prod: any) => String(prod.id) === String(id))
    );
    setPodeAvaliar(temPedidoFinalizado);
    setUserRole(localStorage.getItem('user_role') || 'comprador');

  }, [id]);

  const handleAvaliar = () => {
    if (!novoComentario) return;
    const novaAv = {
      id: Date.now().toString(),
      produtoId: id,
      estrelas: novaEstrelas,
      comentario: novoComentario,
      data: new Date().toLocaleDateString('pt-BR'),
      cliente: 'Usuário',
      respostaVendedor: ''
    };
    const avs = JSON.parse(localStorage.getItem('avaliacoes_globais') || '[]');
    const todas = [novaAv, ...avs];
    localStorage.setItem('avaliacoes_globais', JSON.stringify(todas));
    setAvaliacoes([novaAv, ...avaliacoes]);
    setNovoComentario('');
    setNovaEstrelas(5);
  };

  const handleResponder = (avId: string) => {
    const texto = respostaTemp[avId];
    if (!texto) return;
    
    const avs = JSON.parse(localStorage.getItem('avaliacoes_globais') || '[]');
    const novas = avs.map((a: any) => {
      if (a.id === avId) return { ...a, respostaVendedor: texto };
      return a;
    });
    localStorage.setItem('avaliacoes_globais', JSON.stringify(novas));
    
    setAvaliacoes(novas.filter((a: any) => String(a.produtoId) === String(id)));
    setRespostaTemp(prev => ({ ...prev, [avId]: '' }));
  };

  const handleAdicionarAoCarrinho = async () => {
    if (!produto) return;
    try {
      await adicionarAoCarrinho(produto.id, quantidade);
      setFeedbackCompra(true);
      setTimeout(() => setFeedbackCompra(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest opacity-30 text-sm">
      Carregando...
    </div>
  );

  if (erro || !produto) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-black uppercase tracking-widest opacity-40">
      <p>{erro || 'Produto não encontrado'}</p>
      <button onClick={() => navigate('/home2')} className="mt-4 text-xs underline">Voltar para Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased pb-10">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 page-enter">
        <PageHeader
          titulo="Detalhes do Produto"
          subtitulo={produto?.nome}
          voltarPara="back"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        <section className="relative">
          <div className="sticky top-32">
            <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img src={produto.imagemUrl || 'https://via.placeholder.com/800'}
                alt={produto.nome} className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-6 left-6 bg-[#55833d] text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">
              {produto.nomeCategoria}
            </div>
          </div>
        </section>

        <section className="flex flex-col space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#55833d]">
              <MapPin size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{produto.nomeLoja}</span>
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tight leading-none mb-4">{produto.nome}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#f9943b]">R$ {Number(produto.precoAtual).toFixed(2)}</span>
              <span className="text-sm font-bold opacity-40 uppercase">/ por {produto.unidadeMedida}</span>
            </div>
          </div>

          {produto.descricao && (
            <div className="bg-white/50 p-6 rounded-[2rem] border border-white">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 opacity-40">
                <Info size={14} /> Descrição
              </h3>
              <p className="text-sm leading-relaxed font-medium">{produto.descricao}</p>
            </div>
          )}

          {/* Estoque */}
          <div className="bg-white/50 p-4 rounded-2xl border border-white text-sm font-bold">
            <span className={produto.estoqueAtual > 0 ? 'text-[#55833d]' : 'text-red-400'}>
              {produto.estoqueAtual > 0 ? `${produto.estoqueAtual} em estoque` : 'Sem estoque'}
            </span>
          </div>

          {/* Loja */}
          {loja && (
            <div onClick={() => navigate(`/loja/${loja.id}`)} className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-gray-50 cursor-pointer hover:border-[#f9943b]/30 hover:shadow-md transition-all active:scale-95 group">
              <div className="flex items-center gap-4">
                <img src={loja.logoUrl || 'https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-50 group-hover:border-[#f9943b] transition-colors" alt="Loja" />
                <div>
                  <span className="text-[9px] font-black uppercase text-[#55833d]">Vendedor Parceiro</span>
                  <h4 className="font-bold text-[#394158] group-hover:text-[#f9943b] transition-colors">{loja.nomeLoja || loja.nome}</h4>
                  <div className="flex items-center gap-1 text-[9px] font-bold opacity-40">
                    <Store size={10} /> {loja.cidade}, {loja.estado}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-[#f9943b] transition-colors" />
            </div>
          )}

          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
                <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-50 rounded-xl">
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-black text-lg">{quantidade}</span>
                <button onClick={() => setQuantidade(q => Math.min(produto.estoqueAtual, q + 1))} className="p-2 hover:bg-gray-50 rounded-xl">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <button onClick={handleAdicionarAoCarrinho} disabled={feedbackCompra || produto.estoqueAtual === 0}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                produto.estoqueAtual === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : feedbackCompra ? 'bg-[#55833d] text-white scale-[0.98]'
                : 'bg-[#394158] text-white hover:bg-[#f9943b]'
              }`}>
              {produto.estoqueAtual === 0 ? 'Sem estoque'
                : feedbackCompra ? <><CheckCircle2 size={18} /> Adicionado!</>
                : <><ShoppingCart size={18} /> Adicionar ao Carrinho</>}
            </button>

            {produto.lojaId && (
              <button
                onClick={() => navigate('/chat', { state: { lojaId: produto.lojaId } })}
                className="w-full py-4 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 bg-white border-2 border-[#55833d] text-[#55833d] hover:bg-[#55833d] hover:text-white"
              >
                <MessageCircle size={16} /> Falar com a loja
              </button>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 pt-16 border-t border-gray-200/50 mt-10">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Avaliações dos Clientes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                {avaliacoes.length > 0 ? avaliacoes.map(av => (
                   <div key={av.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <span className="font-bold text-sm">{av.cliente}</span>
                            <div className="flex text-[#f9943b] mt-1">
                               {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < av.estrelas ? 'currentColor' : 'none'} />)}
                            </div>
                         </div>
                         <span className="text-[10px] opacity-40 font-bold">{av.data}</span>
                      </div>
                      <p className="text-sm opacity-80">{av.comentario}</p>
                      
                      {av.respostaVendedor && (
                         <div className="mt-2 bg-[#55833d]/10 p-4 rounded-[1rem] border-l-4 border-[#55833d]">
                            <span className="text-[10px] font-black uppercase text-[#55833d] block mb-1">Resposta do Vendedor</span>
                            <p className="text-xs opacity-80">{av.respostaVendedor}</p>
                         </div>
                      )}

                      {!av.respostaVendedor && userRole === 'vendedor' && (
                         <div className="mt-2 pt-3 border-t border-gray-100 flex gap-2">
                            <input type="text" value={respostaTemp[av.id] || ''} onChange={(e) => setRespostaTemp({...respostaTemp, [av.id]: e.target.value})} placeholder="Responder comentário..." className="flex-1 bg-gray-50 rounded-xl px-3 text-xs outline-none" />
                            <button onClick={() => handleResponder(av.id)} className="bg-[#f9943b] text-white text-[10px] font-black uppercase px-4 rounded-xl hover:bg-[#55833d] transition-all">Enviar</button>
                         </div>
                      )}
                   </div>
                )) : (
                   <p className="text-sm opacity-50 italic">Nenhuma avaliação para este produto ainda.</p>
                )}
             </div>

             <div>
                {podeAvaliar ? (
                   <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 sticky top-32">
                      <h4 className="text-sm font-black uppercase tracking-widest mb-6">Deixe sua avaliação</h4>
                      <div className="flex gap-2 mb-6">
                         {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} onClick={() => setNovaEstrelas(num)} className="transition-all hover:scale-110">
                               <Star size={24} fill={num <= novaEstrelas ? '#f9943b' : 'none'} className={num <= novaEstrelas ? 'text-[#f9943b]' : 'text-gray-300'} />
                            </button>
                         ))}
                      </div>
                      <textarea value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} placeholder="O que achou deste produto?" className="w-full bg-[#F5F2ED] rounded-2xl p-4 text-sm outline-none resize-none min-h-[120px] mb-4"></textarea>
                      <button onClick={handleAvaliar} disabled={!novoComentario} className="w-full bg-[#394158] hover:bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50">Publicar Avaliação</button>
                   </div>
                ) : (
                   <div className="bg-gray-100/50 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center border border-dashed border-gray-300 h-full min-h-[250px]">
                      <Info size={32} className="text-gray-400 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Você precisa receber este produto para poder avaliá-lo.</p>
                   </div>
                )}
             </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}