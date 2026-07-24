import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, LogOut, CheckCircle, Wallet, Package, Truck,
  Heart, History, HelpCircle, ChevronRight, Settings,
  MapPin, CreditCard, Lock, ShoppingBag, Calendar, LayoutDashboard,
  CreditCard as CardIcon, BookOpen, AlertTriangle, BarChart2,
  Home as HomeIcon, MessageCircle, X, Trash2, Filter, HeartOff, Eye, Store,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  getMinhaLoja, atualizarMeuPerfil,
  getMeusEnderecos, criarEndereco, deletarEndereco,
  getMeusCartoes, criarCartao, deletarCartao,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { BackButton } from '../../components/ui/BackButton';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { ProfileHero } from '../../components/ui/ProfileHero';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';

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
}

interface Cartao {
  id: number;
  titular: string;
  finalCartao: string;
  bandeira: string;
  validade: string;
}

export default function PerfilVendedor() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [minhaLoja, setMinhaLoja] = useState<any>(null);

  const [telaAtual, setTelaAtual] = useState<'perfil' | 'configuracoes' | 'favoritos' | 'recentes' | 'dashboard'>('perfil');
  const [secaoConfig, setSecaoConfig] = useState<'menu' | 'conta' | 'enderecos' | 'cartoes'>('menu');

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
  const [meusEnderecos, setMeusEnderecos] = useState<Endereco[]>([]);
  const [novoEndereco, setNovoEndereco] = useState({
    destinatario: '', telefone: '', cep: '', estadoCidade: '',
    bairro: '', rua: '', numero: '', complemento: '',
  });

  // ── Cartões do backend ──────────────────────────────────────────
  const [exibirFormCartao, setExibirFormCartao] = useState(false);
  const [meusCartoes, setMeusCartoes] = useState<Cartao[]>([]);
  const [novoCartao, setNovoCartao] = useState({ numero: '', titular: '', validade: '', cvv: '' });

  // ── Favoritos / Vistos / Foto ──────────────────────────────────
  const [filtroFavoritos, setFiltroFavoritos] = useState<'recentes' | 'barato' | 'caro'>('recentes');
  const [meusFavoritos, setMeusFavoritos] = useState<any[]>([]);
  const [vistoRecently] = useState([
    { id: 10, nome: 'Azeite de Oliva Extra Virgem', preco: 62.00, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
    { id: 11, nome: 'Feijão Corda Novo', preco: 9.50, img: 'https://images.unsplash.com/photo-1551462147-37885acc3c44?w=400' },
  ]);
  const [fotoPerfil, setFotoPerfil] = useState<string>(
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200'
  );

  const [periodoGrafico, setPeriodoGrafico] = useState<'semana' | 'mes' | 'ano'>('semana');

  const DADOS_GRAFICO = {
    semana: [
      { name: 'Seg', ganhos: 150 }, { name: 'Ter', ganhos: 230 }, { name: 'Qua', ganhos: 180 },
      { name: 'Qui', ganhos: 320 }, { name: 'Sex', ganhos: 450 }, { name: 'Sáb', ganhos: 600 }, { name: 'Dom', ganhos: 550 },
    ],
    mes: [
      { name: 'Sem 1', ganhos: 1200 }, { name: 'Sem 2', ganhos: 1500 },
      { name: 'Sem 3', ganhos: 1800 }, { name: 'Sem 4', ganhos: 2100 },
    ],
    ano: [
      { name: 'Jan', ganhos: 4500 }, { name: 'Fev', ganhos: 5200 }, { name: 'Mar', ganhos: 4800 },
      { name: 'Abr', ganhos: 6100 }, { name: 'Mai', ganhos: 7500 }, { name: 'Jun', ganhos: 6800 },
    ],
  };

  // ── Inicialização: dados do backend ────────────────────────────
  useEffect(() => {
    Promise.all([
      getMinhaLoja().catch(() => null),
      getMeusEnderecos().catch(() => []),
      getMeusCartoes().catch(() => []),
    ]).then(([loja, ends, cards]) => {
      setMinhaLoja(loja);
      setMeusEnderecos(ends);
      setMeusCartoes(cards);
    });
  }, []);

  useEffect(() => {
    if (usuario) setDadosUsuario((d) => ({ ...d, nome: usuario.nome, email: usuario.email }));
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
        success('Foto atualizada');
      } catch (err: any) {
        toastError(err.message || 'Erro ao salvar foto');
      }
    };
    reader.readAsDataURL(arquivo);
  };

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

  const salvarNovoEndereco = async () => {
    if (!novoEndereco.destinatario || !novoEndereco.cep || !novoEndereco.rua) {
      toastError('Preencha os campos obrigatórios.');
      return;
    }
    try {
      const criado = await criarEndereco({
        ...novoEndereco,
        principal: meusEnderecos.length === 0,
      });
      setMeusEnderecos([...meusEnderecos, criado]);
      setExibirFormEndereco(false);
      setNovoEndereco({ destinatario: '', telefone: '', cep: '', estadoCidade: '', bairro: '', rua: '', numero: '', complemento: '' });
      success('Endereço salvo!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar.');
    }
  };

  const removerEndereco = async (id: number) => {
    try {
      await deletarEndereco(id);
      setMeusEnderecos(meusEnderecos.filter((e) => e.id !== id));
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover.');
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
      setMeusCartoes([...meusCartoes, criado]);
      setExibirFormCartao(false);
      setNovoCartao({ numero: '', titular: '', validade: '', cvv: '' });
      success('Cartão adicionado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao adicionar.');
    }
  };

  const removerCartao = async (id: number) => {
    try {
      await deletarCartao(id);
      setMeusCartoes(meusCartoes.filter((c) => c.id !== id));
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover.');
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
    if (filtroFavoritos === 'barato') return a.preco - b.preco;
    if (filtroFavoritos === 'caro') return b.preco - a.preco;
    return 0;
  });

  // ── SUB-TELAS ──────────────────────────────────────────────────

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
              <p className="text-[11px] font-black text-[#394158] leading-tight">{prod.nome}</p>
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
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-50">
          <Filter size={14} className="text-[#55833d]" />
          <select value={filtroFavoritos} onChange={(e) => setFiltroFavoritos(e.target.value as any)} className="text-[9px] font-black uppercase bg-transparent outline-none cursor-pointer">
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
            <div key={prod.id} className="bg-white rounded-2xl p-3 shadow-md border border-white relative">
              <button onClick={() => setMeusFavoritos(meusFavoritos.filter(f => f.id !== prod.id))}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 shadow-md rounded-full text-red-400 hover:text-red-600 active:scale-90 transition-all">
                <HeartOff size={14} />
              </button>
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#F5F2ED] mb-3">
                <img src={prod.img} className="w-full h-full object-cover" alt={prod.nome} />
              </div>
              <p className="text-[11px] font-black text-[#394158] leading-tight px-1">{prod.nome}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderConfiguracoes = () => {
    switch (secaoConfig) {
      case 'conta':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
            <BackButton para={() => setSecaoConfig('menu')} label="Voltar" />
            <div className="px-2">
              <h3 className="text-xl font-black uppercase italic text-[#394158]">Conta e Segurança</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Salvos no servidor</p>
            </div>
            <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-5" onSubmit={(e) => { e.preventDefault(); salvarDadosConta(); }}>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Nome Completo</label>
                <input type="text" value={dadosUsuario.nome} onChange={(e) => setDadosUsuario({ ...dadosUsuario, nome: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">E-mail</label>
                <input type="email" value={dadosUsuario.email} onChange={(e) => setDadosUsuario({ ...dadosUsuario, email: e.target.value })} className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Telefone</label>
                <input type="text" value={dadosUsuario.telefone} onChange={(e) => setDadosUsuario({ ...dadosUsuario, telefone: e.target.value })} placeholder="(79) 99999-0000" className="w-full bg-[#F5F2ED]/50 border-2 border-transparent focus:border-[#55833d]/20 focus:bg-white p-4 rounded-2xl outline-none text-sm font-bold transition-all" />
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl space-y-3 border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Alterar Senha (opcional)</p>
                <input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="w-full bg-white border-2 border-transparent focus:border-[#55833d]/20 p-4 rounded-2xl outline-none text-sm font-bold transition-all" />
                <input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full bg-white border-2 border-transparent focus:border-[#55833d]/20 p-4 rounded-2xl outline-none text-sm font-bold transition-all" />
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
              <h3 className="text-xl font-black uppercase italic text-[#394158]">{exibirFormEndereco ? 'Novo Endereço' : 'Meus Endereços'}</h3>
            </div>
            {exibirFormEndereco ? (
              <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-4" onSubmit={(e) => { e.preventDefault(); salvarNovoEndereco(); }}>
                <input type="text" placeholder="Destinatário" value={novoEndereco.destinatario} onChange={(e) => setNovoEndereco({ ...novoEndereco, destinatario: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <input type="text" placeholder="Telefone" value={novoEndereco.telefone} onChange={(e) => setNovoEndereco({ ...novoEndereco, telefone: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <input type="text" placeholder="CEP" value={novoEndereco.cep} onChange={(e) => setNovoEndereco({ ...novoEndereco, cep: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <input type="text" placeholder="Estado - Cidade" value={novoEndereco.estadoCidade} onChange={(e) => setNovoEndereco({ ...novoEndereco, estadoCidade: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <input type="text" placeholder="Bairro" value={novoEndereco.bairro} onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Rua" value={novoEndereco.rua} onChange={(e) => setNovoEndereco({ ...novoEndereco, rua: e.target.value })} className="col-span-2 bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                  <input type="text" placeholder="Nº" value={novoEndereco.numero} onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })} className="bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                </div>
                <input type="text" placeholder="Complemento" value={novoEndereco.complemento} onChange={(e) => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <button type="submit" className="w-full bg-[#55833d] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Salvar Endereço</button>
              </form>
            ) : (
              <div className="space-y-4">
                {meusEnderecos.length > 0 ? meusEnderecos.map((end) => (
                  <div key={end.id} className="bg-white p-6 rounded-2xl border border-white shadow-sm flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-[#f9943b]">{end.destinatario} {end.principal && <span className="text-[#55833d]">• PRINCIPAL</span>}</p>
                      <p className="text-xs font-bold text-[#394158]">{end.rua}, {end.numero}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{end.bairro} • {end.estadoCidade}</p>
                      <p className="text-[10px] text-gray-400 font-bold">CEP: {end.cep}</p>
                    </div>
                    <button onClick={() => removerEndereco(end.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div className="bg-white p-12 rounded-2xl border-2 border-dashed text-center">
                    <MapPin size={32} className="text-[#802D44]/40 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase text-gray-400 mb-6">Nenhum endereço cadastrado</p>
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
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Somente últimos 4 dígitos salvos (PCI)</p>
            </div>
            {exibirFormCartao ? (
              <form className="bg-white rounded-2xl p-8 shadow-xl border border-white space-y-5" onSubmit={(e) => { e.preventDefault(); salvarNovoCartao(); }}>
                <input type="text" maxLength={19} placeholder="Número do Cartão" value={novoCartao.numero} onChange={(e) => setNovoCartao({ ...novoCartao, numero: e.target.value })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <input type="text" placeholder="Nome no Cartão" value={novoCartao.titular} onChange={(e) => setNovoCartao({ ...novoCartao, titular: e.target.value.toUpperCase() })} className="w-full bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/AA" value={novoCartao.validade} onChange={(e) => setNovoCartao({ ...novoCartao, validade: e.target.value })} className="bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                  <input type="text" placeholder="CVV" maxLength={4} value={novoCartao.cvv} onChange={(e) => setNovoCartao({ ...novoCartao, cvv: e.target.value })} className="bg-[#F5F2ED]/50 p-4 rounded-2xl outline-none text-sm font-bold" />
                </div>
                <button type="submit" className="w-full bg-[#f9943b] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Confirmar Cartão</button>
              </form>
            ) : (
              <div className="space-y-6">
                {meusCartoes.map((cartao) => (
                  <div key={cartao.id} className="bg-gradient-to-br from-[#394158] to-[#1a1f2c] p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start mb-12 relative z-10">
                      <CardIcon size={32} className="text-[#f9943b]" />
                      <button onClick={() => removerCartao(cartao.id)} className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full transition-all active:scale-90"><X size={18} /></button>
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

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black uppercase italic text-[#394158]">Seu Dashboard</h3>
            <p className="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Acompanhe seus resultados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#55833d] to-[#4ade80] rounded-2xl p-5 text-white shadow-lg">
            <p className="text-[10px] uppercase text-white/80 tracking-widest font-bold mb-1">Ganhos (Mês)</p>
            <h4 className="text-2xl font-black">R$ 6.600,00</h4>
          </div>
          <div className="bg-gradient-to-br from-[#f9943b] to-[#fbac66] rounded-2xl p-5 text-white shadow-lg">
            <p className="text-[10px] uppercase text-white/80 tracking-widest font-bold mb-1">Pedidos (Mês)</p>
            <h4 className="text-2xl font-black">142</h4>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase text-[#f9943b] tracking-widest font-bold mb-1">Taxa Conversão</span>
            <h4 className="text-xl font-black">18.5%</h4>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] uppercase text-[#394158] tracking-widest font-bold">Relatório de Ganhos</h4>
          <div className="flex bg-[#F5F2ED] rounded-full p-1">
            {(['semana', 'mes', 'ano'] as const).map(p => (
              <button key={p} onClick={() => setPeriodoGrafico(p)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${periodoGrafico === p ? 'bg-white shadow-sm text-[#55833d]' : 'text-gray-400'}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DADOS_GRAFICO[periodoGrafico]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(value) => `R$${value}`} />
              <Tooltip cursor={{ fill: '#F5F2ED' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="ganhos" fill="#55833d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const tituloPagina =
    telaAtual === 'configuracoes' ? 'Configurações' :
      telaAtual === 'favoritos' ? 'Meus Favoritos' :
        telaAtual === 'recentes' ? 'Visto Recentemente' :
          telaAtual === 'dashboard' ? 'Dashboard de Vendas' :
            'Meu Perfil';

  // Navegação contextual: subseção de config → menu config → perfil → vitrine
  const handleVoltarHeader = () => {
    if (telaAtual === 'configuracoes' && secaoConfig !== 'menu') {
      setSecaoConfig('menu');
      return;
    }
    if (telaAtual !== 'perfil') {
      setTelaAtual('perfil');
      return;
    }
    navigate('/vendedor');
  };

  const labelVoltarHeader =
    telaAtual === 'configuracoes' && secaoConfig !== 'menu' ? 'Configurações' :
      telaAtual === 'perfil' ? 'Vitrine' :
        'Perfil';

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-inter pb-24 md:pb-10">
      <input type="file" ref={fileInputRef} onChange={handleTrocarFoto} accept="image/*" className="hidden" />

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8 page-enter">
        <PageHeader
          titulo={tituloPagina}
          subtitulo={telaAtual === 'perfil' && minhaLoja ? minhaLoja.nomeLoja : undefined}
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
          telaAtual === 'favoritos' ? renderFavoritos() :
            telaAtual === 'recentes' ? renderVistoRecentemente() :
              telaAtual === 'dashboard' ? renderDashboard() : (
                <div className="space-y-6">
                  <ProfileHero
                    variant="vendedor"
                    fotoUrl={fotoPerfil}
                    nome={usuario?.nome || dadosUsuario.nome}
                    subtitulo={minhaLoja?.nomeLoja ? `Loja: ${minhaLoja.nomeLoja}` : 'Sem loja cadastrada ainda'}
                    onTrocarFoto={() => fileInputRef.current?.click()}
                    badge={
                      minhaLoja
                        ? (minhaLoja.suspensa
                          ? <StatusBadge variant="suspensa" />
                          : minhaLoja.verificada
                            ? <StatusBadge variant="verificada" label="Loja Verificada" />
                            : <StatusBadge variant="pendente" />)
                        : <StatusBadge variant="inativa" label="Crie sua loja" />
                    }
                    cta={
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => navigate('/painelvendedor')}
                        iconLeft={<LayoutDashboard size={16} />}
                        className="!bg-white !text-[#394158] hover:!bg-white/90"
                      >
                        Ir para o Painel
                      </Button>
                    }
                  />

                  {minhaLoja && !minhaLoja.verificada && !minhaLoja.suspensa && (
                    <div className="bg-[#f9943b]/10 border border-[#f9943b]/30 rounded-2xl p-4 flex items-start gap-3 page-enter">
                      <AlertTriangle size={20} className="text-[#f9943b] shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-[#394158] leading-relaxed">
                        Sua loja está <strong>aguardando verificação do admin</strong>. Os produtos só aparecerão na vitrine pública após a aprovação.
                      </p>
                    </div>
                  )}

                  <section className="bg-white rounded-2xl p-8 shadow-xl border border-white">
                    <div className="flex justify-between items-center mb-6 px-2">
                      <h4 className="uppercase tracking-[0.2em] text-gray-400 text-[11px] font-bold">Meu Negócio</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div onClick={() => setTelaAtual('dashboard')} className="flex flex-col items-center gap-3 group cursor-pointer active:scale-90 transition-all">
                        <div className="w-14 h-14 bg-[#55833d]/10 rounded-2xl flex items-center justify-center text-[#55833d] group-hover:bg-[#55833d] group-hover:text-white transition-all duration-300 shadow-sm"><BarChart2 size={22} /></div>
                        <span className="text-[11px] uppercase font-bold text-center tracking-tighter">Dashboard<br />de Vendas</span>
                      </div>
                      <div onClick={() => navigate('/painelvendedor')} className="flex flex-col items-center gap-3 group cursor-pointer active:scale-90 transition-all">
                        <div className="w-14 h-14 bg-[#f9943b]/10 rounded-2xl flex items-center justify-center text-[#f9943b] group-hover:bg-[#f9943b] group-hover:text-white transition-all duration-300 shadow-sm"><Store size={22} /></div>
                        <span className="text-[11px] uppercase font-bold text-center tracking-tighter">Minha<br />Loja</span>
                      </div>
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
                          <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Visto<br />Recentemente</span>
                        </button>
                      </div>
                      <div className="flex justify-center w-full py-4 md:py-0">
                        <button className="flex flex-col items-center justify-center p-4 hover:bg-[#F5F2ED] rounded-2xl active:scale-[0.98] group transition-all w-full md:w-32 gap-3 text-center">
                          <div className="text-[#f9943b] group-hover:scale-110 transition-transform"><HelpCircle size={24} /></div>
                          <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Ajuda e<br />Suporte</span>
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}
      </main>

      <BottomTabBar
        tabs={[
          { to: '/vendedor', label: 'Vitrine', Icon: HomeIcon },
          { to: '/painelvendedor', label: 'Painel', Icon: LayoutDashboard },
          { to: '/receitasvendedor', label: 'Receitas', Icon: BookOpen },
          { to: '/chat', label: 'Chat', Icon: MessageCircle },
          { to: '/perfilvendedor', label: 'Perfil', Icon: User },
        ]}
      />
    </div>
  );
}
