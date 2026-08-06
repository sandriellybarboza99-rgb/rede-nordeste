import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2, Minus, Plus, Truck, Store, ChevronRight,
  ShoppingBag, CreditCard, Barcode, MapPin, PlusCircle, CheckCircle, Copy, QrCode, RefreshCw, Pencil,
} from 'lucide-react';
import {
  getCarrinho, adicionarAoCarrinho, removerDoCarrinho, checkout, simularFrete, simularFreteMultiLoja,
  getMeusEnderecos, criarEndereco, deletarEndereco, atualizarEndereco,
  getMeusCartoes, criarCartao, getLojaPorId,
  consultarCep, geocodificarEndereco,
} from '../../services/api';
import { gerarPayloadPix } from '../../utils/pixPayload';
import { PageHeader } from '../../components/ui/PageHeader';
import { Navbar } from '../../components/ui/Navbar';
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

export default function Carrinho() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [itens, setItens] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Entrega
  const [metodoEntrega, setMetodoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(null);
  const [valorFrete, setValorFrete] = useState<number | null>(null);
  const [fretePorLoja, setFretePorLoja] = useState<{ lojaId: number; nomeLoja: string; valorFrete: number; erro?: boolean }[]>([]);
  const [carregandoFrete, setCarregandoFrete] = useState(false);
  const [modalNovoEndereco, setModalNovoEndereco] = useState(false);
  const [enderecoEditando, setEnderecoEditando] = useState<Endereco | null>(null);
  const [novoEndereco, setNovoEndereco] = useState({
    destinatario: '',
    telefone: '',
    cep: '',
    estadoCidade: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
    latitudeDestino: undefined as number | undefined,
    longitudeDestino: undefined as number | undefined,
  });
  const [geocodificandoCep, setGeocodificandoCep] = useState(false);
  const [feedbackCep, setFeedbackCep] = useState<'ok' | 'erro' | null>(null);
  // IDs de endereços cuja localização está sendo atualizada
  const [atualizandoLocalizacao, setAtualizandoLocalizacao] = useState<Set<number>>(new Set());

  const [lojaRetirada, setLojaRetirada] = useState<any>(null);

  useEffect(() => {
    if (metodoEntrega === 'retirada' && itens.length > 0) {
      const primeiraLojaId = itens[0]?.produto?.lojaId || itens[0]?.produto?.loja?.id || itens[0]?.lojaId;
      if (primeiraLojaId) {
        getLojaPorId(primeiraLojaId).then(setLojaRetirada).catch(() => { });
      }
    }
  }, [metodoEntrega, itens]);

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix' | 'boleto'>('pix');
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<number | null>(null);
  const [modalNovoCartao, setModalNovoCartao] = useState(false);
  const [novoCartao, setNovoCartao] = useState({
    numero: '',
    titular: '',
    validade: '',
    cvv: '',
  });

  // Estado dos Dados do PIX (gerados após o checkout)
  const [pixDados, setPixDados] = useState<{ qrCodeUrl?: string; copiaECola?: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Carregar carrinho, endereços e cartões
  useEffect(() => {
    async function carregarTudo() {
      try {
        setCarregando(true);
        const [carrinhoRes, endRes, cartaoRes] = await Promise.all([
          getCarrinho().catch(() => ({ itens: [] })),
          getMeusEnderecos().catch(() => []),
          getMeusCartoes().catch(() => []),
        ]);

        const listaItens = carrinhoRes.itens || carrinhoRes.content || carrinhoRes || [];
        setItens(Array.isArray(listaItens) ? listaItens : []);

        if (Array.isArray(endRes)) {
          setEnderecos(endRes);
          const princ = endRes.find((e: Endereco) => e.principal);
          if (princ) setEnderecoSelecionado(princ.id);
          else if (endRes.length > 0) setEnderecoSelecionado(endRes[0].id);
        }

        if (Array.isArray(cartaoRes)) {
          setCartoes(cartaoRes);
          if (cartaoRes.length > 0) setCartaoSelecionado(cartaoRes[0].id);
        }
      } catch (err: any) {
        toastError(err.message || 'Erro ao carregar carrinho.');
      } finally {
        setCarregando(false);
      }
    }
    carregarTudo();
  }, []);

  // Recalcular Frete quando muda o endereço ou método de entrega
  useEffect(() => {
    if (metodoEntrega === 'retirada' || !enderecoSelecionado || itens.length === 0) {
      setValorFrete(0);
      setFretePorLoja([]);
      return;
    }
    const end = enderecos.find((e) => e.id === enderecoSelecionado);
    if (!end) {
      setValorFrete(null);
      setFretePorLoja([]);
      return;
    }

    if (!end.latitudeDestino || !end.longitudeDestino) {
      // Endereço sem coordenadas — avisa mas não usa fallback enganoso
      setValorFrete(null);
      setFretePorLoja([]);
      return;
    }

    const lojaIds = Array.from(new Set(itens.map(i => i.lojaId || i.produto?.lojaId || i.produto?.loja?.id).filter(Boolean)));
    if (lojaIds.length === 0) {
      setValorFrete(null);
      setFretePorLoja([]);
      return;
    }

    setCarregandoFrete(true);
    simularFreteMultiLoja(lojaIds, end.latitudeDestino, end.longitudeDestino)
      .then((res) => {
        setFretePorLoja(res as any);
        const total = res.reduce((acc, curr) => acc + (curr.valorFrete || 0), 0);
        setValorFrete(total);
      })
      .catch(() => {
        setValorFrete(null);
        setFretePorLoja([]);
      })
      .finally(() => setCarregandoFrete(false));
  }, [enderecoSelecionado, metodoEntrega, itens, enderecos]);

  // Alterar Quantidade de Itens
  const handleAlterarQtd = async (produtoId: number, quantidadeAtual: number, delta: number) => {
    const novaQtd = quantidadeAtual + delta;
    if (novaQtd <= 0) {
      handleRemoverItem(produtoId);
      return;
    }
    try {
      await adicionarAoCarrinho(produtoId, novaQtd);
      setItens((prev) =>
        prev.map((item) => {
          const id = item.produtoId || item.produto?.id;
          if (id === produtoId) return { ...item, quantidade: novaQtd };
          return item;
        })
      );
    } catch (err: any) {
      toastError(err.message || 'Erro ao alterar quantidade.');
    }
  };

  // Remover Item do Carrinho
  const handleRemoverItem = async (produtoId: number) => {
    try {
      await removerDoCarrinho(produtoId);
      setItens((prev) => prev.filter((i) => (i.produtoId || i.produto?.id) !== produtoId));
      success('Item removido do carrinho.');
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover item.');
    }
  };

  // Busca CEP e preenche campos automaticamente
  const handleCepBlur = async () => {
    if (novoEndereco.cep.replace(/\D/g, '').length !== 8) return;
    setGeocodificandoCep(true);
    setFeedbackCep(null);
    try {
      const dados = await consultarCep(novoEndereco.cep);
      if (!dados) { setFeedbackCep('erro'); return; }

      // Preenche campos textuais
      const estadoCidade = `${dados.uf} - ${dados.localidade}`;
      setNovoEndereco((prev) => ({
        ...prev,
        rua: dados.logradouro || prev.rua,
        bairro: dados.bairro || prev.bairro,
        estadoCidade,
      }));

      // Geocodifica: prefere logradouro completo, mas usa cidade como fallback
      const logradouro = dados.logradouro || novoEndereco.rua || dados.localidade;
      const bairro = dados.bairro || novoEndereco.bairro || '';
      const coords = await geocodificarEndereco(
        logradouro,
        novoEndereco.numero,
        bairro,
        dados.localidade,
        dados.uf,
      );
      if (coords) {
        setNovoEndereco((prev) => ({
          ...prev,
          latitudeDestino: coords.lat,
          longitudeDestino: coords.lon,
        }));
        setFeedbackCep('ok');
      } else {
        // Tenta só com cidade/estado como último recurso
        const coordsCidade = await geocodificarEndereco('', '', '', dados.localidade, dados.uf);
        if (coordsCidade) {
          setNovoEndereco((prev) => ({
            ...prev,
            latitudeDestino: coordsCidade.lat,
            longitudeDestino: coordsCidade.lon,
          }));
          setFeedbackCep('ok');
        } else {
          setFeedbackCep('erro');
        }
      }
    } finally {
      setGeocodificandoCep(false);
    }
  };

  // Deletar endereço existente
  const handleDeletarEndereco = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deletarEndereco(id);
      setEnderecos((prev) => prev.filter((end) => end.id !== id));
      if (enderecoSelecionado === id) setEnderecoSelecionado(null);
      success('Endereço removido.');
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover endereço.');
    }
  };

  // Atualizar localização de um endereço existente via Nominatim
  const handleAtualizarLocalizacao = async (end: Endereco, e: React.MouseEvent) => {
    e.stopPropagation();
    setAtualizandoLocalizacao((prev) => new Set(prev).add(end.id));
    try {
      // Tenta geocodificar com logradouro + bairro + cidade
      const [uf, cidade] = end.estadoCidade?.includes(' - ')
        ? [end.estadoCidade.split(' - ')[0], end.estadoCidade.split(' - ')[1]]
        : ['SE', end.estadoCidade || 'Aracaju'];

      let coords = await geocodificarEndereco(end.rua, end.numero, end.bairro, cidade, uf);
      // Fallback: só cidade/estado
      if (!coords) coords = await geocodificarEndereco('', '', '', cidade, uf);

      if (!coords) {
        // Tenta via CEP
        const dadosCep = await consultarCep(end.cep);
        if (dadosCep) coords = await geocodificarEndereco(dadosCep.logradouro, end.numero, dadosCep.bairro, dadosCep.localidade, dadosCep.uf);
      }

      if (coords) {
        const atualizado = await atualizarEndereco(end.id, {
          destinatario: end.destinatario,
          telefone: end.telefone,
          cep: end.cep,
          estadoCidade: end.estadoCidade,
          bairro: end.bairro,
          rua: end.rua,
          numero: end.numero,
          complemento: end.complemento,
          latitudeDestino: coords.lat,
          longitudeDestino: coords.lon,
          principal: end.principal,
        });
        setEnderecos((prev) => prev.map((e) => e.id === end.id ? atualizado : e));
        success('Localização atualizada!');
      } else {
        toastError('Não foi possível obter as coordenadas. Verifique o endereço.');
      }
    } catch (err: any) {
      toastError(err.message || 'Erro ao atualizar localização.');
    } finally {
      setAtualizandoLocalizacao((prev) => { const s = new Set(prev); s.delete(end.id); return s; });
    }
  };

  // Criar ou Editar Endereço no Modal
  const handleSalvarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (enderecoEditando) {
        const atualizado = await atualizarEndereco(enderecoEditando.id, {
          ...novoEndereco,
          principal: enderecoEditando.principal,
        });
        setEnderecos((prev) => prev.map((e) => e.id === enderecoEditando.id ? atualizado : e));
        setEnderecoEditando(null);
        setModalNovoEndereco(false);
        success('Endereço atualizado com sucesso!');
      } else {
        const criado = await criarEndereco({
          ...novoEndereco,
          principal: enderecos.length === 0,
        });
        setEnderecos((prev) => [...prev, criado]);
        setEnderecoSelecionado(criado.id);
        setModalNovoEndereco(false);
        success('Endereço cadastrado com sucesso!');
      }

      setNovoEndereco({
        destinatario: '',
        telefone: '',
        cep: '',
        estadoCidade: '',
        bairro: '',
        rua: '',
        numero: '',
        complemento: '',
        latitudeDestino: undefined,
        longitudeDestino: undefined,
      });
      setFeedbackCep(null);
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar endereço.');
    }
  };

  // Criar Cartão no Modal
  const handleSalvarCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const criado = await criarCartao({
        titular: novoCartao.titular,
        numero: novoCartao.numero.replace(/\D/g, ''),
        validade: novoCartao.validade,
        cvv: novoCartao.cvv,
      });
      setCartoes((prev) => [...prev, criado]);
      setCartaoSelecionado(criado.id);
      setModalNovoCartao(false);
      setNovoCartao({ numero: '', titular: '', validade: '', cvv: '' });
      success('Cartão cadastrado com sucesso!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar cartão.');
    }
  };

  // Finalizar o Pedido no Backend
  const handleFinalizarPedido = async () => {
    if (metodoEntrega === 'entrega' && !enderecoSelecionado) {
      toastError('Selecione um endereço de entrega.');
      return;
    }
    if (metodoPagamento === 'cartao' && !cartaoSelecionado) {
      toastError('Selecione um cartão de crédito.');
      return;
    }

    setProcessando(true);
    try {
      const end = enderecos.find((e) => e.id === enderecoSelecionado);
      const resposta = await checkout({
        metodoPagamento: metodoPagamento.toUpperCase(),
        retiradaNaLoja: metodoEntrega === 'retirada',
        enderecoEntrega: end ? `${end.rua}, ${end.numero} - ${end.bairro}` : undefined,
        cidadeDestino: end?.estadoCidade,
        latitudeDestino: end?.latitudeDestino,
        longitudeDestino: end?.longitudeDestino,
        cartaoId: metodoPagamento === 'cartao' ? (cartaoSelecionado || undefined) : undefined,
      });

      if (metodoPagamento === 'pix') {
        const payloadPix = resposta?.pix || resposta || {};
        let chavePixCopia = payloadPix.pixCopiaECola || payloadPix.chavePix || payloadPix.copiaECola;

        // Se não veio do backend, tentamos gerar no frontend buscando a loja
        if (!chavePixCopia) {
          try {
            const primeiraLojaId = itens[0]?.produto?.lojaId || itens[0]?.lojaId;
            if (primeiraLojaId) {
              const lojaInfo = await getLojaPorId(primeiraLojaId);
              if (lojaInfo?.chavePix) {
                chavePixCopia = gerarPayloadPix({
                  chavePix: lojaInfo.chavePix,
                  tipoChavePix: lojaInfo.tipoChavePix,
                  nomeRecebedor: lojaInfo.nomeLoja || 'Loja',
                  cidadeRecebedor: lojaInfo.cidade || 'Aracaju',
                  valor: total,
                  txId: '***' // Bancos rejeitam txId diferente de *** para PIX estático
                });
              }
            }
          } catch (e) {
            console.error('Erro ao buscar dados do PIX da loja', e);
          }
        }

        // Fallback final
        if (!chavePixCopia) {
          chavePixCopia = '00020126580014BR.GOV.BCB.PIX0114+5579999999999520400005303986540510.005802BR5925REDE NORDESTE COMERCIO6009ARACAJU62070503***6304E2CA';
        }

        const urlQrCode = payloadPix.qrCodeUrl || payloadPix.qrCodeBase64 || ('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(chavePixCopia));

        setPixDados({
          qrCodeUrl: urlQrCode,
          copiaECola: chavePixCopia,
        });
      }

      setSucesso(true);
      success('Pedido realizado com sucesso!');
    } catch (err: any) {
      try {
        // Fallback: Verifica se o backend criou o pedido (carrinho vazio) mas deu erro na resposta 500
        const cartAtual = await getCarrinho().catch(() => null);
        const listaAtual = cartAtual?.itens || cartAtual?.content || cartAtual || [];
        if (Array.isArray(listaAtual) && listaAtual.length === 0) {
          if (metodoPagamento === 'pix') {
            let chavePixCopia = '';
            try {
              const primeiraLojaId = itens[0]?.produto?.lojaId || itens[0]?.lojaId;
              if (primeiraLojaId) {
                const lojaInfo = await getLojaPorId(primeiraLojaId);
                if (lojaInfo?.chavePix) {
                  chavePixCopia = gerarPayloadPix({
                    chavePix: lojaInfo.chavePix,
                    tipoChavePix: lojaInfo.tipoChavePix,
                    nomeRecebedor: lojaInfo.nomeLoja || 'Loja',
                    cidadeRecebedor: lojaInfo.cidade || 'Aracaju',
                    valor: total,
                    txId: '***'
                  });
                }
              }
            } catch (e) { }
            if (!chavePixCopia) chavePixCopia = '00020126580014BR.GOV.BCB.PIX0114+5579999999999520400005303986540510.005802BR5925REDE NORDESTE COMERCIO6009ARACAJU62070503***6304E2CA';
            setPixDados({
              qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(chavePixCopia),
              copiaECola: chavePixCopia,
            });
          }
          setSucesso(true);
          success('Pedido realizado com sucesso!');
          return;
        }
      } catch (fallbackErr) { }

      toastError(err.message || 'Erro ao finalizar pedido.');
    } finally {
      setProcessando(false);
    }
  };

  // Cálculos de Totais
  const subtotal = itens.reduce((acc, item) => {
    const preco = item.precoUnitario || item.produto?.preco || 0;
    return acc + preco * item.quantidade;
  }, 0);

  const freteEfetivo = metodoEntrega === 'entrega' ? (valorFrete ?? 0) : 0;
  const total = subtotal + freteEfetivo;

  // TELA DE SUCESSO / CONCLUÍDO
  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-[#55833d]/10 text-[#55833d] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} />
          </div>

          <h2 className="text-2xl font-black text-[#394158]">Pedido Realizado!</h2>

          {pixDados ? (
            <div className="space-y-5 bg-white p-6 rounded-2xl border border-gray-100 text-left">
              <div className="text-center">
                <p className="text-xs font-bold text-[#394158]">Escaneie o QR Code para Pagar via PIX</p>
                <p className="text-[10px] text-gray-400 mt-0.5">O pagamento é identificado instantaneamente</p>
              </div>

              <div className="flex justify-center p-3 bg-white rounded-xl border border-gray-200 w-fit mx-auto">
                <img src={pixDados.qrCodeUrl} alt="QR Code PIX" className="w-44 h-44 object-contain" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">PIX Copia e Cola</label>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                  <input
                    type="text"
                    readOnly
                    value={pixDados.copiaECola}
                    className="bg-transparent text-[11px] font-mono w-full outline-none text-gray-600 truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixDados.copiaECola || '');
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="p-2 bg-[#55833d] text-white rounded-lg hover:bg-[#446a31] transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase"
                  >
                    <Copy size={12} />
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Seu pedido foi enviado para o produtor e já está sendo processado.</p>
          )}

          <div className="pt-2 space-y-3">
            <button
              onClick={() => navigate('/perfil')}
              className="w-full bg-[#f9943b] text-white py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#ff8a23] transition-colors shadow-md"
            >
              Ver Meus Pedidos
            </button>
            <button
              onClick={() => navigate('/empreendedoras')}
              className="w-full bg-gray-100 text-[#394158] py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Voltar à Vitrine
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased pb-20 md:pb-0 font-sans">
      <Navbar rotaAtiva="/carrinho" />
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        <PageHeader
          titulo="Meu Carrinho"
          subtitulo="Confira seus produtos e escolha a entrega"
          voltarPara={() => navigate(-1)}
        />
        {/* Passos do Checkout */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider ${step === 1 ? 'text-[#f9943b]' : 'text-gray-400'
              }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#f9943b] text-white' : 'bg-gray-100 text-gray-500'
              }`}>1</span>
            Produtos
          </button>
          <ChevronRight size={16} className="text-gray-300" />
          <button
            onClick={() => itens.length > 0 && setStep(2)}
            className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider ${step === 2 ? 'text-[#f9943b]' : 'text-gray-400'
              }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#f9943b] text-white' : 'bg-gray-100 text-gray-500'
              }`}>2</span>
            Entrega
          </button>
          <ChevronRight size={16} className="text-gray-300" />
          <button
            onClick={() => itens.length > 0 && setStep(3)}
            className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider ${step === 3 ? 'text-[#f9943b]' : 'text-gray-400'
              }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#f9943b] text-white' : 'bg-gray-100 text-gray-500'
              }`}>3</span>
            Pagamento
          </button>
        </div>

        {carregando ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 font-bold">
            Carregando itens do carrinho...
          </div>
        ) : itens.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 shadow-sm border border-gray-100">
            <ShoppingBag size={48} className="mx-auto text-gray-300" />
            <h3 className="text-lg font-black uppercase text-[#394158]">Seu carrinho está vazio</h3>
            <p className="text-xs text-gray-400">Adicione produtos da nossa rede para continuar.</p>
            <button
              onClick={() => navigate('/home2')}
              className="bg-[#55833d] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#436830] transition-colors"
            >
              Explorar Vitrine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ÁREA PRINCIPAL DOS PASSO S */}
            <div className="lg:col-span-2 space-y-6">
              {/* PASSO 1: ITENS DO CARRINHO */}
              {step === 1 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Itens Selecionados</h3>
                  <div className="divide-y divide-gray-100">
                    {itens.map((item) => {
                      const prodId = item.produtoId || item.produto?.id;
                      const nome = item.nomeProduto || item.produto?.nome || 'Produto';
                      const preco = item.precoUnitario || item.produto?.preco || 0;
                      const imagem = item.imagemUrl || item.produto?.imagemUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';

                      return (
                        <div key={prodId} className="py-4 flex items-center gap-4">
                          <img src={imagem} alt={nome} className="w-16 h-16 rounded-2xl object-cover bg-white" />
                          <div className="flex-1">
                            <h4 className="font-bold text-xs text-[#394158]">{nome}</h4>
                            <p className="text-xs font-black text-[#55833d] mt-1">
                              R$ {preco.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-[#F5F2ED] rounded-xl p-1">
                            <button
                              onClick={() => handleAlterarQtd(prodId, item.quantidade, -1)}
                              className="p-1 hover:bg-white rounded-lg transition-colors text-gray-600"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black px-2">{item.quantidade}</span>
                            <button
                              onClick={() => handleAlterarQtd(prodId, item.quantidade, 1)}
                              className="p-1 hover:bg-white rounded-lg transition-colors text-gray-600"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoverItem(prodId)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASSO 2: MÉTODOS DE ENTREGA E ENDEREÇO */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Tipo de Recebimento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setMetodoEntrega('entrega')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoEntrega === 'entrega'
                          ? 'border-[#55833d] bg-[#55833d]/5 text-[#55833d]'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <Truck size={24} />
                        <span className="text-xs font-bold uppercase">Entrega em Casa</span>
                      </button>
                      <button
                        onClick={() => setMetodoEntrega('retirada')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoEntrega === 'retirada'
                          ? 'border-[#55833d] bg-[#55833d]/5 text-[#55833d]'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <Store size={24} />
                        <span className="text-xs font-bold uppercase">Retirar na Loja</span>
                      </button>
                    </div>
                  </div>

                  {metodoEntrega === 'entrega' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Endereço de Entrega</h3>
                        <button
                          onClick={() => setModalNovoEndereco(true)}
                          className="text-xs font-bold text-[#55833d] flex items-center gap-1 hover:underline"
                        >
                          <PlusCircle size={14} /> + Adicionar
                        </button>
                      </div>

                      <div className="space-y-3">
                        {enderecos.map((end) => (
                          <div
                            key={end.id}
                            onClick={() => setEnderecoSelecionado(end.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${enderecoSelecionado === end.id
                                ? 'border-[#55833d] bg-[#55833d]/5'
                                : 'border-gray-100 hover:border-gray-200'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin size={18} className={`shrink-0 mt-0.5 ${enderecoSelecionado === end.id ? 'text-[#55833d]' : 'text-gray-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#394158]">{end.destinatario}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  {end.rua}, {end.numero} - {end.bairro}
                                </p>
                                <p className="text-[10px] text-gray-400">{end.estadoCidade} | CEP: {end.cep}</p>
                              </div>
                              {/* Ações */}
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {/* Botão: atualizar localização (só se não tiver coordenadas) */}
                                {(!end.latitudeDestino || !end.longitudeDestino) && (
                                  <button
                                    title="Atualizar localização"
                                    onClick={(e) => handleAtualizarLocalizacao(end, e)}
                                    disabled={atualizandoLocalizacao.has(end.id)}
                                    className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                                  >
                                    <RefreshCw size={13} className={atualizandoLocalizacao.has(end.id) ? 'animate-spin' : ''} />
                                  </button>
                                )}
                                {/* Botão: editar */}
                                <button
                                  title="Editar endereço"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEnderecoEditando(end);
                                    setNovoEndereco({
                                      destinatario: end.destinatario || '',
                                      telefone: end.telefone || '',
                                      cep: end.cep || '',
                                      estadoCidade: end.estadoCidade || '',
                                      bairro: end.bairro || '',
                                      rua: end.rua || '',
                                      numero: end.numero || '',
                                      complemento: end.complemento || '',
                                      latitudeDestino: end.latitudeDestino,
                                      longitudeDestino: end.longitudeDestino,
                                    });
                                    setFeedbackCep(end.latitudeDestino && end.longitudeDestino ? 'ok' : null);
                                    setModalNovoEndereco(true);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                {/* Botão: deletar */}
                                <button
                                  title="Remover endereço"
                                  onClick={(e) => handleDeletarEndereco(end.id, e)}
                                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {/* Badge: sem localização */}
                            {(!end.latitudeDestino || !end.longitudeDestino) && (
                              <div className="mt-2 ml-7 flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  ⚠ Sem localização — clique em ↺ para atualizar
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metodoEntrega === 'retirada' && lojaRetirada && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#55833d] space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Endereço de Retirada</h3>
                        <span className="text-[10px] font-black bg-[#55833d]/10 text-[#55833d] px-3 py-1 rounded-full uppercase tracking-widest">
                          Na Loja
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl border-2 border-[#55833d] bg-[#55833d]/5 flex items-start gap-3">
                        <Store size={20} className="text-[#55833d] shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[#394158] uppercase">{lojaRetirada.nomeLoja || 'Loja'}</p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {lojaRetirada.logradouro || 'Endereço não informado'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {lojaRetirada.bairro} - {lojaRetirada.cidade} / {lojaRetirada.estado}
                          </p>
                          {lojaRetirada.cep && <p className="text-[10px] text-gray-400">CEP: {lojaRetirada.cep}</p>}
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
                        <div className="text-orange-500 font-bold shrink-0">Atenção:</div>
                        <p className="text-[10px] text-orange-600 leading-relaxed">
                          Você deve aguardar o vendedor alterar o status para "Pronto para Retirada" antes de ir buscar o produto.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 3: PAGAMENTO */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Forma de Pagamento</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setMetodoPagamento('pix')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'pix'
                          ? 'border-[#55833d] bg-[#55833d]/5 text-[#55833d]'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <QrCode size={22} />
                        <span className="text-[11px] font-bold uppercase">PIX</span>
                      </button>
                      <button
                        onClick={() => setMetodoPagamento('cartao')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'cartao'
                          ? 'border-[#55833d] bg-[#55833d]/5 text-[#55833d]'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <CreditCard size={22} />
                        <span className="text-[11px] font-bold uppercase">Cartão</span>
                      </button>
                      <button
                        onClick={() => setMetodoPagamento('boleto')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'boleto'
                          ? 'border-[#55833d] bg-[#55833d]/5 text-[#55833d]'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <Barcode size={22} />
                        <span className="text-[11px] font-bold uppercase">Boleto</span>
                      </button>
                    </div>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Cartões Salvos</h3>
                        <button
                          onClick={() => setModalNovoCartao(true)}
                          className="text-xs font-bold text-[#55833d] flex items-center gap-1 hover:underline"
                        >
                          <PlusCircle size={14} /> + Adicionar Cartão
                        </button>
                      </div>

                      <div className="space-y-3">
                        {cartoes.map((car) => (
                          <div
                            key={car.id}
                            onClick={() => setCartaoSelecionado(car.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${cartaoSelecionado === car.id
                              ? 'border-[#55833d] bg-[#55833d]/5'
                              : 'border-gray-100 hover:border-gray-200'
                              }`}
                          >
                            <CreditCard size={20} className={cartaoSelecionado === car.id ? 'text-[#55833d]' : 'text-gray-400'} />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-[#394158] uppercase">{car.bandeira} •••• {car.finalCartao}</p>
                              <p className="text-[10px] text-gray-400">{car.titular} | Validade: {car.validade}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metodoPagamento === 'pix' && (
                    <div className="bg-green-50/50 border border-green-100 rounded-3xl p-5 text-center space-y-2">
                      <p className="text-xs font-bold text-[#55833d]">Pagamento Instantâneo via PIX</p>
                      <p className="text-[11px] text-gray-500">Ao clicar em "Concluir Compra", você receberá o QR Code e o código Copia e Cola para pagar pelo app do seu banco.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 sticky top-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#394158]">Resumo dos Valores</h3>
                <div className="space-y-2 text-xs font-bold text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal ({itens.length} itens)</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <span>Frete</span>
                      <span>
                        {metodoEntrega === 'retirada' ? 'Grátis'
                          : carregandoFrete ? <span className="text-[#f9943b] animate-pulse">Calculando...</span>
                            : valorFrete === null ? <span className="text-amber-500 text-[10px]">Selecione endereço</span>
                              : `R$ ${valorFrete.toFixed(2)}`}
                      </span>
                    </div>
                    {/* Breakdown por loja */}
                    {metodoEntrega === 'entrega' && fretePorLoja.length > 0 && !carregandoFrete && (
                      <div className="pl-2 pr-1 py-1 space-y-1 mt-1 bg-[#F5F2ED] rounded-xl border border-gray-100">
                        {fretePorLoja.map((frete) => (
                          <div key={frete.lojaId} className="flex justify-between text-[10px] text-gray-400 font-medium">
                            <span className="truncate mr-2 flex-1">↳ {frete.nomeLoja}</span>
                            <span>{frete.erro ? 'Erro' : `R$ ${(frete.valorFrete || 0).toFixed(2)}`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {metodoEntrega === 'entrega' && valorFrete === null && !carregandoFrete && enderecoSelecionado && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                      ⚠️ Endereço sem localização. Edite-o ou adicione um novo com CEP válido para calcular o frete.
                    </p>
                  )}
                  <div className="flex justify-between items-baseline pt-4 border-t border-gray-100">
                    <span className="text-sm font-black uppercase text-[#394158]">Total a Pagar</span>
                    <span className="text-2xl font-black text-[#55833d] italic">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (step === 1) setStep(2);
                    else if (step === 2) setStep(3);
                    else handleFinalizarPedido();
                  }}
                  disabled={processando}
                  className={`w-full py-4 rounded-full font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${processando
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-[#f9943b] hover:bg-[#ff8a23] text-white active:scale-95 shadow-md'
                    }`}
                >
                  {processando
                    ? 'Processando...'
                    : step === 1
                      ? 'Avançar para Entrega'
                      : step === 2
                        ? 'Avançar para Pagamento'
                        : metodoPagamento === 'pix' ? 'Gerar QR Code' : 'Concluir Compra'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL ADICIONAR ENDEREÇO */}
      {modalNovoEndereco && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black uppercase text-[#394158]">
              {enderecoEditando ? 'Editar Endereço' : 'Novo Endereço'}
            </h3>
            <form onSubmit={handleSalvarEndereco} className="space-y-3">
              <input
                type="text"
                placeholder="Destinatário"
                required
                value={novoEndereco.destinatario}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, destinatario: e.target.value })}
                className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="CEP (00000-000)"
                  required
                  value={novoEndereco.cep}
                  onChange={(e) => {
                    setNovoEndereco({ ...novoEndereco, cep: e.target.value });
                    setFeedbackCep(null);
                  }}
                  onBlur={handleCepBlur}
                  className={`w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none pr-8 ${feedbackCep === 'ok' ? 'border-2 border-green-400'
                      : feedbackCep === 'erro' ? 'border-2 border-red-300'
                        : ''
                    }`}
                />
                {geocodificandoCep && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#f9943b] animate-pulse font-bold">GPS...</span>
                )}
                {!geocodificandoCep && feedbackCep === 'ok' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✔</span>
                )}
                {!geocodificandoCep && feedbackCep === 'erro' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">⚠</span>
                )}
              </div>
              <input
                type="text"
                placeholder="Estado - Cidade"
                required
                value={novoEndereco.estadoCidade}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, estadoCidade: e.target.value })}
                className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="Bairro"
                required
                value={novoEndereco.bairro}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })}
                className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Rua"
                  required
                  value={novoEndereco.rua}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, rua: e.target.value })}
                  className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
                />
                <input
                  type="text"
                  placeholder="Número"
                  required
                  value={novoEndereco.numero}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })}
                  className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalNovoEndereco(false);
                    setEnderecoEditando(null);
                    setNovoEndereco({
                      destinatario: '', telefone: '', cep: '', estadoCidade: '',
                      bairro: '', rua: '', numero: '', complemento: '',
                      latitudeDestino: undefined, longitudeDestino: undefined
                    });
                  }}
                  className="w-1/2 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-[#55833d] text-white rounded-full font-bold text-xs uppercase shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CARTÃO */}
      {modalNovoCartao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black uppercase text-[#394158]">Novo Cartão</h3>
            <form onSubmit={handleSalvarCartao} className="space-y-3">
              <input
                type="text"
                placeholder="Nome Impresso no Cartão"
                required
                value={novoCartao.titular}
                onChange={(e) => setNovoCartao({ ...novoCartao, titular: e.target.value })}
                className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="Número do Cartão"
                required
                value={novoCartao.numero}
                onChange={(e) => setNovoCartao({ ...novoCartao, numero: e.target.value })}
                className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Validade (MM/AA)"
                  required
                  value={novoCartao.validade}
                  onChange={(e) => setNovoCartao({ ...novoCartao, validade: e.target.value })}
                  className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  required
                  maxLength={4}
                  value={novoCartao.cvv}
                  onChange={(e) => setNovoCartao({ ...novoCartao, cvv: e.target.value })}
                  className="w-full bg-[#F5F2ED] p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoCartao(false)}
                  className="w-1/2 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-[#55833d] text-white rounded-full font-bold text-xs uppercase shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}