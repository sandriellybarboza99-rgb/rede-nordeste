import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2, Minus, Plus, Truck, Store, ChevronRight,
  ShoppingBag, CreditCard, Barcode, Landmark, MapPin, PlusCircle, CheckCircle, Copy, Square, CheckSquare, X
} from 'lucide-react';
import {
  getCarrinho, adicionarAoCarrinho, removerDoCarrinho, checkout, simularFrete,
  getMeusEnderecos, criarEndereco,
  getMeusCartoes, criarCartao,
} from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';

interface Endereco {
  id: number;
  destinatario: string;
  telefone?: string;
  cep: string;
  estadoCidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
  latitudeDestino?: number;
  longitudeDestino?: number;
  principal: boolean;
}

interface Cartao {
  id: number;
  titular: string;
  finalCartao: string;
  bandeira: string;
  validade: string;
}

export default function CarrinhoVendedor() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState(1);
  const [carrinho, setCarrinho] = useState<any>({ itens: [], totalItens: 0, valorTotal: 0 });
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [itensSelecionados, setItensSelecionados] = useState<number[]>([]);
  const [metodoEntrega, setMetodoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [valorFrete, setValorFrete] = useState(0);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number>(0);
  const [mudarEndereco, setMudarEndereco] = useState(false);
  const [exibirFormNovoEndereco, setExibirFormNovoEndereco] = useState(false);
  const [meusEnderecos, setMeusEnderecos] = useState<Endereco[]>([]);
  const [novoEndereco, setNovoEndereco] = useState({
    destinatario: '', telefone: '', cep: '', estadoCidade: '',
    bairro: '', rua: '', numero: '', complemento: '',
  });

  const [metodoPagamento, setMetodoPagamento] = useState<'CARTAO' | 'PIX' | 'BOLETO'>('CARTAO');
  const [cartaoSelecionado, setCartaoSelecionado] = useState<number>(0);
  const [exibirFormNovoCartao, setExibirFormNovoCartao] = useState(false);
  const [meusCartoes, setMeusCartoes] = useState<Cartao[]>([]);
  const [novoCartao, setNovoCartao] = useState({ numero: '', titular: '', validade: '', cvv: '' });

  // Estado para armazenar os dados do pedido retornado pelo backend (inclusive o PIX)
  const [pedidoRealizado, setPedidoRealizado] = useState<any>(null);
  const [exibirModalPix, setExibirModalPix] = useState(false);

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        const [cart, ends, cards] = await Promise.all([
          getCarrinho(),
          getMeusEnderecos().catch(() => []),
          getMeusCartoes().catch(() => []),
        ]);
        setCarrinho(cart);
        setItensSelecionados(cart.itens.map((i: any) => i.produtoId));
        setMeusEnderecos(ends);
        setMeusCartoes(cards);
      } catch {
        setCarrinho({ itens: [], totalItens: 0, valorTotal: 0 });
      } finally {
        setCarregando(false);
      }
    };
    carregarTudo();
  }, []);

  useEffect(() => {
    if (metodoEntrega !== 'entrega') { setValorFrete(0); return; }
    const end = meusEnderecos[enderecoSelecionado];
    if (!end?.latitudeDestino || carrinho.itens.length === 0) return;

    const itemSel = carrinho.itens.find((i: any) => itensSelecionados.includes(i.produtoId));
    if (!itemSel) return;

    simularFrete(
      itemSel.lojaId,
      end.latitudeDestino ?? 0,
      end.longitudeDestino ?? 0
    )
      .then((data: any) => setValorFrete(Number(data.valorFrete)))
      .catch(() => setValorFrete(0));
  }, [metodoEntrega, enderecoSelecionado, carrinho.itens, itensSelecionados, meusEnderecos]);

  const atualizarQtd = async (produtoId: number, novaQtd: number) => {
    if (novaQtd < 1) return;
    try {
      const atualizado = await adicionarAoCarrinho(produtoId, novaQtd);
      setCarrinho(atualizado);
      if (!itensSelecionados.includes(produtoId)) {
        setItensSelecionados([...itensSelecionados, produtoId]);
      }
    } catch (err: any) { toastError(err.message); }
  };

  const remover = async (produtoId: number) => {
    try {
      const atualizado = await removerDoCarrinho(produtoId);
      setCarrinho(atualizado);
      setItensSelecionados(prev => prev.filter(id => id !== produtoId));
    } catch (err: any) { toastError(err.message); }
  };

  const toggleSelecao = (produtoId: number) => {
    setItensSelecionados(prev =>
      prev.includes(produtoId) ? prev.filter(id => id !== produtoId) : [...prev, produtoId]
    );
  };

  const salvarNovoEndereco = async () => {
    if (!novoEndereco.destinatario || !novoEndereco.cep || !novoEndereco.rua || !novoEndereco.numero) {
      toastError('Preencha os campos obrigatórios.');
      return;
    }
    try {
      const criado = await criarEndereco({
        ...novoEndereco,
        latitudeDestino: -10.9850,
        longitudeDestino: -37.0490,
        principal: meusEnderecos.length === 0,
      });
      const novos = [...meusEnderecos, criado];
      setMeusEnderecos(novos);
      setEnderecoSelecionado(novos.length - 1);
      setExibirFormNovoEndereco(false);
      setMudarEndereco(false);
      setNovoEndereco({ destinatario: '', telefone: '', cep: '', estadoCidade: '', bairro: '', rua: '', numero: '', complemento: '' });
      success('Endereço salvo!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar endereço.');
    }
  };

  const salvarNovoCartao = async () => {
    if (!novoCartao.numero || !novoCartao.titular || !novoCartao.validade || !novoCartao.cvv) {
      toastError('Preencha todos os campos do cartão.');
      return;
    }
    try {
      const criado = await criarCartao({
        titular: novoCartao.titular,
        numero: novoCartao.numero.replace(/\D/g, ''),
        validade: novoCartao.validade,
        cvv: novoCartao.cvv,
      });
      const novos = [...meusCartoes, criado];
      setMeusCartoes(novos);
      setCartaoSelecionado(novos.length - 1);
      setExibirFormNovoCartao(false);
      setNovoCartao({ numero: '', titular: '', validade: '', cvv: '' });
      success('Cartão adicionado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao adicionar cartão.');
    }
  };

  const handleFinalizarPedido = async () => {
    if (itensSelecionados.length === 0) { toastError('Selecione pelo menos um item para comprar!'); return; }
    setProcessando(true);
    try {
      const end = meusEnderecos[enderecoSelecionado];
      const res = await checkout({
        metodoPagamento,
        retiradaNaLoja: metodoEntrega === 'retirada',
        enderecoEntrega: metodoEntrega === 'entrega' && end
          ? `${end.rua}, ${end.numero} ${end.complemento ? `(${end.complemento})` : ''} - ${end.bairro}, ${end.estadoCidade}`
          : undefined,
        cidadeDestino: metodoEntrega === 'entrega' && end ? (end.estadoCidade?.split(' - ')[1] || '') : undefined,
        latitudeDestino: metodoEntrega === 'entrega' ? end?.latitudeDestino : undefined,
        longitudeDestino: metodoEntrega === 'entrega' ? end?.longitudeDestino : undefined,
      });

      setPedidoRealizado(res);
      setCarrinho({ itens: [], totalItens: 0, valorTotal: 0 });
      setItensSelecionados([]);

      if (metodoPagamento === 'PIX' && res?.pagamento?.pixPayload) {
        setExibirModalPix(true);
      } else {
        success('Pedido realizado com sucesso!');
        navigate('/perfilvendedor');
      }
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setProcessando(false);
    }
  };

  const copiarPix = () => {
    if (pedidoRealizado?.pagamento?.pixPayload) {
      navigator.clipboard.writeText(pedidoRealizado.pagamento.pixPayload);
      success('Código PIX copiado para a área de transferência!');
    }
  };

  const itensParaComprar = carrinho.itens.filter((i: any) => itensSelecionados.includes(i.produtoId));
  const subtotal = itensParaComprar.reduce((acc: number, item: any) => acc + Number(item.subtotal), 0);
  const total = metodoEntrega === 'entrega' ? subtotal + valorFrete : subtotal;

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase text-sm opacity-30">
      Carregando carrinho...
    </div>
  );

  const tituloEtapa =
    step === 1 ? `Minha Cesta (${carrinho.totalItens})` :
      step === 2 ? 'Opções de Entrega' :
        'Pagamento e Revisão';

  const handleVoltarEtapa = () => (step === 1 ? navigate(-1) : setStep(step - 1));

  return (
    <div className="min-h-screen bg-[#F5F2ED] font-sans text-[#394158] pb-20 md:pb-10 relative">
      <main className="max-w-2xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <PageHeader
          titulo={tituloEtapa}
          subtitulo={`Etapa ${step} de 3`}
          voltarPara={handleVoltarEtapa}
          labelVoltar={step === 1 ? 'Vitrine' : 'Voltar'}
        />

        <div className="bg-white md:rounded-3xl md:shadow-xl md:border md:border-gray-100 overflow-hidden page-enter">
          <div className="p-5 md:p-8 space-y-6 md:space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                {carrinho.itens.length > 0 ? carrinho.itens.map((item: any) => {
                  const isSelected = itensSelecionados.includes(item.produtoId);
                  return (
                    <div key={item.id} className={`flex gap-4 items-center p-3 rounded-2xl border-2 transition-all ${isSelected ? 'border-[#f9943b] bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                      <button onClick={() => toggleSelecao(item.produtoId)} className="text-[#f9943b] flex-shrink-0">
                        {isSelected ? <CheckSquare size={24} /> : <Square size={24} className="text-gray-300" />}
                      </button>
                      <img src={item.imagemUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm leading-tight">{item.nomeProduto}</h3>
                          <button onClick={() => remover(item.produtoId)} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 gap-3 bg-white">
                            <button onClick={() => atualizarQtd(item.produtoId, item.quantidade - 1)} className="hover:text-[#f9943b]"><Minus size={12} /></button>
                            <span className="text-xs font-black">{item.quantidade}</span>
                            <button onClick={() => atualizarQtd(item.produtoId, item.quantidade + 1)} className="hover:text-[#f9943b]"><Plus size={12} /></button>
                          </div>
                          <span className="font-black text-sm">R$ {Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-20 flex flex-col items-center gap-4">
                    <ShoppingBag size={48} className="opacity-10" />
                    <div className="opacity-30 font-black uppercase italic">Cesta Vazia</div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Como você quer receber?</h4>
                  <div className="flex gap-3">
                    <button onClick={() => setMetodoEntrega('entrega')}
                      className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${metodoEntrega === 'entrega' ? 'border-[#f9943b] bg-white shadow-md' : 'border-transparent bg-gray-50 opacity-50'}`}>
                      <Truck size={24} /><span className="text-xs font-black uppercase tracking-widest">Entrega</span>
                    </button>
                    <button onClick={() => setMetodoEntrega('retirada')}
                      className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${metodoEntrega === 'retirada' ? 'border-[#f9943b] bg-white shadow-md' : 'border-transparent bg-gray-50 opacity-50'}`}>
                      <Store size={24} /><span className="text-xs font-black uppercase tracking-widest">Retirada</span>
                    </button>
                  </div>
                </div>

                {metodoEntrega === 'entrega' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Endereço de Entrega</h4>
                      {!exibirFormNovoEndereco && meusEnderecos.length > 0 && (
                        <button onClick={() => setMudarEndereco(!mudarEndereco)} className="text-[10px] font-black uppercase text-[#f9943b] hover:underline">
                          {mudarEndereco ? 'Fechar' : 'Mudar Endereço'}
                        </button>
                      )}
                    </div>

                    {exibirFormNovoEndereco ? (
                      <div className="space-y-3 bg-gray-50 p-5 rounded-3xl border border-gray-100">
                        <h4 className="font-black text-sm uppercase italic mb-2">Novo Endereço</h4>
                        <input type="text" placeholder="Quem vai receber? (Destinatário)" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.destinatario} onChange={e => setNovoEndereco({ ...novoEndereco, destinatario: e.target.value })} />
                        <input type="text" placeholder="Telefone para contato" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.telefone} onChange={e => setNovoEndereco({ ...novoEndereco, telefone: e.target.value })} />
                        <div className="flex gap-2">
                          <input type="text" placeholder="CEP" className="w-1/2 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.cep} onChange={e => setNovoEndereco({ ...novoEndereco, cep: e.target.value })} />
                          <input type="text" placeholder="Cidade - UF" className="w-1/2 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.estadoCidade} onChange={e => setNovoEndereco({ ...novoEndereco, estadoCidade: e.target.value })} />
                        </div>
                        <input type="text" placeholder="Bairro" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.bairro} onChange={e => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })} />
                        <div className="flex gap-2">
                          <input type="text" placeholder="Rua / Avenida" className="w-2/3 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.rua} onChange={e => setNovoEndereco({ ...novoEndereco, rua: e.target.value })} />
                          <input type="text" placeholder="Número" className="w-1/3 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.numero} onChange={e => setNovoEndereco({ ...novoEndereco, numero: e.target.value })} />
                        </div>
                        <input type="text" placeholder="Complemento (Apt, Bloco, Casa)" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoEndereco.complemento} onChange={e => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })} />
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setExibirFormNovoEndereco(false)} className="flex-1 p-3 text-[10px] font-black uppercase text-gray-500 bg-gray-200 rounded-xl">Cancelar</button>
                          <button onClick={salvarNovoEndereco} className="flex-1 p-3 text-[10px] font-black uppercase text-white bg-[#f9943b] rounded-xl">Salvar e Usar</button>
                        </div>
                      </div>
                    ) : mudarEndereco ? (
                      <div className="space-y-3">
                        {meusEnderecos.map((end, idx) => (
                          <button key={end.id} onClick={() => { setEnderecoSelecionado(idx); setMudarEndereco(false); }}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-3 items-start ${enderecoSelecionado === idx ? 'border-[#f9943b] bg-white' : 'border-transparent bg-gray-50 opacity-60'}`}>
                            <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${enderecoSelecionado === idx ? 'border-[#f9943b]' : 'border-gray-300'}`}>
                              {enderecoSelecionado === idx && <div className="w-2 h-2 bg-[#f9943b] rounded-full" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-black">{end.destinatario} • {end.telefone}</p>
                              <p className="text-[10px] font-bold text-gray-500 mt-1">{end.rua}, {end.numero} {end.complemento && `(${end.complemento})`} - {end.bairro}</p>
                              <p className="text-[9px] font-bold text-gray-400">{end.cep} • {end.estadoCidade}</p>
                            </div>
                          </button>
                        ))}
                        <button onClick={() => setExibirFormNovoEndereco(true)}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-[#f9943b] hover:border-[#f9943b] transition-colors">
                          <PlusCircle size={16} /> Adicionar novo endereço
                        </button>
                      </div>
                    ) : meusEnderecos[enderecoSelecionado] ? (
                      <div className="p-5 bg-white rounded-3xl border-2 border-[#f9943b] flex gap-4 items-center">
                        <div className="p-3 bg-[#f9943b]/10 rounded-2xl text-[#f9943b]"><MapPin size={24} /></div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-[#f9943b] mb-1">Entregar para {meusEnderecos[enderecoSelecionado].destinatario}</p>
                          <p className="text-xs font-bold leading-tight">{meusEnderecos[enderecoSelecionado].rua}, {meusEnderecos[enderecoSelecionado].numero}</p>
                          <p className="text-[10px] opacity-60 font-bold mt-1">{meusEnderecos[enderecoSelecionado].bairro} - {meusEnderecos[enderecoSelecionado].estadoCidade}</p>
                        </div>
                        <CheckCircle size={20} className="text-[#f9943b]" />
                      </div>
                    ) : (
                      <button onClick={() => setExibirFormNovoEndereco(true)}
                        className="w-full flex items-center justify-center gap-2 p-6 border-2 border-dashed border-[#f9943b] rounded-2xl text-xs font-black uppercase text-[#f9943b] hover:bg-[#f9943b]/5 transition-colors">
                        <PlusCircle size={18} /> Cadastrar primeiro endereço
                      </button>
                    )}

                    {!mudarEndereco && !exibirFormNovoEndereco && meusEnderecos[enderecoSelecionado] && (
                      <div className="bg-[#f9943b]/5 p-4 rounded-2xl flex flex-col border border-[#f9943b]/20">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-[#f9943b]">Frete calculado para este CEP:</span>
                          <span className="font-black text-[#f9943b] text-sm">{valorFrete > 0 ? `R$ ${valorFrete.toFixed(2)}` : 'Calculando...'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Local de Retirada</h4>
                    <div className="p-5 bg-white rounded-3xl border-2 border-[#f9943b] flex gap-4 items-center">
                      <div className="p-3 bg-[#f9943b]/10 rounded-2xl text-[#f9943b]"><Store size={24} /></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-[#f9943b] mb-1">Retirar na Loja do Produtor</p>
                        <p className="text-xs font-bold leading-tight">Mercado Municipal de Aracaju, Box 42</p>
                        <p className="text-[10px] opacity-60 font-bold mt-1">Centro - Aracaju, SE</p>
                        <p className="text-[9px] font-black uppercase text-[#55833d] mt-2 mb-1">Frete Grátis</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Produtos Selecionados</h4>
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
                    {itensParaComprar.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm">
                        <img src={item.imagemUrl || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold leading-tight line-clamp-1">{item.nomeProduto}</p>
                          <p className="text-[9px] text-gray-400 font-bold">{item.quantidade} un.</p>
                        </div>
                        <span className="text-[11px] font-black text-[#f9943b] pr-2">R$ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Método de Pagamento</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CARTAO', 'PIX', 'BOLETO'] as const).map(m => (
                      <button key={m} onClick={() => setMetodoPagamento(m)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${metodoPagamento === m ? 'border-[#f9943b] bg-[#f9943b]/10 text-[#f9943b]' : 'border-gray-100 bg-white text-gray-400'}`}>
                        {m === 'CARTAO' && <CreditCard size={20} />}
                        {m === 'PIX' && <Landmark size={20} />}
                        {m === 'BOLETO' && <Barcode size={20} />}
                        <span className="text-[8px] font-black uppercase">{m === 'CARTAO' ? 'Cartão' : m}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    {metodoPagamento === 'CARTAO' && (
                      <div className="space-y-3 animate-in fade-in">
                        {exibirFormNovoCartao ? (
                          <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-3">
                            <h4 className="font-black text-sm uppercase italic mb-2">Novo Cartão</h4>
                            <input type="text" placeholder="Número do Cartão" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoCartao.numero} onChange={e => setNovoCartao({ ...novoCartao, numero: e.target.value })} />
                            <input type="text" placeholder="Nome impresso" className="w-full text-xs font-bold bg-white p-3 rounded-xl outline-none uppercase" value={novoCartao.titular} onChange={e => setNovoCartao({ ...novoCartao, titular: e.target.value })} />
                            <div className="flex gap-2">
                              <input type="text" placeholder="Validade (MM/AA)" className="w-1/2 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoCartao.validade} onChange={e => setNovoCartao({ ...novoCartao, validade: e.target.value })} />
                              <input type="text" placeholder="CVV" maxLength={4} className="w-1/2 text-xs font-bold bg-white p-3 rounded-xl outline-none" value={novoCartao.cvv} onChange={e => setNovoCartao({ ...novoCartao, cvv: e.target.value })} />
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button onClick={() => setExibirFormNovoCartao(false)} className="flex-1 p-3 text-[10px] font-black uppercase text-gray-500 bg-gray-200 rounded-xl">Cancelar</button>
                              <button onClick={salvarNovoCartao} className="flex-1 p-3 text-[10px] font-black uppercase text-white bg-[#394158] rounded-xl">Adicionar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {meusCartoes.length > 0 ? meusCartoes.map((cartao, idx) => (
                              <button key={cartao.id} onClick={() => setCartaoSelecionado(idx)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-3 items-center ${cartaoSelecionado === idx ? 'border-[#394158] bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${cartaoSelecionado === idx ? 'border-[#394158]' : 'border-gray-300'}`}>
                                  {cartaoSelecionado === idx && <div className="w-2 h-2 bg-[#394158] rounded-full" />}
                                </div>
                                <div className="flex flex-col flex-1">
                                  <span className="text-[11px] font-black uppercase">{cartao.bandeira} final {cartao.finalCartao}</span>
                                  <span className="text-[9px] font-bold text-gray-400">{cartao.titular}</span>
                                </div>
                              </button>
                            )) : (
                              <p className="text-center text-[10px] font-bold text-gray-400 py-4">
                                Nenhum cartão cadastrado.
                              </p>
                            )}
                            <button onClick={() => setExibirFormNovoCartao(true)}
                              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-[#394158]">
                              <PlusCircle size={14} /> Adicionar outro cartão
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {metodoPagamento === 'PIX' && (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in">
                        <Landmark size={36} className="text-[#f9943b] mb-2" />
                        <h4 className="font-black text-sm uppercase">Pagamento via PIX</h4>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">
                          Ao clicar em <strong>Concluir Compra</strong>, o QR Code real será gerado na tela com o código para copiar e pagar no seu banco.
                        </p>
                      </div>
                    )}

                    {metodoPagamento === 'BOLETO' && (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center animate-in fade-in">
                        <Barcode size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-xs font-bold text-gray-500">O boleto será gerado após a confirmação da compra.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {carrinho.itens.length > 0 && itensSelecionados.length > 0 && (
            <footer className="p-8 border-t border-gray-50 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Produtos ({itensSelecionados.length})</span><span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Frete</span>
                  <span>{metodoEntrega === 'entrega' ? `R$ ${valorFrete.toFixed(2)}` : 'Grátis'}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-gray-100">
                  <span className="text-sm font-black uppercase">Total a Pagar</span>
                  <span className="text-3xl font-black text-[#f9943b] italic">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={() => {
                if (step === 1) setStep(2);
                else if (step === 2) setStep(3);
                else handleFinalizarPedido();
              }}
                disabled={processando}
                className={`w-full py-5 rounded-full font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${processando ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-[#f9943b] hover:bg-[#ff8a23] hover:shadow-lg hover:shadow-[#f9943b]/30 text-white active:scale-95'
                  }`}>
                {processando ? 'Processando...'
                  : step === 1 ? 'Avançar para Entrega'
                    : step === 2 ? 'Avançar para Pagamento'
                      : 'Concluir Compra'}
                {!processando && <ChevronRight size={18} />}
              </button>
            </footer>
          )}
        </div>
      </main>

      {/* MODAL DE EXIBIÇÃO DO QR CODE REAL DO PIX */}
      {exibirModalPix && pedidoRealizado?.pagamento?.pixPayload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative border border-gray-100">
            <button
              onClick={() => {
                setExibirModalPix(false);
                navigate('/perfilvendedor');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-[#f9943b]/10 rounded-2xl flex items-center justify-center text-[#f9943b] mb-3">
              <Landmark size={24} />
            </div>

            <h3 className="font-black text-lg text-[#394158]">Pagamento PIX Gerado!</h3>
            <p className="text-[11px] text-gray-500 font-bold mt-1">
              Escaneie o QR Code ou copie a chave abaixo no aplicativo do seu banco:
            </p>

            {/* Renderização real da imagem do QR Code a partir do Payload do Backend */}
            <div className="my-5 p-3 bg-white rounded-2xl border-4 border-[#f9943b] shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  pedidoRealizado.pagamento.pixPayload
                )}`}
                alt="QR Code PIX"
                className="w-44 h-44 object-contain"
              />
            </div>

            <p className="text-xs font-black text-[#55833d] mb-4">
              Total: R$ {Number(pedidoRealizado.valorTotal || total).toFixed(2)}
            </p>

            <div className="w-full bg-gray-50 p-3 rounded-2xl border border-gray-200 flex items-center justify-between gap-2 mb-5">
              <input
                type="text"
                readOnly
                value={pedidoRealizado.pagamento.pixPayload}
                className="bg-transparent text-[10px] text-gray-600 truncate font-mono w-full outline-none"
              />
              <button
                onClick={copiarPix}
                className="bg-[#f9943b] hover:bg-[#ff8a23] text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl shrink-0 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Copy size={12} /> Copiar
              </button>
            </div>

            <button
              onClick={() => {
                setExibirModalPix(false);
                navigate('/perfilvendedor');
              }}
              className="w-full py-4 bg-[#394158] text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-[#2c3346] transition-colors"
            >
              Acompanhar Meus Pedidos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}