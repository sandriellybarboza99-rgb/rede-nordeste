import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Package, DollarSign, ShoppingBag, Store,
  Edit2, Trash2, Image as ImageIcon, CheckCircle,
  AlertTriangle, Home as HomeIcon, LayoutDashboard,
  MessageCircle, User, BookOpen, ShieldOff, MapPin
} from 'lucide-react';
import {
  getMinhaLoja, criarLoja, atualizarLoja,
  getProdutosPorLoja, criarProduto, atualizarProduto, deletarProduto,
  getCategorias, getPedidosDaLoja, atualizarStatusEntrega,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UserMenu } from '../../components/ui/UserMenu';
import { Navbar } from '../../components/ui/Navbar';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { ModalLoja } from '../../components/modals/ModalLoja';

type Aba = 'dashboard' | 'produtos' | 'pedidos';

export default function PainelVendedor() {
  const { success, error: toastError } = useToast();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard');

  // ── Loja ──────────────────────────────────────────────────────
  const [loja, setLoja] = useState<any>(null);
  const [carregandoLoja, setCarregandoLoja] = useState(true);
  const [modalLoja, setModalLoja] = useState(false);

  // ── Produtos ──────────────────────────────────────────────────
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [modalProduto, setModalProduto] = useState(false);
  const [formProduto, setFormProduto] = useState<any>({
    id: null, nome: '', descricao: '', precoAtual: '', unidadeMedida: 'kg',
    estoqueAtual: 0, pesoKg: 0.5, imagemUrl: '', categoriaId: null,
  });
  const [confirmarDelete, setConfirmarDelete] = useState<{ aberto: boolean; id: number | null }>({ aberto: false, id: null });

  // ── Pedidos ───────────────────────────────────────────────────
  const [pedidos, setPedidos] = useState<any[]>([]);

  // ── Boot: tenta carregar loja do usuário ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const minhaLoja = await getMinhaLoja();
        setLoja(minhaLoja);
      } catch {
        setLoja(null); // sem loja
      } finally {
        setCarregandoLoja(false);
      }

      try {
        setCategorias(await getCategorias());
      } catch {
        setCategorias([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Carrega produtos e pedidos quando trocar de aba ───────────
  useEffect(() => {
    if (!loja) return;
    if (abaAtiva === 'produtos' || abaAtiva === 'dashboard') carregarProdutos();
    if (abaAtiva === 'pedidos' || abaAtiva === 'dashboard') carregarPedidos();
  }, [abaAtiva, loja]);

  const carregarProdutos = async () => {
    if (!loja?.id) return;
    try {
      const data = await getProdutosPorLoja(loja.id);
      setProdutos(data.content || []);
    } catch {
      setProdutos([]);
    }
  };

  const carregarPedidos = async () => {
    try {
      const data = await getPedidosDaLoja();
      setPedidos(data.content || []);
    } catch {
      setPedidos([]);
    }
  };

  // ── Máscara de preço em Reais ──────────────────────────────────
  const maskPreco = (value: string): string => {
    // Remove tudo que não é dígito
    let digits = value.replace(/\D/g, '');
    if (!digits) return '';
    // Converte para centavos → reais com 2 decimais
    const num = (parseInt(digits, 10) / 100).toFixed(2);
    // Formata: 1234.56 → 1.234,56
    const [inteiro, decimal] = num.split('.');
    const inteiroFormatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${inteiroFormatado},${decimal}`;
  };

  const parsePrecoBR = (valor: string): number => {
    if (!valor) return 0;
    // Remove pontos de milhar e troca vírgula por ponto
    return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const formatPrecoParaInput = (valor: number | string): string => {
    const num = Number(valor);
    if (!num && num !== 0) return '';
    return num.toFixed(2).replace('.', ',');
  };

  const lerImagemBase64 = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError('Imagem muito grande (máx 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Salvar loja (cria ou atualiza) ────────────────────────────
  const salvarLoja = async (dadosLoja: any) => {
    try {
      const dadosCorrigidos = {
        ...dadosLoja,
        cep: dadosLoja.cep ? dadosLoja.cep.replace(/\D/g, '') : null,
        valorMinimoPedido: Number(dadosLoja.valorMinimoPedido || 0),
        taxaEntregaFixa: Number(dadosLoja.taxaEntregaFixa || 0),
      };
      const salva = loja
        ? await atualizarLoja(dadosCorrigidos)
        : await criarLoja(dadosCorrigidos);
      setLoja(salva);
      setModalLoja(false);
      success(loja ? 'Loja atualizada' : 'Loja criada! Aguarde a verificação do admin');
    } catch (err: any) {
      toastError(err?.message || 'Erro ao salvar loja');
      throw err;
    }
  };

  // ── Salvar produto ────────────────────────────────────────────
  const salvarProduto = async () => {
    if (!formProduto.nome || !formProduto.categoriaId || !formProduto.precoAtual) {
      toastError('Nome, categoria e preço são obrigatórios');
      return;
    }
    try {
      const dados = {
        nome: formProduto.nome,
        descricao: formProduto.descricao,
        precoAtual: parsePrecoBR(String(formProduto.precoAtual)),
        unidadeMedida: formProduto.unidadeMedida,
        estoqueAtual: Number(formProduto.estoqueAtual || 0),
        pesoKg: Number(formProduto.pesoKg || 0.5),
        imagemUrl: formProduto.imagemUrl,
        categoriaId: Number(formProduto.categoriaId),
      };
      if (formProduto.id) {
        await atualizarProduto(formProduto.id, dados);
        success('Produto atualizado');
      } else {
        await criarProduto(dados);
        success('Produto cadastrado e disponível na vitrine');
      }
      setModalProduto(false);
      carregarProdutos();
    } catch (err: any) {
      toastError(err?.message || 'Erro ao salvar produto');
    }
  };

  const abrirNovoProduto = () => {
    setFormProduto({
      id: null, nome: '', descricao: '', precoAtual: '', unidadeMedida: 'kg',
      estoqueAtual: 0, pesoKg: 0.5, imagemUrl: '',
      categoriaId: categorias[0]?.id ?? null,
    });
    setModalProduto(true);
  };

  const abrirEditarProduto = (p: any) => {
    setFormProduto({
      id: p.id, nome: p.nome, descricao: p.descricao,
      precoAtual: formatPrecoParaInput(p.precoAtual), unidadeMedida: p.unidadeMedida,
      estoqueAtual: p.estoqueAtual, pesoKg: p.pesoKg,
      imagemUrl: p.imagemUrl, categoriaId: p.categoriaId ?? categorias[0]?.id,
    });
    setModalProduto(true);
  };

  const handleDeletarProduto = async (id: number) => {
    try {
      await deletarProduto(id);
      success('Produto removido');
      setConfirmarDelete({ aberto: false, id: null });
      carregarProdutos();
    } catch (err: any) {
      toastError(err?.message || 'Erro ao remover produto');
    }
  };

  const avancarStatusPedido = async (pedidoId: number, novoStatus: string) => {
    if (!novoStatus) return;
    try {
      await atualizarStatusEntrega(pedidoId, novoStatus);
      success(`Pedido atualizado para ${novoStatus}`);
      carregarPedidos();
    } catch (err: any) {
      toastError(err?.message || 'Erro ao atualizar status');
    }
  };

  // ── ONBOARDING: vendedor sem loja → wizard obrigatório ────────
  if (carregandoLoja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED]">
        <div className="w-12 h-12 border-4 border-[#55833d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] font-sans antialiased flex flex-col">
        <Navbar rotaAtiva="/painelvendedor" />
        <PageHeader
          titulo="Bem-vindo, vendedor"
          subtitulo="Primeiro passo: criar sua loja"
          voltarPara="/home2"
          labelVoltar="Vitrine"
          acoesDireita={<UserMenu perfilPath="/perfilvendedor" />}
        />
        <main className="flex-1 flex items-center justify-center p-6 pb-20 md:pb-6 page-enter">
          <Card padding="lg" className="max-w-md w-full text-center space-y-4">
            <div className="w-20 h-20 bg-[#55833d]/10 text-[#55833d] rounded-full flex items-center justify-center mx-auto">
              <Store size={36} />
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic text-[#394158]">Crie sua loja</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Para começar a vender no Rede Nordeste, você precisa criar e ter sua loja verificada por um administrador.
            </p>
            <Button fullWidth size="lg" onClick={() => setModalLoja(true)} iconLeft={<Plus size={18} />}>
              Criar minha loja agora
            </Button>
          </Card>
        </main>
        <ModalLoja open={modalLoja} onClose={() => setModalLoja(false)} lojaAtual={loja} onSave={salvarLoja} />
      </div>
    );
  }

  // ── Aviso quando loja não está verificada ─────────────────────
  const lojaNaoVerificada = !loja.verificada || loja.suspensa;

  // ────────────────────────────────────────────────────────────────
  // PAINEL PRINCIPAL
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans antialiased pb-20 md:pb-0">
      <Navbar rotaAtiva="/painelvendedor" />
      <main className="px-4 md:px-12 pt-6 md:pt-8 page-enter">
        <PageHeader
          titulo={loja.nomeLoja}
          subtitulo={`${loja.cidade ?? ''}${loja.estado ? ' · ' + loja.estado : ''}`}
          voltarPara="/home2"
          labelVoltar="Vitrine"
          acoesDireita={<UserMenu perfilPath="/perfilvendedor" />}
        />
        {/* Aviso de loja não verificada */}
        {lojaNaoVerificada && (
          <div className="bg-[#f9943b]/10 border border-[#f9943b]/20 rounded-2xl px-4 py-3 flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-[#f9943b] shrink-0" />
            <p className="text-xs font-bold text-[#394158]">
              {loja.suspensa
                ? `Loja suspensa${loja.motivoSuspensao ? `: ${loja.motivoSuspensao}` : ''}.`
                : 'Sua loja está aguardando verificação do admin. Seus produtos só aparecem na vitrine após aprovação.'}
            </p>
          </div>
        )}

        {/* Tabs desktop */}
        <nav className="hidden md:flex gap-1 px-12 pt-6 border-b border-gray-100 bg-white">
          {([
            { id: 'dashboard', label: 'Visão geral', Icon: LayoutDashboard },
            { id: 'produtos', label: 'Produtos', Icon: Package },
            { id: 'pedidos', label: 'Pedidos', Icon: ShoppingBag },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setAbaAtiva(t.id as Aba)}
              className={`px-6 py-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${abaAtiva === t.id
                ? 'border-[#55833d] text-[#55833d]'
                : 'border-transparent text-[#394158]/50 hover:text-[#394158]'
                }`}
            >
              <t.Icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        {/* Tabs mobile (pills) */}
        <nav className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
          {([
            { id: 'dashboard', label: 'Visão' },
            { id: 'produtos', label: 'Produtos' },
            { id: 'pedidos', label: 'Pedidos' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setAbaAtiva(t.id as Aba)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${abaAtiva === t.id ? 'bg-[#55833d] text-white' : 'bg-gray-100 text-[#394158]'
                }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="py-4 md:py-6 space-y-6">
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card padding="md" className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 truncate">Produtos</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-[#394158]">{produtos.length}</h3>
                  </div>
                  <Package className="text-[#55833d] shrink-0" size={24} />
                </Card>
                <Card padding="md" className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 truncate">Pedidos</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-[#394158]">{pedidos.length}</h3>
                  </div>
                  <ShoppingBag className="text-[#f9943b] shrink-0" size={24} />
                </Card>
                <Card padding="md" className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 truncate">Faturado</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-[#55833d]">
                      R$ {pedidos.reduce((s, p) => s + Number(p.valorTotal || 0), 0).toFixed(0)}
                    </h3>
                  </div>
                  <DollarSign className="text-[#55833d] shrink-0" size={24} />
                </Card>
                <Card padding="md" className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 truncate">Status</p>
                    <h3 className={`text-[10px] md:text-xs font-black italic ${loja.verificada ? 'text-[#55833d]' : 'text-[#f9943b]'}`}>
                      {loja.verificada ? 'Verificada' : 'Pendente'}
                    </h3>
                  </div>
                  {loja.verificada
                    ? <CheckCircle className="text-[#55833d] shrink-0" size={24} />
                    : <ShieldOff className="text-[#f9943b] shrink-0" size={24} />}
                </Card>
              </section>

              <Card padding="md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm md:text-base font-black uppercase italic text-[#394158]">Últimos pedidos</h3>
                  <Link to="#" onClick={(e) => { e.preventDefault(); setAbaAtiva('pedidos'); }}
                    className="text-[10px] font-black uppercase text-[#55833d] hover:underline">Ver todos</Link>
                </div>
                {pedidos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Nenhum pedido ainda</p>
                ) : (
                  <div className="space-y-2">
                    {pedidos.slice(0, 3).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#394158]">#{p.id}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{p.statusEntrega || '—'}</p>
                        </div>
                        <p className="text-sm font-black text-[#55833d]">R$ {Number(p.valorTotal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* PRODUTOS */}
          {abaAtiva === 'produtos' && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-base md:text-xl font-black uppercase italic text-[#394158]">Meus produtos</h2>
                <Button onClick={abrirNovoProduto} iconLeft={<Plus size={16} />}>Adicionar</Button>
              </div>
              {produtos.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <Package className="text-gray-300 mx-auto mb-3" size={40} />
                  <p className="text-sm text-gray-400">Você ainda não tem produtos. Cadastre o primeiro!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {produtos.map(p => (
                    <Card key={p.id} padding="sm" className="flex flex-col">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                        {p.imagemUrl
                          ? <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon /></div>}
                      </div>
                      <h3 className="text-xs font-black uppercase text-[#394158] line-clamp-2 mb-1">{p.nome}</h3>
                      <p className="text-[10px] font-bold text-gray-400">{p.nomeCategoria}</p>
                      <p className="text-sm font-black text-[#55833d] mt-1">R$ {Number(p.precoAtual).toFixed(2)}/{p.unidadeMedida}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">Estoque: {p.estoqueAtual}</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => abrirEditarProduto(p)}
                          className="flex-1 p-2 bg-[#F5F2ED] text-[#394158] hover:bg-[#f9943b] hover:text-white rounded-lg transition-colors">
                          <Edit2 size={12} className="mx-auto" />
                        </button>
                        <button onClick={() => setConfirmarDelete({ aberto: true, id: p.id })}
                          className="flex-1 p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PEDIDOS */}
          {abaAtiva === 'pedidos' && (
            <>
              <h2 className="text-base md:text-xl font-black uppercase italic text-[#394158]">Pedidos recebidos</h2>
              {pedidos.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <ShoppingBag className="text-gray-300 mx-auto mb-3" size={40} />
                  <p className="text-sm text-gray-400">Nenhum pedido ainda</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pedidos.map(p => (
                    <Card key={p.id} padding="md" className="flex flex-col gap-4">
                      {/* HEADER DO PEDIDO */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-black uppercase text-[#394158]">Pedido #{p.id}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-md">
                              {p.statusPagamento || '—'}
                            </span>
                            <span className="text-[10px] font-bold text-[#55833d] uppercase bg-[#55833d]/10 px-2 py-0.5 rounded-md">
                              {p.itens?.length || 0} itens
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                          <span className="text-base font-black text-[#55833d] md:mr-3">R$ {Number(p.valorTotal).toFixed(2)}</span>
                          <select
                            value={p.statusEntrega || 'PEDIDO_RECEBIDO'}
                            onChange={(e) => avancarStatusPedido(p.id, e.target.value)}
                            className="bg-[#55833d] text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg outline-none cursor-pointer hover:bg-[#436830] transition-colors appearance-none text-center shadow-sm"
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="PEDIDO_RECEBIDO">Pedido Recebido</option>
                            <option value="AGUARDANDO_ENTREGADOR">Aguardando Entregador</option>
                            <option value="ENTREGADOR_ACEITOU">Entregador Aceitou</option>
                            <option value="PEDIDO_EM_COLETA">Em Coleta / Embalando</option>
                            <option value="SAIU_PARA_ENTREGA">Saiu para Entrega</option>
                            <option value="RETIRADA_DISPONIVEL">Pronto para Retirada</option>
                            <option value="ENTREGUE">Entregue</option>
                            <option value="CANCELADO">Cancelado</option>
                          </select>
                        </div>
                      </div>

                      {/* INFORMAÇÕES DO CLIENTE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-start gap-2 text-gray-600">
                          <User size={14} className="mt-0.5 text-[#f9943b] shrink-0" />
                          <div>
                            <p className="font-bold uppercase text-[10px] text-gray-400 tracking-wider">Comprador</p>
                            <p className="font-black text-[#394158] uppercase">{p.nomeComprador || 'Cliente não identificado'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin size={14} className="mt-0.5 text-[#f9943b] shrink-0" />
                          <div>
                            <p className="font-bold uppercase text-[10px] text-gray-400 tracking-wider">Entrega / Retirada</p>
                            <p className="font-black text-[#394158]">{p.enderecoEntrega || 'RETIRADA NA LOJA'}</p>
                          </div>
                        </div>
                      </div>

                      {/* LISTA DE PRODUTOS */}
                      <div className="bg-[#F5F2ED] rounded-xl p-3 space-y-2">
                        <p className="font-black uppercase text-[10px] text-[#394158] tracking-widest mb-2">Produtos do Pedido</p>
                        {p.itens?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs border-b border-gray-200/50 last:border-0 pb-2 last:pb-0">
                            <span className="font-bold text-gray-600">
                              <span className="text-[#55833d] mr-1">{item.quantidade}x</span>
                              {item.nomeProduto}
                            </span>
                            <span className="font-black text-[#394158]">R$ {Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <ModalLoja open={modalLoja} onClose={() => setModalLoja(false)} lojaAtual={loja} onSave={salvarLoja} />

      <Modal open={modalProduto} onClose={() => setModalProduto(false)}
        title={formProduto.id ? 'Editar produto' : 'Novo produto'} size="lg">
        <div className="space-y-4">
          <FormField label="Nome" value={formProduto.nome}
            onChange={e => setFormProduto({ ...formProduto, nome: e.target.value })} />
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Categoria</label>
            <select value={formProduto.categoriaId ?? ''}
              onChange={e => setFormProduto({ ...formProduto, categoriaId: Number(e.target.value) })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]">
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Preço (R$)" type="text" inputMode="numeric" placeholder="0,00" value={formProduto.precoAtual}
              onChange={e => setFormProduto({ ...formProduto, precoAtual: maskPreco(e.target.value) })} />
            <FormField label="Unidade" value={formProduto.unidadeMedida}
              onChange={e => setFormProduto({ ...formProduto, unidadeMedida: e.target.value })} />
            <FormField label="Estoque" type="number" value={formProduto.estoqueAtual}
              onChange={e => setFormProduto({ ...formProduto, estoqueAtual: e.target.value })} />
            <FormField label="Peso (kg)" type="number" step="0.01" value={formProduto.pesoKg}
              onChange={e => setFormProduto({ ...formProduto, pesoKg: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Descrição</label>
            <textarea rows={3} value={formProduto.descricao}
              onChange={e => setFormProduto({ ...formProduto, descricao: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Imagem</label>
            <label className="w-full p-3 bg-[#F5F2ED]/50 text-gray-400 font-bold rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f9943b] flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon size={18} /> {formProduto.imagemUrl ? 'Selecionada ✓' : 'Escolher imagem'}
              <input type="file" className="hidden" accept="image/*"
                onChange={e => lerImagemBase64(e, url => setFormProduto({ ...formProduto, imagemUrl: url }))} />
            </label>
            {formProduto.imagemUrl && <img src={formProduto.imagemUrl} className="mt-3 w-full h-32 object-cover rounded-xl" alt="preview" />}
          </div>
          <Button onClick={salvarProduto} fullWidth size="lg" iconLeft={<CheckCircle size={18} />}>
            {formProduto.id ? 'Salvar' : 'Publicar produto'}
          </Button>
        </div>
      </Modal>

      <Modal open={confirmarDelete.aberto} onClose={() => setConfirmarDelete({ aberto: false, id: null })} size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={28} /></div>
          <h3 className="text-lg font-black uppercase italic text-[#394158]">Remover produto?</h3>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setConfirmarDelete({ aberto: false, id: null })}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={() => confirmarDelete.id && handleDeletarProduto(confirmarDelete.id)}>Remover</Button>
          </div>
        </div>
      </Modal>

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
