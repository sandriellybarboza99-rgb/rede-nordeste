import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Camera, CheckCircle,
  Wallet, Package, Truck, Heart, History, RotateCcw, HelpCircle,
  ChevronRight, Settings,
  MapPin, Clock, ArrowRight, Home, LayoutList, Store, X, 
  Trash2, Menu, User, Map, CreditCard, CreditCard as CardIcon, ChevronLeft, Pencil,
  Eye, Filter, HeartOff, Lock, ShoppingBag, Calendar
} from 'lucide-react';
import {
  getMeusPedidos, atualizarMeuPerfil, getMeuPerfil,
  getMeusEnderecos, criarEndereco, atualizarEndereco, deletarEndereco,
  getMeusCartoes, criarCartao, deletarCartao, getProdutoPorId,
  consultarCep, geocodificarEndereco,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { BackButton } from '../../components/ui/BackButton';

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
  principal: boolean;
  latitudeDestino?: number;
  longitudeDestino?: number;
}

interface Cartao {
  id: number;
  titular: string;
  finalCartao: string;
  bandeira: string;
  validade: string;
}

export default function Perfil() {
  const navigate = useNavigate();
  const { usuario, logout, atualizarTokens } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [telaAtual, setTelaAtual] = useState<'perfil' | 'configuracoes' | 'compras' | 'detalhe-pedido' | 'rastreio-pedido' | 'favoritos' | 'recentes'>('perfil');
  const [abaAtiva, setAbaAtiva] = useState<'pagar' | 'preparando' | 'caminho' | 'finalizados'>('finalizados');
  const [secaoConfig, setSecaoConfig] = useState<'menu' | 'conta' | 'enderecos' | 'cartoes'>('menu');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);

  // ── Dados do usuário (CONTROLADO PELO BACKEND via /usuarios/me) ──
  const [dadosUsuario, setDadosUsuario] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: '',
  });
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);

  // ── Endereços do backend ────────────────────────────────────────
  const [exibirFormEndereco, setExibirFormEndereco] = useState(false);
  const [enderecoEditando, setEnderecoEditando] = useState<Endereco | null>(null);
  const [meusEnderecos, setMeusEnderecos] = useState<Endereco[]>([]);
  const [novoEndereco, setNovoEndereco] = useState({
    destinatario: '', telefone: '', cep: '', estadoCidade: '',
    bairro: '', rua: '', numero: '', complemento: '',
    latitudeDestino: undefined as number | undefined,
    longitudeDestino: undefined as number | undefined,
  });
  const [geocodificandoCep, setGeocodificandoCep] = useState(false);
  const [feedbackCepPerfil, setFeedbackCepPerfil] = useState<'ok' | 'erro' | null>(null);

  // ── Cartões do backend ──────────────────────────────────────────
  const [exibirFormCartao, setExibirFormCartao] = useState(false);
  const [meusCartoes, setMeusCartoes] = useState<Cartao[]>([]);
  const [novoCartao, setNovoCartao] = useState({ numero: '', titular: '', validade: '', cvv: '' });

  // ── Pedidos do backend ──────────────────────────────────────────
  const [pedidos, setPedidos] = useState<any[]>([]);

  // ── Demo data (sem PII — só nomes de produtos públicos) ─────────
  const PRODUTOS_DATA = [
    { id: 1, nome: 'Tomate Cereja Orgânico', preco: 8.90, img: 'https://cdn.shoppub.io/cdn-cgi/image/w=1000,h=1000,q=80,f=auto/beirario/media/uploads/produtos/foto/b3fd841dfd2c3file.png' },
    { id: 2, nome: 'Ovos Caipira (Dúzia)', preco: 14.50, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80' },
    { id: 3, nome: 'Café Especial 500g', preco: 28.90, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80' },
    { id: 5, nome: 'Queijo Coalho Tradicional', preco: 38.00, img: 'https://api.ootimista.com.br/wp-content/uploads/2023/02/queijo-coalho-embrapa.jpg' },
  ];

  const [filtroFavoritos, setFiltroFavoritos] = useState<'recentes' | 'barato' | 'caro'>('recentes');
  const [meusFavoritos, setMeusFavoritos] = useState<any[]>([]);
  const [vistoRecently] = useState([
    { id: 10, nome: 'Azeite de Oliva Extra Virgem', preco: 62.00, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
    { id: 11, nome: 'Feijão Corda Novo', preco: 9.50, img: 'https://images.unsplash.com/photo-1551462147-37885acc3c44?w=400' },
  ]);

  // foto preview (para upload de foto antes de persistir)
  const [fotoPerfil, setFotoPerfil] = useState<string>(
    usuario?.fotoPerfilUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200'
  );

  // ── Inicialização: carrega dados do backend ────────────────────
  useEffect(() => {
    Promise.all([
      getMeusPedidos().catch(() => ({ content: [] })),
      getMeusEnderecos().catch(() => []),
      getMeusCartoes().catch(() => []),
      getMeuPerfil().catch(() => null),
    ]).then(([pedidosData, ends, cards, perfilData]) => {
      setPedidos(pedidosData.content || []);
      setMeusEnderecos(ends);
      setMeusCartoes(cards);
      if (perfilData?.fotoPerfilUrl) {
        setFotoPerfil(perfilData.fotoPerfilUrl);
        atualizarTokens({ fotoPerfilUrl: perfilData.fotoPerfilUrl });
      }
    });

    // Carregar favoritos
    const carregarFavoritos = async () => {
      try {
        const salvos = localStorage.getItem('favoritos_itens');
        if (salvos) {
          const ids: number[] = JSON.parse(salvos);
          const prods = await Promise.all(
            ids.map(id => getProdutoPorId(id).catch(() => null))
          );
          setMeusFavoritos(prods.filter(p => p !== null));
        }
      } catch (err) {
        console.error('Erro ao carregar favoritos', err);
      }
    };
    carregarFavoritos();
  }, []);

  // Remover favorito
  const removerFavorito = (id: number) => {
    setMeusFavoritos(prev => prev.filter(f => f.id !== id));
    const fav = JSON.parse(localStorage.getItem('favoritos_itens') || '[]');
    const newFav = fav.filter((fId: number) => fId !== id);
    localStorage.setItem('favoritos_itens', JSON.stringify(newFav));
    window.dispatchEvent(new Event('storage'));
  };

  // Quando o usuário do contexto chega, atualiza dados visíveis
  useEffect(() => {
    if (usuario) {
      setDadosUsuario((d) => ({ ...d, nome: usuario.nome, email: usuario.email }));
      if (usuario.fotoPerfilUrl && usuario.fotoPerfilUrl !== fotoPerfil) {
        setFotoPerfil(usuario.fotoPerfilUrl);
      }
    }
  }, [usuario]);

  const handleTrocarFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFotoPerfil(base64String);
      try {
        await atualizarMeuPerfil({ fotoPerfilUrl: base64String });
        atualizarTokens({ fotoPerfilUrl: base64String });
        success('Foto atualizada');
      } catch (err: any) {
        toastError(err.message || 'Erro ao salvar foto');
      }
    };
    reader.readAsDataURL(arquivo);
  };

  // ── Salvar dados da conta no backend ────────────────────────────
  const salvarDadosConta = async () => {
    setSalvandoDados(true);
    try {
      await atualizarMeuPerfil({
        nomeCompleto: dadosUsuario.nome,
        email: dadosUsuario.email,
        telefone: dadosUsuario.telefone,
        senhaAtual: senhaAtual || undefined,
        novaSenha: novaSenha || undefined,
      });
      success('Dados atualizados!');
      setSenhaAtual('');
      setNovaSenha('');
      setSecaoConfig('menu');
    } catch (err: any) {
      toastError(err.message || 'Erro ao atualizar.');
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleCepBlurPerfil = async () => {
    if (novoEndereco.cep.replace(/\D/g, '').length !== 8) return;
    setGeocodificandoCep(true);
    setFeedbackCepPerfil(null);
    try {
      const dados = await consultarCep(novoEndereco.cep);
      if (!dados) { setFeedbackCepPerfil('erro'); return; }
      const estadoCidade = `${dados.uf} - ${dados.localidade}`;
      setNovoEndereco((prev) => ({
        ...prev,
        rua: dados.logradouro || prev.rua,
        bairro: dados.bairro || prev.bairro,
        estadoCidade,
      }));
      const coords = await geocodificarEndereco(
        dados.logradouro, novoEndereco.numero, dados.bairro, dados.localidade, dados.uf
      );
      if (coords) {
        setNovoEndereco((prev) => ({ ...prev, latitudeDestino: coords.lat, longitudeDestino: coords.lon }));
        setFeedbackCepPerfil('ok');
      } else {
        setFeedbackCepPerfil('erro');
      }
    } finally {
      setGeocodificandoCep(false);
    }
  };

  // ── Salvar ou Editar endereço no backend ─────────────────────────────
  const salvarNovoEndereco = async () => {
    if (!novoEndereco.destinatario || !novoEndereco.cep || !novoEndereco.rua) {
      toastError('Preencha os campos obrigatórios.');
      return;
    }
    try {
      if (enderecoEditando) {
        const atualizado = await atualizarEndereco(enderecoEditando.id, {
          ...novoEndereco,
          principal: enderecoEditando.principal,
        });
        setMeusEnderecos(meusEnderecos.map((e) => e.id === enderecoEditando.id ? atualizado : e));
        success('Endereço atualizado!');
      } else {
        const criado = await criarEndereco({
          ...novoEndereco,
          principal: meusEnderecos.length === 0,
        });
        setMeusEnderecos([...meusEnderecos, criado]);
        success('Endereço salvo!');
      }
      setEnderecoEditando(null);
      setExibirFormEndereco(false);
      setNovoEndereco({ destinatario: '', telefone: '', cep: '', estadoCidade: '', bairro: '', rua: '', numero: '', complemento: '', latitudeDestino: undefined, longitudeDestino: undefined });
      setFeedbackCepPerfil(null);
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar endereço.');
    }
  };

  const removerEndereco = async (id: number) => {
    try {
      await deletarEndereco(id);
      setMeusEnderecos(meusEnderecos.filter((e) => e.id !== id));
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover endereço.');
    }
  };

  // ── Salvar novo cartão no backend (PCI-aware) ───────────────────
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
      setMeusCartoes([...meusCartoes, criado]);
      setExibirFormCartao(false);
      setNovoCartao({ numero: '', titular: '', validade: '', cvv: '' });
      success('Cartão adicionado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao adicionar cartão.');
    }
  };

  const removerCartao = async (id: number) => {
    try {
      await deletarCartao(id);
      setMeusCartoes(meusCartoes.filter((c) => c.id !== id));
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover cartão.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      success('Você saiu com segurança.');
      navigate('/login', { replace: true });
    } catch {
      toastError('Erro ao sair.');
    }
  };

  const favoritosOrdenados = [...meusFavoritos].sort((a, b) => {
    const precoA = a.precoAtual || a.preco || 0;
    const precoB = b.precoAtual || b.preco || 0;
    if (filtroFavoritos === 'barato') return precoA - precoB;
    if (filtroFavoritos === 'caro') return precoB - precoA;
    return 0;
  });

  // ── Sub-telas ──────────────────────────────────────────────────

  const renderVistoRecentemente = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-5xl mx-auto">
      <h3 className="text-xl font-black uppercase italic text-[#394158] px-2 tracking-tighter">Visto Recentemente</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10 px-2">
        {vistoRecently.map((prod) => (
          <div key={prod.id} onClick={() => navigate(`/produto/${prod.id}`)} className="bg-white rounded-2xl p-3 shadow-md border border-white flex flex-col h-full cursor-pointer active:scale-95 transition-all group">
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#F5F2ED] mb-3">
              <img src={prod.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={prod.nome} />
            </div>
            <div className="flex flex-col flex-1 px-1">
              <p className="text-[11px] font-black text-[#394158] leading-tight mb-auto">{prod.nome}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <span className="text-xs font-black text-[#55833d]">R$ {prod.preco.toFixed(2).replace('.', ',')}</span>
                <div className="p-2 bg-[#F5F2ED] text-gray-400 rounded-xl"><Eye size={14} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavoritos = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-5xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-50">
          <Filter size={14} className="text-[#55833d]" />
          <select value={filtroFavoritos} onChange={(e) => setFiltroFavoritos(e.target.value as any)} className="text-[9px] font-black uppercase bg-transparent outline-none text-[#394158] cursor-pointer">
            <option value="recentes">Recentes</option>
            <option value="barato">Menor Preço</option>
            <option value="caro">Maior Preço</option>
          </select>
        </div>
      </div>
      <h3 className="text-xl font-black uppercase italic text-[#394158] px-2 tracking-tighter">Meus Favoritos</h3>
      {favoritosOrdenados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-[10px] font-black uppercase text-gray-400">Nenhum favorito ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10 px-2">
          {favoritosOrdenados.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl p-3 shadow-md border border-white flex flex-col h-full relative">
              <button onClick={() => removerFavorito(prod.id)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 shadow-md rounded-full text-red-400 hover:text-red-600 active:scale-90 transition-all">
                <HeartOff size={14} />
              </button>
              <div onClick={() => navigate(`/produto/${prod.id}`)} className="cursor-pointer group flex flex-col flex-1">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#F5F2ED] mb-3">
                  <img src={prod.imagemUrl || prod.img || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={prod.nome} />
                </div>
                <p className="text-[11px] font-black text-[#394158] leading-tight px-1">{prod.nome}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── CONFIGURAÇÕES ──────────────────────────────────────────────
  const renderConfiguracoes = () => {
    switch (secaoConfig) {
      case 'conta':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
            <BackButton para={() => setSecaoConfig('menu')} label="Voltar" />
            <div className="px-2">
              <h3 className="text-xl font-black uppercase italic text-[#394158]">Conta e Segurança</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Atualize seus dados — salvos no servidor</p>
            </div>
            <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-5" onSubmit={(e) => { e.preventDefault(); salvarDadosConta(); }}>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Nome Completo</label>
                <input type="text" value={dadosUsuario.nome} onChange={(e) => setDadosUsuario({ ...dadosUsuario, nome: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">E-mail</label>
                <input type="email" value={dadosUsuario.email} onChange={(e) => setDadosUsuario({ ...dadosUsuario, email: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Telefone</label>
                <input type="text" value={dadosUsuario.telefone} onChange={(e) => setDadosUsuario({ ...dadosUsuario, telefone: e.target.value })} placeholder="(79) 99999-0000" className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" />
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl space-y-3 border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Alterar Senha (opcional)</p>
                <input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="w-full bg-white border-2 border-transparent focus:border-[#55833d]/20 p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" />
                <input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full bg-white border-2 border-transparent focus:border-[#55833d]/20 p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" />
              </div>
              <button type="submit" disabled={salvandoDados} className="w-full bg-[#55833d] disabled:bg-gray-300 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                {salvandoDados ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        );
      case 'enderecos':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <BackButton para={() => exibirFormEndereco ? setExibirFormEndereco(false) : setSecaoConfig('menu')} label="Voltar" />
              {!exibirFormEndereco && meusEnderecos.length > 0 && (
                <button onClick={() => setExibirFormEndereco(true)} className="text-[10px] font-black uppercase text-[#55833d] bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50">+ Adicionar Outro</button>
              )}
            </div>
            <div className="px-2">
              <h3 className="text-xl font-black uppercase italic text-[#394158]">{exibirFormEndereco ? (enderecoEditando ? 'Editar Endereço' : 'Novo Endereço') : 'Meus Endereços'}</h3>
            </div>
            {exibirFormEndereco ? (
              <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-4" onSubmit={(e) => { e.preventDefault(); salvarNovoEndereco(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Destinatário</label>
                    <input type="text" value={novoEndereco.destinatario} onChange={(e) => setNovoEndereco({ ...novoEndereco, destinatario: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="Ex: Maria Silva" />
                  </div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Telefone</label><input type="text" value={novoEndereco.telefone} onChange={(e) => setNovoEndereco({ ...novoEndereco, telefone: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="(00) 00000-0000" /></div>
                  <div className="space-y-1.5 relative"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">CEP</label><input type="text" value={novoEndereco.cep} onChange={(e) => { setNovoEndereco({ ...novoEndereco, cep: e.target.value }); setFeedbackCepPerfil(null); }} onBlur={handleCepBlurPerfil} className={`w-full bg-[#F5F2ED]/50 border-2 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] pr-14 ${feedbackCepPerfil === 'ok' ? 'border-green-400' : feedbackCepPerfil === 'erro' ? 'border-red-300' : 'border-transparent focus:border-[#55833d]/20'}`} placeholder="00000-000" />{geocodificandoCep && <span className="absolute right-4 bottom-4 text-[10px] text-[#f9943b] animate-pulse font-bold">GPS...</span>}{!geocodificandoCep && feedbackCepPerfil === 'ok' && <span className="absolute right-4 bottom-4 text-green-500">✔</span>}{!geocodificandoCep && feedbackCepPerfil === 'erro' && <span className="absolute right-4 bottom-4 text-red-400">⚠</span>}</div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Estado - Cidade</label><input type="text" value={novoEndereco.estadoCidade} onChange={(e) => setNovoEndereco({ ...novoEndereco, estadoCidade: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="Sergipe - Aracaju" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Bairro</label><input type="text" value={novoEndereco.bairro} onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="Centro" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Rua</label><input type="text" value={novoEndereco.rua} onChange={(e) => setNovoEndereco({ ...novoEndereco, rua: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="Rua das Flores" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Número</label><input type="text" value={novoEndereco.numero} onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="123" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Complemento</label><input type="text" value={novoEndereco.complemento} onChange={(e) => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158]" placeholder="Apt, Bloco..." /></div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#55833d] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Salvar Endereço</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {meusEnderecos.length > 0 ? (
                  meusEnderecos.map((end) => (
                    <div key={end.id} className="bg-white p-6 rounded-2xl border border-white shadow-sm flex justify-between items-start animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-[#f9943b]">{end.destinatario} {end.principal && <span className="text-[#55833d]">• PRINCIPAL</span>}</p>
                        <p className="text-xs font-bold text-[#394158]">{end.rua}, {end.numero}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{end.bairro} • {end.estadoCidade}</p>
                        <p className="text-[10px] text-gray-400 font-bold">CEP: {end.cep}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
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
                            setFeedbackCepPerfil(end.latitudeDestino && end.longitudeDestino ? 'ok' : null);
                            setExibirFormEndereco(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => removerEndereco(end.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-[#802D44]/20 text-center">
                    <div className="bg-[#F5F2ED] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><MapPin size={32} className="text-[#802D44] opacity-40" /></div>
                    <p className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">Nenhum endereço cadastrado</p>
                    <button onClick={() => setExibirFormEndereco(true)} className="bg-[#802D44] text-white px-10 py-5 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">+ Adicionar Novo</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'cartoes':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
            <BackButton para={() => exibirFormCartao ? setExibirFormCartao(false) : setSecaoConfig('menu')} label="Voltar" />
            <div className="px-2">
              <h3 className="text-xl font-black uppercase italic text-[#394158]">{exibirFormCartao ? 'Adicionar Cartão' : 'Pagamentos'}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Somente os últimos 4 dígitos são armazenados (PCI)</p>
            </div>
            {exibirFormCartao ? (
              <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-5" onSubmit={(e) => { e.preventDefault(); salvarNovoCartao(); }}>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Número do Cartão</label>
                  <div className="relative">
                    <input type="text" maxLength={19} value={novoCartao.numero} onChange={(e) => setNovoCartao({ ...novoCartao, numero: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#f9943b]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" placeholder="0000 0000 0000 0000" />
                    <CardIcon className="absolute right-4 top-4 text-gray-300" size={20} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Nome no Cartão</label>
                  <input type="text" value={novoCartao.titular} onChange={(e) => setNovoCartao({ ...novoCartao, titular: e.target.value.toUpperCase() })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#f9943b]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" placeholder="JOÃO D SILVA" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Validade</label><input type="text" placeholder="MM/AA" value={novoCartao.validade} onChange={(e) => setNovoCartao({ ...novoCartao, validade: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#f9943b]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">CVV</label><input type="text" placeholder="000" maxLength={4} value={novoCartao.cvv} onChange={(e) => setNovoCartao({ ...novoCartao, cvv: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#f9943b]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold text-[#394158] transition-all" /></div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#f9943b] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Confirmar Cartão</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {meusCartoes.map((cartao) => (
                  <div key={cartao.id} className="bg-gradient-to-br from-[#394158] to-[#1a1f2c] p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl group animate-in fade-in duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start mb-12 relative z-10">
                      <CardIcon size={32} className="text-[#f9943b]" />
                      <button onClick={() => removerCartao(cartao.id)} className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full transition-all active:scale-90"><X size={18} className="text-white" /></button>
                    </div>
                    <p className="text-xl tracking-[0.3em] font-mono mb-8">**** **** **** {cartao.finalCartao}</p>
                    <div className="flex justify-between items-end">
                      <div><p className="text-[8px] uppercase opacity-40 font-black tracking-widest">Titular</p><p className="text-xs font-black uppercase">{cartao.titular}</p></div>
                      <div className="text-right"><p className="text-[8px] uppercase opacity-40 font-black tracking-widest">{cartao.bandeira}</p><p className="text-xs font-black">{cartao.validade}</p></div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setExibirFormCartao(true)} className="w-full py-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:border-[#f9943b] hover:text-[#f9943b] active:scale-95 transition-all flex items-center justify-center gap-3"><CardIcon size={18} /> + Adicionar Novo Cartão</button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-3 animate-in fade-in duration-300">
            <h3 className="text-xl font-black uppercase italic text-[#394158] mb-6 px-4">CONFIGURAÇÕES</h3>
            {[{ id: 'conta', icon: Lock, label: 'Conta e Segurança' }, { id: 'enderecos', icon: MapPin, label: 'Meus Endereços' }, { id: 'cartoes', icon: CreditCard, label: 'Métodos de Pagamento' }].map((item) => (
              <button key={item.id} onClick={() => setSecaoConfig(item.id as any)} className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-white shadow-sm active:scale-[0.98] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F5F2ED] text-[#f9943b] rounded-2xl group-hover:bg-[#f9943b] group-hover:text-white transition-all"><item.icon size={20} /></div>
                  <span className="font-black uppercase text-[11px] text-[#394158] tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        );
    }
  };

  const renderDetalhePedido = () => {
    if (!pedidoSelecionado) return null;

    const status = pedidoSelecionado.statusEntrega || 'PEDIDO_RECEBIDO';
    const isCancelado = status === 'CANCELADO';
    
    // Calcula o progresso (0 a 3)
    let progresso = 0;
    if (['AGUARDANDO_ENTREGADOR', 'ENTREGADOR_ACEITOU', 'PEDIDO_EM_COLETA'].includes(status)) progresso = 1;
    if (['SAIU_PARA_ENTREGA', 'RETIRADA_DISPONIVEL'].includes(status)) progresso = 2;
    if (status === 'ENTREGUE') progresso = 3;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-white">
          <div className="bg-[#394158] p-8 text-white">
            <p className="text-[10px] font-black uppercase opacity-60 mb-1">Recibo Digital</p>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Pedido #{pedidoSelecionado.id}</h3>
          </div>
          <div className="p-8 space-y-8">
            
            {/* WIZARD TRACKING */}
            {isCancelado ? (
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
                <X size={32} className="text-red-500 mb-2" />
                <h4 className="text-red-600 font-black uppercase text-sm">Pedido Cancelado</h4>
                <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-widest">Este pedido não será entregue.</p>
              </div>
            ) : (
              <div className="relative pt-4 pb-8">
                {/* Linha de progresso no fundo */}
                <div className="absolute top-[28px] md:top-[32px] left-8 right-8 h-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                  <div className="h-full bg-[#55833d] transition-all duration-700 ease-in-out" style={{ width: `${(progresso / 3) * 100}%` }} />
                </div>
                
                {/* Os 4 passos */}
                <div className="relative z-10 flex justify-between">
                  {[
                    { label: 'Recebido', icon: ShoppingBag, concluido: progresso >= 0 },
                    { label: 'Preparando', icon: Package, concluido: progresso >= 1 },
                    { label: 'A Caminho', icon: Truck, concluido: progresso >= 2 },
                    { label: 'Entregue', icon: CheckCircle, concluido: progresso >= 3 },
                  ].map((passo, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 w-16 md:w-24">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border-4 border-white ${passo.concluido ? 'bg-[#55833d] text-white' : 'bg-gray-100 text-gray-300'}`}>
                        <passo.icon size={20} />
                      </div>
                      <span className={`text-[8px] md:text-[9px] font-black uppercase text-center tracking-widest leading-tight ${passo.concluido ? 'text-[#394158]' : 'text-gray-300'}`}>
                        {passo.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F5F2ED] p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                <Calendar size={20} className="text-[#f9943b]" />
                <div>
                  <p className="text-[8px] font-black uppercase opacity-40">Data</p>
                  <p className="text-xs font-bold">{pedidoSelecionado.dataPedido?.substring(0, 10) || '—'}</p>
                </div>
              </div>
              <div className="bg-[#F5F2ED] p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                <CardIcon size={20} className="text-[#f9943b]" />
                <div>
                  <p className="text-[8px] font-black uppercase opacity-40">Pagamento</p>
                  <p className="text-xs font-bold">{pedidoSelecionado.metodoPagamento || 'CARTAO'}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-dashed flex flex-col gap-4">
              <div className="flex justify-between items-baseline px-2">
                <span className="font-black uppercase text-[10px] opacity-30">Total Pago</span>
                <span className="text-2xl font-black text-[#55833d]">R$ {Number(pedidoSelecionado.valorTotal || pedidoSelecionado.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRastreioPedido = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-50">
        <p className="text-[10px] font-black uppercase text-[#f9943b] tracking-widest mb-1">Pedido {pedidoSelecionado?.id}</p>
        <h3 className="text-xl font-black italic text-[#394158] uppercase">Acompanhe seu pedido</h3>
        <div className="mt-8 flex items-center gap-3 text-[#f9943b]"><Truck size={24} /><span className="text-xs font-bold">A caminho</span></div>
      </div>
    </div>
  );

  // Mapeia aba → status do backend.
  // 'pagar' = pagamento ainda pendente (statusPagamento = AGUARDANDO).
  // Demais abas filtram por statusEntrega.
  const filtrarPedidosPorAba = (lista: any[], aba: typeof abaAtiva) => {
    return lista.filter((p) => {
      const statusEntrega = p.statusEntrega;
      const statusPagamento = p.statusPagamento;
      switch (aba) {
        case 'pagar':
          return statusPagamento === 'AGUARDANDO';
        case 'preparando':
          return ['PEDIDO_RECEBIDO', 'AGUARDANDO_ENTREGADOR', 'ENTREGADOR_ACEITOU', 'PEDIDO_EM_COLETA'].includes(statusEntrega);
        case 'caminho':
          return ['SAIU_PARA_ENTREGA', 'RETIRADA_DISPONIVEL'].includes(statusEntrega);
        case 'finalizados':
          return ['ENTREGUE', 'CANCELADO'].includes(statusEntrega);
        default:
          return true;
      }
    });
  };

  // Cor + ícone da aba ativa para uso visual no card
  const visualAba = {
    pagar: { cor: 'text-[#f9943b]', bg: 'from-[#f9943b]/10 to-[#f9943b]/5', borda: 'border-[#f9943b]/10', label: 'Aguardando pagamento' },
    preparando: { cor: 'text-[#802D44]', bg: 'from-[#802D44]/10 to-[#802D44]/5', borda: 'border-[#802D44]/10', label: 'Em preparação' },
    caminho: { cor: 'text-[#f9943b]', bg: 'from-[#f9943b]/10 to-[#f9943b]/5', borda: 'border-[#f9943b]/10', label: 'A caminho' },
    finalizados: { cor: 'text-[#55833d]', bg: 'from-[#55833d]/10 to-[#55833d]/5', borda: 'border-[#55833d]/10', label: 'Finalizado' },
  } as const;

  const renderTelaCompras = () => {
    const pedidosDaAba = filtrarPedidosPorAba(pedidos, abaAtiva);
    const visual = visualAba[abaAtiva];

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <section className="bg-white rounded-2xl shadow-xl border border-white overflow-hidden">
          <div className="flex border-b border-gray-50 overflow-x-auto bg-white">
            {([
              { id: 'pagar', l: 'A Pagar', i: Wallet },
              { id: 'preparando', l: 'Preparando', i: Package },
              { id: 'caminho', l: 'A Caminho', i: Truck },
              { id: 'finalizados', l: 'Finalizados', i: ShoppingBag },
            ] as const).map((tab) => {
              const count = filtrarPedidosPorAba(pedidos, tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`flex-1 min-w-[80px] py-6 flex flex-col items-center gap-2 relative transition-colors ${abaAtiva === tab.id ? 'text-[#55833d]' : 'text-gray-300 hover:text-[#394158]'
                    }`}
                >
                  <div className="relative">
                    <tab.i size={18} />
                    {count > 0 && (
                      <span className="absolute -top-2 -right-3 bg-[#f9943b] text-white text-[8px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter">{tab.l}</span>
                  {abaAtiva === tab.id && <div className="absolute bottom-0 w-8 h-1 bg-[#55833d] rounded-t-full" />}
                </button>
              );
            })}
          </div>

          <div className="p-8 min-h-[400px] bg-[#FDFCFB]">
            {pedidosDaAba.length > 0 ? (
              <div className="space-y-4">
                {pedidosDaAba.map((pedido) => (
                  <div
                    key={pedido.id}
                    onClick={() => { setPedidoSelecionado(pedido); setTelaAtual('detalhe-pedido'); }}
                    className={`bg-gradient-to-r ${visual.bg} rounded-2xl p-6 border ${visual.borda} flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:shadow-md group`}
                  >
                    <div>
                      <p className={`text-[10px] font-black uppercase ${visual.cor}`}>Pedido #{pedido.id}</p>
                      <h4 className="text-lg font-black text-[#394158] italic">R$ {pedido.valorTotal}</h4>
                      <p className={`text-[9px] font-black uppercase flex items-center gap-1 ${visual.cor}`}>
                        <CheckCircle size={10} /> {visual.label}
                      </p>
                    </div>
                    <div className={`bg-white p-3 rounded-full shadow-sm ${visual.cor}`}><ChevronRight size={20} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <ShoppingBag size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Nenhum pedido em {visual.label.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  // ── Header contextual (título muda por sub-tela) ───────────────
  const tituloPagina =
    telaAtual === 'configuracoes' ? 'Configurações' :
      telaAtual === 'compras' ? 'Minhas Compras' :
        telaAtual === 'detalhe-pedido' ? 'Detalhe do Pedido' :
          telaAtual === 'rastreio-pedido' ? 'Rastreio do Pedido' :
            telaAtual === 'favoritos' ? 'Meus Favoritos' :
              telaAtual === 'recentes' ? 'Visto Recentemente' :
                'Meu Perfil';

  // Navegação contextual: detalhe/rastreio → compras → perfil → home.
  // Em configurações com sub-aba aberta, volta para o menu de config primeiro.
  const handleVoltarHeader = () => {
    if (telaAtual === 'detalhe-pedido' || telaAtual === 'rastreio-pedido') {
      setTelaAtual('compras');
      return;
    }
    if (telaAtual === 'configuracoes' && secaoConfig !== 'menu') {
      setSecaoConfig('menu');
      return;
    }
    if (telaAtual !== 'perfil') {
      setTelaAtual('perfil');
      return;
    }
    navigate('/home2');
  };

  // Label dinâmico — comunica para onde vai
  const labelVoltarHeader =
    telaAtual === 'detalhe-pedido' || telaAtual === 'rastreio-pedido' ? 'Compras' :
      telaAtual === 'configuracoes' && secaoConfig !== 'menu' ? 'Configurações' :
        telaAtual === 'perfil' ? 'Início' :
          'Perfil';

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-inter pb-24 md:pb-10">
      <input type="file" ref={fileInputRef} onChange={handleTrocarFoto} accept="image/*" className="hidden" />

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8 page-enter">
        <PageHeader
          titulo={tituloPagina}
          voltarPara={handleVoltarHeader}
          labelVoltar={labelVoltarHeader}
          acoesDireita={
            telaAtual === 'perfil' ? (
              <>
                <button onClick={() => setTelaAtual('configuracoes')} className="p-2 rounded-full hover:bg-white transition-colors" title="Configurações">
                  <Settings size={18} />
                </button>
                <button onClick={handleLogout} className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors" title="Sair">
                  <LogOut size={18} />
                </button>
              </>
            ) : undefined
          }
        />

        {telaAtual === 'configuracoes' ? renderConfiguracoes() :
          telaAtual === 'compras' ? renderTelaCompras() :
            telaAtual === 'detalhe-pedido' ? renderDetalhePedido() :
              telaAtual === 'rastreio-pedido' ? renderRastreioPedido() :
                telaAtual === 'favoritos' ? renderFavoritos() :
                  telaAtual === 'recentes' ? renderVistoRecentemente() : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="bg-gradient-to-r from-[#f9943b] to-[#fbac66] rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-inner bg-white/20"><img src={fotoPerfil} className="w-full h-full object-cover" alt="User" /></div>
                          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#55833d] p-2.5 rounded-full border-2 border-white shadow-lg active:scale-90 transition-all"><Camera size={14} className="text-white" /></button>
                        </div>
                        <div className="text-center md:text-left z-10">
                          <h3 className="text-2xl font-black leading-none mb-2 tracking-tight">{dadosUsuario.nome || 'Comprador'}</h3>
                          <span className="text-[10px] font-black uppercase bg-white px-4 py-1.5 rounded-full inline-flex w-max items-center justify-center gap-1.5 text-[#55833d] shadow-sm"><CheckCircle size={12} className="text-[#4ade80]" /> Comprador Verificado</span>
                        </div>
                      </div>

                      <section className="bg-white rounded-2xl p-8 shadow-xl border border-white">
                        <div className="flex justify-between items-center mb-8 px-2">
                          <h4 className="uppercase tracking-[0.2em] text-gray-400 text-[11px] font-bold">Minhas Compras</h4>
                          <button onClick={() => { setAbaAtiva('finalizados'); setTelaAtual('compras'); }} className="uppercase text-[#394158] bg-[#802D44]/5 px-4 py-2 rounded-full active:scale-95 transition-all text-[11px] font-bold">Histórico</button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { i: Wallet, t: 'A Pagar', id: 'pagar' }, { i: Package, t: 'Preparando', id: 'preparando' },
                            { i: Truck, t: 'A Caminho', id: 'caminho' }, { i: ShoppingBag, t: 'Finalizados', id: 'finalizados' },
                          ].map((item) => (
                            <div key={item.t} onClick={() => { setAbaAtiva(item.id as any); setTelaAtual('compras'); }} className="flex flex-col items-center gap-3 group cursor-pointer active:scale-90 transition-all">
                              <div className="w-14 h-14 bg-[#F5F2ED] rounded-2xl flex items-center justify-center text-[#394158] group-hover:bg-[#55833d] group-hover:text-white transition-all duration-300 shadow-sm"><item.i size={22} /></div>
                              <span className="text-[12px] font-semibold text-center tracking-tighter">{item.t}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="bg-white rounded-2xl p-4 md:p-8 shadow-xl border border-white">
                        <div className="flex justify-center items-center mb-4 md:mb-8 px-2"><h4 className="uppercase tracking-[0.2em] text-gray-400 text-[11px] font-bold">Atividades</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 w-full divide-y divide-gray-100 md:divide-y-0">
                          <div className="flex justify-center w-full py-4 md:py-0">
                            <button onClick={() => setTelaAtual('favoritos')} className="flex flex-col items-center justify-center p-4 hover:bg-[#F5F2ED] rounded-2xl active:scale-[0.98] group transition-all w-full md:w-32 gap-3 text-center">
                              <div className="text-[#55833d] group-hover:scale-110 transition-transform"><Heart size={24} /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Favoritos</span>
                            </button>
                          </div>
                          <div className="flex justify-center w-full py-4 md:py-0">
                            <button onClick={() => setTelaAtual('recentes')} className="flex flex-col items-center justify-center p-4 hover:bg-[#F5F2ED] rounded-2xl active:scale-[0.98] group transition-all w-full md:w-32 gap-3 text-center">
                              <div className="text-[#802D44] group-hover:scale-110 transition-transform"><History size={24} /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Visto<br className="hidden md:block" />Recentemente</span>
                            </button>
                          </div>
                          <div className="flex justify-center w-full py-4 md:py-0">
                            <button className="flex flex-col items-center justify-center p-4 hover:bg-[#F5F2ED] rounded-2xl active:scale-[0.98] group transition-all w-full md:w-32 gap-3 text-center">
                              <div className="text-[#f9943b] group-hover:scale-110 transition-transform"><HelpCircle size={24} /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Ajuda e<br className="hidden md:block" />Suporte</span>
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
      </main>
    </div>
  );
}
