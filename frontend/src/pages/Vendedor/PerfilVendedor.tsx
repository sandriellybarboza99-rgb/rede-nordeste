import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, LogOut, MapPin, CreditCard,
  Home as HomeIcon, MessageCircle, Trash2, Store, PlusCircle, QrCode, Save,
  LayoutDashboard, BookOpen,
} from 'lucide-react';
import {
  getMinhaLoja, atualizarLoja, atualizarMeuPerfil,
  getMeusEnderecos, criarEndereco, deletarEndereco,
  getMeusCartoes, criarCartao, deletarCartao,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { BottomTabBar } from '../../components/ui/BottomTabBar';

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

  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'pix' | 'enderecos' | 'cartoes'>('perfil');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Dados da Loja / PIX
  const [loja, setLoja] = useState<any>(null);
  const [nomeLoja, setNomeLoja] = useState('');
  const [descricaoBio, setDescricaoBio] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SE');
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('CPF');

  // Dados do Usuário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  // Endereços e Cartões
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);

  // Modais
  const [modalNovoEndereco, setModalNovoEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({
    destinatario: '',
    telefone: '',
    cep: '',
    estadoCidade: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
  });

  const [modalNovoCartao, setModalNovoCartao] = useState(false);
  const [novoCartao, setNovoCartao] = useState({
    numero: '',
    titular: '',
    validade: '',
    cvv: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const [lojaRes, endRes, cartaoRes] = await Promise.all([
          getMinhaLoja().catch(() => null),
          getMeusEnderecos().catch(() => []),
          getMeusCartoes().catch(() => []),
        ]);

        if (lojaRes) {
          setLoja(lojaRes);
          setNomeLoja(lojaRes.nomeLoja || '');
          setDescricaoBio(lojaRes.descricaoBio || '');
          setCidade(lojaRes.cidade || '');
          setEstado(lojaRes.estado || 'SE');
          setChavePix(lojaRes.chavePix || '');
          setTipoChavePix(lojaRes.tipoChavePix || 'CPF');
        }

        if (usuario) {
          // Correção do erro de TS usando a propriedade 'nome' de UsuarioLogado
          setNomeCompleto(usuario.nome || '');
          setEmail(usuario.email || '');
          setTelefone(usuario.telefone || '');
        }

        if (Array.isArray(endRes)) setEnderecos(endRes);
        if (Array.isArray(cartaoRes)) setCartoes(cartaoRes);
      } catch (err: any) {
        toastError(err.message || 'Erro ao carregar dados do vendedor.');
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [usuario]);

  // Salvar PIX e Dados da Loja
  const handleSalvarLojaEPix = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const atualizado = await atualizarLoja({
        nomeLoja,
        descricaoBio,
        cidade,
        estado,
        chavePix,
        tipoChavePix,
      });
      setLoja(atualizado);
      success('Dados do PIX e da Loja atualizados com sucesso!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar dados do PIX.');
    } finally {
      setSalvando(false);
    }
  };

  // Salvar Perfil do Usuário
  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await atualizarMeuPerfil({
        nomeCompleto,
        email,
        telefone,
      });
      success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  };

  // Criar Endereço
  const handleSalvarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const criado = await criarEndereco({
        ...novoEndereco,
        principal: enderecos.length === 0,
      });
      setEnderecos((prev) => [...prev, criado]);
      setModalNovoEndereco(false);
      setNovoEndereco({
        destinatario: '',
        telefone: '',
        cep: '',
        estadoCidade: '',
        bairro: '',
        rua: '',
        numero: '',
        complemento: '',
      });
      success('Endereço cadastrado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar endereço.');
    }
  };

  const handleDeletarEndereco = async (id: number) => {
    try {
      await deletarEndereco(id);
      setEnderecos((prev) => prev.filter((e) => e.id !== id));
      success('Endereço removido!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover endereço.');
    }
  };

  // Criar Cartão
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
      setModalNovoCartao(false);
      setNovoCartao({ numero: '', titular: '', validade: '', cvv: '' });
      success('Cartão cadastrado!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao salvar cartão.');
    }
  };

  const handleDeletarCartao = async (id: number) => {
    try {
      await deletarCartao(id);
      setCartoes((prev) => prev.filter((c) => c.id !== id));
      success('Cartão removido!');
    } catch (err: any) {
      toastError(err.message || 'Erro ao remover cartão.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-sand text-primary-earth pb-24">
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        <PageHeader
          titulo="Perfil do Vendedor"
          subtitulo="Gerencie sua loja, dados para recebimento (PIX) e conta"
          voltarPara={() => navigate('/home2')}
        />
        {/* CABEÇALHO DO PRODUTOR */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-accent-red/10 text-accent-red rounded-2xl flex items-center justify-center font-black text-2xl border border-accent-red/20 shrink-0">
            {loja?.nomeLoja ? loja.nomeLoja.charAt(0).toUpperCase() : <Store size={36} />}
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-xl font-black text-primary-earth">{loja?.nomeLoja || 'Sua Loja'}</h2>
            <p className="text-xs text-gray-500 font-bold">{usuario?.nome || 'Produtor(a)'}</p>
            <p className="text-[11px] text-accent-red font-bold">
              {loja?.chavePix ? `PIX Configurado (${loja.tipoChavePix})` : '⚠️ PIX pendente de configuração'}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setAbaAtiva('perfil')}
            className={`flex-1 min-w-25 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${abaAtiva === 'perfil' ? 'bg-accent-red text-white shadow-sm' : 'text-gray-400 hover:text-primary-earth'
              }`}
          >
            <User size={16} /> Loja & Perfil
          </button>

          <button
            onClick={() => setAbaAtiva('pix')}
            className={`flex-1 min-w-25 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${abaAtiva === 'pix' ? 'bg-accent-red text-white shadow-sm' : 'text-gray-400 hover:text-primary-earth'
              }`}
          >
            <QrCode size={16} /> Configurar PIX
          </button>

          <button
            onClick={() => setAbaAtiva('enderecos')}
            className={`flex-1 min-w-25 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${abaAtiva === 'enderecos' ? 'bg-accent-red text-white shadow-sm' : 'text-gray-400 hover:text-primary-earth'
              }`}
          >
            <MapPin size={16} /> Endereços
          </button>

          <button
            onClick={() => setAbaAtiva('cartoes')}
            className={`flex-1 min-w-25 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${abaAtiva === 'cartoes' ? 'bg-accent-red text-white shadow-sm' : 'text-gray-400 hover:text-primary-earth'
              }`}
          >
            <CreditCard size={16} /> Cartões
          </button>
        </div>

        {/* ABA 1: CONFIGURAÇÃO DO PIX DA LOJA */}
        {abaAtiva === 'pix' && (
          <form onSubmit={handleSalvarLojaEPix} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary-earth flex items-center gap-2">
                <QrCode size={18} className="text-accent-red" /> Recebimento via PIX
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                A chave PIX cadastrada aqui será utilizada para gerar os pagamentos dos clientes diretamente para sua conta.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tipo da Chave PIX</label>
                <select
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value)}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1 text-primary-earth"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="TELEFONE">Celular / Telefone</option>
                  <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Chave PIX</label>
                <input
                  type="text"
                  required
                  placeholder={
                    tipoChavePix === 'CPF' ? '000.000.000-00' :
                      tipoChavePix === 'CNPJ' ? '00.000.000/0001-00' :
                        tipoChavePix === 'EMAIL' ? 'seuemail@exemplo.com' :
                          tipoChavePix === 'TELEFONE' ? '(79) 99999-9999' :
                            'Cole aqui sua chave aleatória'
                  }
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-accent-red hover:bg-[#436830] text-white py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Chave PIX'}
              </button>
            </div>
          </form>
        )}

        {/* ABA 2: DADOS DA LOJA E PERFIL */}
        {abaAtiva === 'perfil' && (
          <div className="space-y-6">
            {/* DADOS DA LOJA */}
            <form onSubmit={handleSalvarLojaEPix} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary-earth flex items-center gap-2">
                <Store size={18} className="text-accent-red" /> Informações da Loja
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Nome da Loja</label>
                  <input
                    type="text"
                    required
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Descrição / Biografia da Loja</label>
                  <textarea
                    rows={3}
                    value={descricaoBio}
                    onChange={(e) => setDescricaoBio(e.target.value)}
                    className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Cidade</label>
                    <input
                      type="text"
                      required
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Estado</label>
                    <input
                      type="text"
                      maxLength={2}
                      required
                      value={estado}
                      onChange={(e) => setEstado(e.target.value.toUpperCase())}
                      className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1 text-center"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-accent-red hover:bg-[#436830] text-white py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md"
              >
                {salvando ? 'Salvando...' : 'Salvar Dados da Loja'}
              </button>
            </form>

            {/* DADOS PESSOAIS DO USUÁRIO */}
            <form onSubmit={handleSalvarPerfil} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary-earth flex items-center gap-2">
                <User size={18} className="text-accent-red" /> Dados Pessoais do Vendedor
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">E-mail</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Telefone</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none mt-1"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-primary-earth hover:bg-[#2c3346] text-white py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all"
              >
                {salvando ? 'Salvando...' : 'Salvar Perfil Pessoal'}
              </button>
            </form>
          </div>
        )}

        {/* ABA 3: ENDEREÇOS */}
        {abaAtiva === 'enderecos' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary-earth">Meus Endereços Cadastrados</h3>
              <button
                onClick={() => setModalNovoEndereco(true)}
                className="text-xs font-bold text-accent-red flex items-center gap-1 hover:underline"
              >
                <PlusCircle size={14} /> + Adicionar
              </button>
            </div>

            {enderecos.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhum endereço cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {enderecos.map((end) => (
                  <div key={end.id} className="p-4 rounded-2xl border border-gray-100 flex items-start justify-between gap-3 bg-gray-50/50">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-accent-red shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-primary-earth">{end.destinatario}</p>
                        <p className="text-[11px] text-gray-500">{end.rua}, {end.numero} - {end.bairro}</p>
                        <p className="text-[10px] text-gray-400">{end.estadoCidade} | CEP: {end.cep}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletarEndereco(end.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 4: CARTÕES */}
        {abaAtiva === 'cartoes' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary-earth">Cartões Salvos</h3>
              <button
                onClick={() => setModalNovoCartao(true)}
                className="text-xs font-bold text-accent-red flex items-center gap-1 hover:underline"
              >
                <PlusCircle size={14} /> + Adicionar
              </button>
            </div>

            {cartoes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhum cartão cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {cartoes.map((car) => (
                  <div key={car.id} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-accent-red shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-primary-earth uppercase">{car.bandeira} •••• {car.finalCartao}</p>
                        <p className="text-[10px] text-gray-400">{car.titular} | Validade: {car.validade}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletarCartao(car.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL ADICIONAR ENDEREÇO */}
      {modalNovoEndereco && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black uppercase text-primary-earth">Novo Endereço</h3>
            <form onSubmit={handleSalvarEndereco} className="space-y-3">
              <input
                type="text"
                placeholder="Destinatário"
                required
                value={novoEndereco.destinatario}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, destinatario: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="CEP"
                required
                value={novoEndereco.cep}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, cep: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="Estado - Cidade"
                required
                value={novoEndereco.estadoCidade}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, estadoCidade: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="Bairro"
                required
                value={novoEndereco.bairro}
                onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Rua"
                  required
                  value={novoEndereco.rua}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, rua: e.target.value })}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
                />
                <input
                  type="text"
                  placeholder="Número"
                  required
                  value={novoEndereco.numero}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoEndereco(false)}
                  className="w-1/2 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-accent-red text-white rounded-full font-bold text-xs uppercase shadow-md"
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
            <h3 className="text-base font-black uppercase text-primary-earth">Novo Cartão</h3>
            <form onSubmit={handleSalvarCartao} className="space-y-3">
              <input
                type="text"
                placeholder="Nome Impresso no Cartão"
                required
                value={novoCartao.titular}
                onChange={(e) => setNovoCartao({ ...novoCartao, titular: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="Número do Cartão"
                required
                value={novoCartao.numero}
                onChange={(e) => setNovoCartao({ ...novoCartao, numero: e.target.value })}
                className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Validade (MM/AA)"
                  required
                  value={novoCartao.validade}
                  onChange={(e) => setNovoCartao({ ...novoCartao, validade: e.target.value })}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  required
                  maxLength={4}
                  value={novoCartao.cvv}
                  onChange={(e) => setNovoCartao({ ...novoCartao, cvv: e.target.value })}
                  className="w-full bg-bg-sand p-3 rounded-xl text-xs font-bold outline-none"
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
                  className="w-1/2 py-3 bg-accent-red text-white rounded-full font-bold text-xs uppercase shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomTabBar
        tabs={[
          { to: '/home2', label: 'Vitrine', Icon: HomeIcon },
          { to: '/painelvendedor', label: 'Painel', Icon: LayoutDashboard },
          { to: '/receitas', label: 'Receitas', Icon: BookOpen },
          { to: '/chat', label: 'Chat', Icon: MessageCircle },
          { to: '/perfilvendedor', label: 'Perfil', Icon: User },
        ]}
      />
    </div>
  );
}