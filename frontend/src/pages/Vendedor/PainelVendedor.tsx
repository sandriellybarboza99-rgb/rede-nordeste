import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Package, DollarSign, ShoppingBag, Store,
  Edit2, Trash2, Image as ImageIcon, CheckCircle,
  AlertTriangle, ShieldOff, Key, LayoutDashboard,
} from 'lucide-react';
import {
  getMinhaLoja, criarLoja, atualizarLoja,
  getProdutosPorLoja, criarProduto, atualizarProduto, deletarProduto,
  getCategorias, getPedidosDaLoja, atualizarStatusEntrega,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

// NOTA: o cabeçalho principal (logo, busca, notificações, carrinho, perfil)
// agora é fornecido pelo MainLayout em App.tsx e aparece em todas as rotas
// logadas. Este componente não renderiza mais PageHeader nem UserMenu
// próprios — apenas o conteúdo interno da página, evitando headers
// duplicados/empilhados.

type Aba = 'dashboard' | 'produtos' | 'pedidos' | 'loja';

const STATUS_PEDIDO_PROXIMO: Record<string, string | null> = {
  PEDIDO_RECEBIDO: 'PEDIDO_EM_COLETA',
  AGUARDANDO_ENTREGADOR: 'PEDIDO_EM_COLETA',
  PEDIDO_EM_COLETA: 'SAIU_PARA_ENTREGA',
  SAIU_PARA_ENTREGA: 'ENTREGUE',
  RETIRADA_DISPONIVEL: 'ENTREGUE',
};

export default function PainelVendedor() {
  const { success, error: toastError } = useToast();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard');

  // ── Loja ──────────────────────────────────────────────────────
  const [loja, setLoja] = useState<any>(null);
  const [carregandoLoja, setCarregandoLoja] = useState(true);
  const [modalLoja, setModalLoja] = useState(false);
  const [formLoja, setFormLoja] = useState<any>({
    nomeLoja: '', descricaoBio: '', cidade: '', estado: 'SE', cep: '',
    logradouro: '', bairro: '', logoUrl: '',
    aceitaRetirada: true, fazEntrega: false,
    valorMinimoPedido: 0, taxaEntregaFixa: 0,
    latitudeLoja: null, longitudeLoja: null,
    chavePix: '',       // ← campo da chave PIX da loja
    tipoChavePix: 'CPF' // ← campo do tipo de chave PIX
  });

  // ── Produtos ──────────────────────────────────────────────────
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [modalProduto, setModalProduto] = useState(false);
  const [formProduto, setFormProduto] = useState<any>({
    id: null, nome: '', descricao: '', precoAtual: 0, unidadeMedida: 'kg',
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
        setFormLoja((prev: any) => ({
          ...prev,
          ...minhaLoja,
          chavePix: minhaLoja.chavePix || '',
          tipoChavePix: minhaLoja.tipoChavePix || 'CPF'
        }));
      } catch {
        setLoja(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Helpers ───────────────────────────────────────────────────
  const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) { toastError('Geolocalização não disponível'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLoja((prev: any) => ({
          ...prev,
          latitudeLoja: pos.coords.latitude,
          longitudeLoja: pos.coords.longitude,
        }));
        success('Localização capturada');
      },
      () => toastError('Não foi possível obter sua localização')
    );
  };

  const lerImagemBase64 = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toastError('Imagem muito grande (máx 2MB)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Salvar loja (cria ou atualiza) ────────────────────────────
  const salvarLoja = async () => {
    if (!formLoja.nomeLoja || !formLoja.cidade) {
      toastError('Nome da loja e cidade são obrigatórios');
      return;
    }
    try {
      const dadosCorrigidos = {
        ...formLoja,
        cep: formLoja.cep ? formLoja.cep.replace(/\D/g, '') : null,
        valorMinimoPedido: Number(formLoja.valorMinimoPedido || 0),
        taxaEntregaFixa: Number(formLoja.taxaEntregaFixa || 0),
        chavePix: formLoja.chavePix?.trim() || null,
        tipoChavePix: formLoja.tipoChavePix || 'CPF',
      };
      const salva = loja
        ? await atualizarLoja(dadosCorrigidos)
        : await criarLoja(dadosCorrigidos);
      setLoja(salva);
      setModalLoja(false);
      success(loja ? 'Loja atualizada' : 'Loja criada! Aguarde a verificação do admin');
    } catch (err: any) {
      toastError(err?.message || 'Erro ao salvar loja');
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
        precoAtual: Number(formProduto.precoAtual),
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
      id: null, nome: '', descricao: '', precoAtual: 0, unidadeMedida: 'kg',
      estoqueAtual: 0, pesoKg: 0.5, imagemUrl: '',
      categoriaId: categorias[0]?.id ?? null,
    });
    setModalProduto(true);
  };

  const abrirEditarProduto = (p: any) => {
    setFormProduto({
      id: p.id, nome: p.nome, descricao: p.descricao,
      precoAtual: p.precoAtual, unidadeMedida: p.unidadeMedida,
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

  const avancarStatusPedido = async (pedidoId: number, statusAtual: string) => {
    const proximo = STATUS_PEDIDO_PROXIMO[statusAtual];
    if (!proximo) return;
    try {
      await atualizarStatusEntrega(pedidoId, proximo);
      success(`Pedido atualizado para ${proximo}`);
      carregarPedidos();
    } catch (err: any) {
      toastError(err?.message || 'Erro ao avançar status');
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (carregandoLoja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED]">
        <div className="w-12 h-12 border-4 border-[#55833d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Onboarding: vendedor sem loja ─────────────────────────────
  if (!loja) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col">
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
        {renderModalLoja()}
      </div>
    );
  }

  const lojaNaoVerificada = !loja.verificada || loja.suspensa;

  // ── Painel principal ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans pb-10">
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-8 page-enter">

        <div className="mb-2">
          <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-[#394158]">
            {loja.nomeLoja}
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {loja.cidade ?? ''}{loja.estado ? ' · ' + loja.estado : ''}
          </p>
        </div>

        {lojaNaoVerificada && (
          <div className="bg-[#f9943b]/10 border border-[#f9943b]/20 rounded-2xl px-4 py-3 flex items-center gap-3 mt-4 mb-4">
            <AlertTriangle size={18} className="text-[#f9943b] shrink-0" />
            <p className="text-xs font-bold text-[#394158]">
              {loja.suspensa
                ? `Loja suspensa${loja.motivoSuspensao ? `: ${loja.motivoSuspensao}` : ''}.`
                : 'Sua loja está aguardando verificação do admin. Seus produtos só aparecem na vitrine após aprovação.'}
            </p>
          </div>
        )}

        {/* Tabs desktop */}
        <nav className="hidden md:flex gap-1 pt-6 border-b border-gray-100 bg-white rounded-t-2xl px-6">
          {([
            { id: 'dashboard', label: 'Visão geral', Icon: LayoutDashboard },
            { id: 'produtos', label: 'Produtos', Icon: Package },
            { id: 'pedidos', label: 'Pedidos', Icon: ShoppingBag },
            { id: 'loja', label: 'Minha loja', Icon: Store },
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

        {/* Tabs mobile */}
        <nav className="md:hidden flex gap-2 overflow-x-auto pb-2 no-scrollbar mt-4">
          {([
            { id: 'dashboard', label: 'Visão' },
            { id: 'produtos', label: 'Produtos' },
            { id: 'pedidos', label: 'Pedidos' },
            { id: 'loja', label: 'Loja' },
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

          {/* ── DASHBOARD ─────────────────────────────────── */}
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

          {/* ── PRODUTOS ──────────────────────────────────── */}
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

          {/* ── PEDIDOS ───────────────────────────────────── */}
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
                    <Card key={p.id} padding="md" className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-black uppercase text-[#394158]">Pedido #{p.id}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                          Status: {p.statusEntrega || '—'} · {p.itens?.length || 0} itens
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Pago: {p.statusPagamento || '—'}</p>
                      </div>
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <span className="text-base font-black text-[#55833d] md:mr-3">R$ {Number(p.valorTotal).toFixed(2)}</span>
                        {STATUS_PEDIDO_PROXIMO[p.statusEntrega] && (
                          <Button size="sm" onClick={() => avancarStatusPedido(p.id, p.statusEntrega)}>
                            Avançar status
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── LOJA ──────────────────────────────────────── */}
          {abaAtiva === 'loja' && (
            <Card padding="lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-base md:text-xl font-black uppercase italic text-[#394158]">Minha loja</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {loja.verificada ? 'Verificada ✓' : 'Aguardando verificação'}
                  </p>
                </div>
                <Button onClick={() => {
                  setFormLoja((prev: any) => ({
                    ...prev,
                    ...loja,
                    chavePix: loja.chavePix || '',
                    tipoChavePix: loja.tipoChavePix || 'CPF'
                  }));
                  setModalLoja(true);
                }}
                  variant="ghost" iconLeft={<Edit2 size={14} />}>Editar</Button>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Nome</dt><dd className="font-bold mt-1">{loja.nomeLoja}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Cidade</dt><dd className="font-bold mt-1">{loja.cidade}/{loja.estado}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Aceita retirada</dt><dd className="font-bold mt-1">{loja.aceitaRetirada ? 'Sim' : 'Não'}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Faz entrega</dt><dd className="font-bold mt-1">{loja.fazEntrega ? 'Sim' : 'Não'}</dd></div>
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">Tipo da Chave PIX</dt>
                  <dd className="font-bold mt-1 text-[#394158]">
                    {loja.tipoChavePix || 'CPF'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">Chave PIX</dt>
                  <dd className="font-bold mt-1 text-[#55833d]">
                    {loja.chavePix || <span className="text-gray-400 font-medium italic">Não cadastrada</span>}
                  </dd>
                </div>
                <div className="md:col-span-2"><dt className="text-[10px] font-black uppercase text-gray-400">Bio</dt><dd className="font-medium text-gray-600 mt-1">{loja.descricaoBio || '—'}</dd></div>
              </dl>
            </Card>
          )}
        </div>
      </main>

      {renderModalLoja()}

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
            <FormField label="Preço (R$)" type="number" step="0.01" value={formProduto.precoAtual}
              onChange={e => setFormProduto({ ...formProduto, precoAtual: e.target.value })} />
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
    </div>
  );

  // ── Modal de Loja ─────────────────────────────────────────────
  function renderModalLoja() {
    return (
      <Modal open={modalLoja} onClose={() => setModalLoja(false)}
        title={loja ? 'Editar minha loja' : 'Criar minha loja'} size="lg">
        <div className="space-y-4">
          <FormField label="Nome da loja" value={formLoja.nomeLoja}
            onChange={e => setFormLoja({ ...formLoja, nomeLoja: e.target.value })} />
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Bio</label>
            <textarea rows={2} value={formLoja.descricaoBio || ''}
              onChange={e => setFormLoja({ ...formLoja, descricaoBio: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cidade" value={formLoja.cidade || ''}
              onChange={e => setFormLoja({ ...formLoja, cidade: e.target.value })} />
            <FormField label="Estado (UF)" value={formLoja.estado || 'SE'} maxLength={2}
              onChange={e => setFormLoja({ ...formLoja, estado: e.target.value.toUpperCase() })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="CEP" value={formLoja.cep || ''} maxLength={9}
              onChange={e => setFormLoja({ ...formLoja, cep: e.target.value })} />
            <FormField label="Bairro" value={formLoja.bairro || ''}
              onChange={e => setFormLoja({ ...formLoja, bairro: e.target.value })} />
          </div>
          <FormField label="Logradouro" value={formLoja.logradouro || ''}
            onChange={e => setFormLoja({ ...formLoja, logradouro: e.target.value })} />

          {/* ── Configuração PIX (Tipo + Chave) ──────────────── */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block flex items-center gap-1">
              <Key size={12} /> Dados para Recebimento via PIX
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block mb-1">
                  Tipo de Chave
                </label>
                <select
                  value={formLoja.tipoChavePix || 'CPF'}
                  onChange={e => setFormLoja({ ...formLoja, tipoChavePix: e.target.value })}
                  className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="TELEFONE">Telefone</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={formLoja.chavePix || ''}
                  onChange={e => setFormLoja({ ...formLoja, chavePix: e.target.value })}
                  placeholder="Informe a sua chave PIX"
                  className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]"
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 ml-1">
              Esta chave e tipo serão usados para gerar o QR Code de pagamento quando clientes efetuarem compras na sua loja.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Localização (opcional)</label>
            <div className="flex gap-2 items-center">
              <p className="text-xs text-gray-500 flex-1 truncate">
                {formLoja.latitudeLoja
                  ? `${Number(formLoja.latitudeLoja).toFixed(4)}, ${Number(formLoja.longitudeLoja).toFixed(4)}`
                  : 'Não definida'}
              </p>
              <Button variant="ghost" size="sm" onClick={usarMinhaLocalizacao}>Usar minha localização</Button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Logo</label>
            <label className="w-full p-3 bg-[#F5F2ED]/50 text-gray-400 font-bold rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f9943b] flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon size={18} /> {formLoja.logoUrl ? 'Selecionada ✓' : 'Escolher logo'}
              <input type="file" className="hidden" accept="image/*"
                onChange={e => lerImagemBase64(e, url => setFormLoja({ ...formLoja, logoUrl: url }))} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={!!formLoja.aceitaRetirada}
                onChange={e => setFormLoja({ ...formLoja, aceitaRetirada: e.target.checked })} />
              Aceita retirada
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={!!formLoja.fazEntrega}
                onChange={e => setFormLoja({ ...formLoja, fazEntrega: e.target.checked })} />
              Faz entrega
            </label>
          </div>

          <Button onClick={salvarLoja} fullWidth size="lg" iconLeft={<CheckCircle size={18} />}>
            {loja ? 'Salvar alterações' : 'Criar loja'}
          </Button>
        </div>
      </Modal>
    );
  }
}