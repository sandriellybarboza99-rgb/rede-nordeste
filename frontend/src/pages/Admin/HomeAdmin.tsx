import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Store, DollarSign,
  Menu, X, ShieldCheck,
  AlertTriangle, CheckCircle, UserCheck,
  Newspaper, Image as ImageIcon, Plus, Edit2,
  Trash2, XCircle, ShieldOff, Package, FileText, Crown, ArrowDownCircle,
  UtensilsCrossed, Clock, Flame, Link2,
} from 'lucide-react';
import {
  getProdutosPendentes, aprovarOuRejeitarProduto,
  adminGetMetricas, adminListarUsuarios, adminAtualizarUsuario,
  adminListarLojasPendentes, adminVerificarLoja, adminSuspenderLoja,
  adminListarBanners, adminCriarBanner, adminAtualizarBanner, adminDeletarBanner,
  adminListarNoticias, adminCriarNoticia, adminAtualizarNoticia, adminDeletarNoticia,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/ui/UserMenu';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/Input';

type Aba = 'dashboard' | 'verificacao' | 'usuarios' | 'destaques' | 'noticias' | 'receitas';

const RECEITAS_INICIAIS = [
  { id: 1, titulo: 'Escondidinho de Carne', tempo: '45 min', dificuldade: 'Média',
    imagem: 'https://images.unsplash.com/photo-1595666548990-788e19dc3885?q=80&w=1170&auto=format&fit=crop',
    descricao: 'O clássico sertanejo com macaxeira cremosa e queijo coalho gratinado.',
    ingredientes: ['500g de carne de sol','1kg de macaxeira cozida','200g de queijo coalho','1 cebola roxa','Nata a gosto'],
    preparo: 'Dessalgue a carne, refogue com cebola. Amasse a macaxeira com nata para o purê. Monte em camadas e gratine com o queijo.' },
  { id: 2, titulo: 'Tapioca Gourmet de Queijo', tempo: '10 min', dificuldade: 'Fácil',
    imagem: 'https://sabores-new.s3.amazonaws.com/public/2024/11/tapiocaalecrim_comqueijo.jpeg',
    descricao: 'Crocante e recheada com o melhor queijo da nossa terra.',
    ingredientes: ['1 xícara de goma de tapioca','2 fatias grossas de queijo coalho','Manteiga de garrafa'],
    preparo: 'Peneire a goma na frigideira quente. Quando ligar, coloque o queijo. Dobre e pincele manteiga de garrafa.' },
  { id: 3, titulo: 'Cuscuz Nordestino', tempo: '20 min', dificuldade: 'Fácil',
    imagem: 'https://www.sabornamesa.com.br/media/k2/items/cache/4fd575b03eae045941eb58c35ab6b353_XL.jpg',
    descricao: 'O café da manhã perfeito com ovos caipira e queijo derretido.',
    ingredientes: ['2 xícaras de flocão de milho','1 xícara de água','Sal a gosto','Ovos e queijo para acompanhar'],
    preparo: 'Hidrate o flocão por 10 min. Cozinhe no vapor por 10 min. Sirva com ovos fritos na manteiga e queijo derretido.' },
  { id: 4, titulo: 'Bolo de Rolo', tempo: '1h 20min', dificuldade: 'Difícil',
    imagem: 'https://images.unsplash.com/photo-1593872423141-bb230bd352c6?q=80&w=687&auto=format&fit=crop',
    descricao: 'A iguaria mais famosa de Pernambuco, com camadas finas e goiabada cascão.',
    ingredientes: ['Manteiga','Açúcar','Farinha de Trigo','Goiabada Cascão'],
    preparo: 'Asse camadas finas, recheie com a goiabada derretida e enrole com cuidado ainda quente.' },
  { id: 5, titulo: 'Baião de Dois', tempo: '40 min', dificuldade: 'Média',
    imagem: 'https://www.yoki.com.br/_next/image?url=https%3A%2F%2Fprodcontent.yoki.com.br%2Fwp-content%2Fuploads%2F2024%2F09%2FBaiao-de-dois-800x450-1.jpg&w=1400&q=75',
    descricao: 'O arroz com feijão de corda que é a cara do Nordeste. Prático e delicioso.',
    ingredientes: ['Arroz','Feijão de corda','Queijo coalho','Toucinho'],
    preparo: 'Cozinhe o feijão, adicione o arroz e finalize com pedaços generosos de queijo coalho.' },
  { id: 6, titulo: 'Arroz doce verdadeiro', tempo: '1h 30min', dificuldade: 'Média',
    imagem: 'https://bakeandcakegourmet.com.br/uploads/site/receitas/arroz-doce-sem-leite-ikz3g2us.jpg',
    descricao: 'Para os amantes de doces clássicos, a receita de arroz doce verdadeiro é uma opção perfeita!',
    ingredientes: ['1 e 1/2 litro de leite','3 xícaras de açúcar','1 lata de leite condensado','2 xícaras de arroz branco (já lavado)','canela em pau a gosto'],
    preparo: 'Cozinhe o arroz no leite, juntamente com a canela. Após 20 minutos, mexa de tempos em tempos. Acrescente o açúcar e deixe por 20 minutos. Logo em seguida, acrescente o leite condensado e deixe por mais 20 minutos. Coloque em uma linda travessa.' },
];

export default function HomeAdmin() {
  const { success, error: toastError } = useToast();
  const { usuario } = useAuth();
  // Email do admin logado — usado para impedir auto-rebaixamento na UI.
  const usuarioLogadoEmail = usuario?.email ?? '';
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard');
  const [menuAberto, setMenuAberto] = useState(false);

  // ── Estado ────────────────────────────────────────────────────
  const [metricas, setMetricas] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [lojasPendentes, setLojasPendentes] = useState<any[]>([]);
  const [produtosPendentes, setProdutosPendentes] = useState<any[]>([]);
  const [totalProdutosPendentes, setTotalProdutosPendentes] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [noticias, setNoticias] = useState<any[]>([]);
  const [receitas, setReceitas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  // ── Modais ────────────────────────────────────────────────────
  const [modalBanner, setModalBanner] = useState(false);
  const [modalNoticia, setModalNoticia] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [confirmar, setConfirmar] = useState<{
    aberto: boolean;
    tipo: 'banner' | 'noticia' | 'suspenderLoja' | 'receita' | null;
    id: number | null;
    motivo?: string;
  }>({ aberto: false, tipo: null, id: null });

  const [formBanner, setFormBanner] = useState<any>({
    id: null, tipo: 'DESTAQUE', titulo: '', subtitulo: '',
    imagemUrl: '', corDestaque: 'text-[#f9943b]', linkBlogId: null, ordem: 0, ativo: true,
  });
  const [formNoticia, setFormNoticia] = useState<any>({
    id: null, titulo: '', subtitulo: '', categoria: 'NOTICIA',
    imagemUrl: '', descricao: '', citacao: '', tempoLeitura: '3 min', publicada: true,
  });
  const [formReceita, setFormReceita] = useState<any>({
    id: null, titulo: '', tempo: '', dificuldade: 'Fácil',
    imagem: '', descricao: '', ingredientes: '', preparo: '',
  });

  // ── Carrega dados conforme aba ────────────────────────────────
  useEffect(() => {
    if (abaAtiva === 'dashboard')   carregarMetricas();
    if (abaAtiva === 'verificacao') { carregarLojasPendentes(); carregarProdutosPendentes(); }
    if (abaAtiva === 'usuarios')    carregarUsuarios();
    if (abaAtiva === 'destaques')   { carregarBanners(); carregarNoticias(); }
    if (abaAtiva === 'noticias')    carregarNoticias();
    if (abaAtiva === 'receitas')    carregarReceitas();
  }, [abaAtiva]);

  const carregarMetricas = async () => {
    try { setMetricas(await adminGetMetricas()); }
    catch (err: any) { toastError(err?.message || 'Erro ao carregar métricas'); }
  };

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const data = await adminListarUsuarios();
      setUsuarios(data.content || []);
    } catch (err: any) { toastError(err?.message || 'Erro ao listar usuários'); }
    finally { setCarregando(false); }
  };

  const carregarLojasPendentes = async () => {
    try {
      const data = await adminListarLojasPendentes();
      setLojasPendentes(data.content || []);
    } catch { setLojasPendentes([]); }
  };

  const carregarProdutosPendentes = async () => {
    try {
      const data = await getProdutosPendentes();
      setProdutosPendentes(data.content || []);
      setTotalProdutosPendentes(data.totalElements || 0);
    } catch { setProdutosPendentes([]); }
  };

  const carregarBanners = async () => {
    try { setBanners(await adminListarBanners()); }
    catch { setBanners([]); }
  };

  const carregarNoticias = async () => {
    try {
      const data = await adminListarNoticias();
      setNoticias(data.content || []);
    } catch { setNoticias([]); }
  };

  const carregarReceitas = () => {
    const salvas = localStorage.getItem('receitas_globais');
    if (salvas) {
      setReceitas(JSON.parse(salvas));
    } else {
      localStorage.setItem('receitas_globais', JSON.stringify(RECEITAS_INICIAIS));
      setReceitas(RECEITAS_INICIAIS);
    }
  };

  // ── Ações: usuários ──────────────────────────────────────────
  const handleSuspenderUsuario = async (id: number, ativo: boolean) => {
    try {
      await adminAtualizarUsuario(id, {
        contaAtiva: !ativo,
        motivoSuspensao: !ativo ? 'Suspenso pelo administrador' : undefined,
      });
      success(ativo ? 'Usuário suspenso' : 'Usuário reativado');
      carregarUsuarios();
    } catch (err: any) { toastError(err?.message || 'Erro ao atualizar usuário'); }
  };

  const handleResetSenha = async (id: number) => {
    const novaSenha = prompt('Nova senha (mínimo 8 caracteres):');
    if (!novaSenha || novaSenha.length < 8) {
      toastError('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    try {
      await adminAtualizarUsuario(id, { novaSenha });
      success('Senha redefinida. Avise o usuário.');
    } catch (err: any) { toastError(err?.message || 'Erro ao redefinir senha'); }
  };

  // Promove/rebaixa o perfil. Backend revoga TODAS as sessões do usuário
  // ao mudar perfil → ele precisa logar de novo com as novas permissões.
  const handleMudarPerfil = async (id: number, novoPerfil: 'ADMIN' | 'COMPRADOR' | 'PRODUTOR', email: string) => {
    const confirma = window.confirm(
      `Mudar o perfil de ${email} para ${novoPerfil}?\n\n` +
      `Todas as sessões ativas do usuário serão encerradas — ele precisará logar novamente.`
    );
    if (!confirma) return;
    try {
      await adminAtualizarUsuario(id, { tipoPerfil: novoPerfil });
      success(`${email} agora é ${novoPerfil}`);
      carregarUsuarios();
    } catch (err: any) { toastError(err?.message || 'Erro ao mudar perfil'); }
  };

  // ── Ações: lojas ─────────────────────────────────────────────
  const handleVerificarLoja = async (id: number) => {
    try {
      await adminVerificarLoja(id);
      success('Loja verificada e liberada para vender');
      carregarLojasPendentes();
    } catch (err: any) { toastError(err?.message || 'Erro ao verificar loja'); }
  };

  // ── Ações: produtos ──────────────────────────────────────────
  const handleStatusProduto = async (id: number, status: 'APROVADO' | 'REJEITADO') => {
    try {
      await aprovarOuRejeitarProduto(id, status);
      setProdutosPendentes(prev => prev.filter(p => p.id !== id));
      setTotalProdutosPendentes(prev => Math.max(0, prev - 1));
      success(status === 'APROVADO' ? 'Produto aprovado' : 'Produto rejeitado');
    } catch (err: any) { toastError(err?.message || 'Erro ao atualizar status'); }
  };

  // ── Ações: banners ───────────────────────────────────────────
  const abrirNovoBanner = () => {
    setFormBanner({
      id: null, tipo: 'DESTAQUE', titulo: '', subtitulo: '',
      imagemUrl: '', corDestaque: 'text-[#f9943b]', linkBlogId: null, ordem: 0, ativo: true,
    });
    setModalBanner(true);
  };

  const abrirEditarBanner = (b: any) => {
    setFormBanner({ ...b });
    setModalBanner(true);
  };

  const salvarBanner = async () => {
    if (!formBanner.titulo || !formBanner.imagemUrl) {
      toastError('Preencha título e imagem');
      return;
    }
    try {
      if (formBanner.id) {
        await adminAtualizarBanner(formBanner.id, formBanner);
        success('Banner atualizado');
      } else {
        await adminCriarBanner(formBanner);
        success('Banner criado');
      }
      setModalBanner(false);
      carregarBanners();
    } catch (err: any) { toastError(err?.message || 'Erro ao salvar banner'); }
  };

  const deletarBanner = async (id: number) => {
    try {
      await adminDeletarBanner(id);
      success('Banner removido');
      setConfirmar({ aberto: false, tipo: null, id: null });
      carregarBanners();
    } catch (err: any) { toastError(err?.message || 'Erro ao remover banner'); }
  };

  // ── Ações: notícias ──────────────────────────────────────────
  const abrirNovaNoticia = () => {
    setFormNoticia({
      id: null, titulo: '', subtitulo: '', categoria: 'NOTICIA',
      imagemUrl: '', descricao: '', citacao: '', tempoLeitura: '3 min', publicada: true,
    });
    setModalNoticia(true);
  };

  const abrirEditarNoticia = (n: any) => {
    setFormNoticia({ ...n });
    setModalNoticia(true);
  };

  const salvarNoticia = async () => {
    if (!formNoticia.titulo) {
      toastError('Preencha o título');
      return;
    }
    try {
      if (formNoticia.id) {
        await adminAtualizarNoticia(formNoticia.id, formNoticia);
        success('Notícia atualizada');
      } else {
        await adminCriarNoticia(formNoticia);
        success('Notícia publicada');
      }
      setModalNoticia(false);
      carregarNoticias();
    } catch (err: any) { toastError(err?.message || 'Erro ao salvar notícia'); }
  };

  const deletarNoticia = async (id: number) => {
    try {
      await adminDeletarNoticia(id);
      success('Notícia removida');
      setConfirmar({ aberto: false, tipo: null, id: null });
      carregarNoticias();
    } catch (err: any) { toastError(err?.message || 'Erro ao remover notícia'); }
  };

  // ── Ações: receitas ──────────────────────────────────────────
  const abrirNovaReceita = () => {
    setFormReceita({
      id: null, titulo: '', tempo: '', dificuldade: 'Fácil',
      imagem: '', descricao: '', ingredientes: '', preparo: '',
    });
    setModalReceita(true);
  };

  const abrirEditarReceita = (r: any) => {
    setFormReceita({
      ...r,
      ingredientes: Array.isArray(r.ingredientes) ? r.ingredientes.join('\n') : (r.ingredientes || ''),
    });
    setModalReceita(true);
  };

  const salvarReceita = () => {
    if (!formReceita.titulo || !formReceita.tempo || !formReceita.preparo) {
      toastError('Preencha título, tempo e modo de preparo');
      return;
    }
    const ingredientesArray = formReceita.ingredientes
      .split('\n')
      .map((i: string) => i.trim())
      .filter(Boolean);

    let novasReceitas: any[];
    if (formReceita.id) {
      novasReceitas = receitas.map(r =>
        r.id === formReceita.id
          ? { ...formReceita, ingredientes: ingredientesArray }
          : r
      );
      success('Receita atualizada');
    } else {
      const novoId = receitas.length > 0 ? Math.max(...receitas.map(r => r.id)) + 1 : 1;
      novasReceitas = [
        ...receitas,
        { ...formReceita, id: novoId, ingredientes: ingredientesArray },
      ];
      success('Receita publicada');
    }
    localStorage.setItem('receitas_globais', JSON.stringify(novasReceitas));
    setReceitas(novasReceitas);
    setModalReceita(false);
  };

  const deletarReceita = (id: number) => {
    const novasReceitas = receitas.filter(r => r.id !== id);
    localStorage.setItem('receitas_globais', JSON.stringify(novasReceitas));
    setReceitas(novasReceitas);
    setConfirmar({ aberto: false, tipo: null, id: null });
    success('Receita removida');
  };

  // ── Upload de imagem (base64) ─────────────────────────────────
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

  const abas: { id: Aba; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard',   label: 'Visão Geral',         icon: LayoutDashboard },
    { id: 'verificacao', label: 'Aprovações',          icon: UserCheck,
      badge: totalProdutosPendentes + lojasPendentes.length },
    { id: 'usuarios',    label: 'Usuários',            icon: Users },
    { id: 'destaques',   label: 'Banners da Home',     icon: ImageIcon },
    { id: 'noticias',    label: 'Blog',                icon: Newspaper },
    { id: 'receitas',    label: 'Receitas',            icon: UtensilsCrossed },
  ];

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans flex flex-col md:flex-row">

      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-[#1a1f2e] text-white p-6 flex flex-col z-[100] transition-transform duration-300 w-72 shadow-2xl ${menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-10 flex flex-col items-center gap-2 pt-4 border-b border-white/10 pb-8 relative">
          <button onClick={() => setMenuAberto(false)} className="absolute top-0 right-0 md:hidden p-2 text-white/50"><X size={20} /></button>
          <img src="/assets/logo-admin.png" alt="Logo" className="h-12 object-contain" />
          <div className="bg-[#f9943b] text-white text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mt-2 flex items-center gap-1">
            <ShieldCheck size={10} /> Central Admin
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {abas.map(item => (
            <button
              key={item.id}
              onClick={() => { setAbaAtiva(item.id); setMenuAberto(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${
                abaAtiva === item.id ? 'bg-[#f9943b] text-white shadow-lg' : 'text-white/40 hover:bg-white/10'
              }`}
            >
              <item.icon size={18} /> {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white py-4 md:py-6 px-4 md:px-12 border-b border-gray-100 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuAberto(true)} className="md:hidden p-2 bg-[#F5F2ED] rounded-full text-[#394158]"><Menu size={20} /></button>
            <h1 className="text-base md:text-2xl font-black uppercase italic tracking-tighter text-[#394158]">
              {abas.find(a => a.id === abaAtiva)?.label}
            </h1>
          </div>
          <UserMenu perfilPath="/admin" />
        </header>

        <div className="p-4 md:p-12">
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[
                  { label: 'Vendas Totais',     valor: metricas ? `R$ ${Number(metricas.valorTotalVendas).toFixed(2)}` : '—',
                    icon: DollarSign, cor: 'text-[#55833d]', bg: 'bg-[#55833d]/10' },
                  { label: 'Pedidos',           valor: metricas?.totalPedidos ?? '—',
                    icon: Package,    cor: 'text-[#f9943b]', bg: 'bg-[#f9943b]/10' },
                  { label: 'Lojas Verificadas', valor: metricas?.totalLojasVerificadas ?? '—',
                    icon: Store,      cor: 'text-blue-500',  bg: 'bg-blue-500/10' },
                  { label: 'Usuários',          valor: metricas?.totalUsuarios ?? '—',
                    icon: Users,      cor: 'text-purple-500',bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 mb-1 truncate">{s.label}</p>
                      <h3 className={`text-base md:text-xl font-black italic ${s.cor} truncate`}>{s.valor}</h3>
                    </div>
                    <div className={`p-2 md:p-3 ${s.bg} ${s.cor} rounded-xl shrink-0`}><s.icon size={20} /></div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-3">Compradores</h3>
                  <p className="text-3xl font-black text-[#394158]">{metricas?.totalCompradores ?? '—'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-3">Produtores</h3>
                  <p className="text-3xl font-black text-[#394158]">{metricas?.totalProdutores ?? '—'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-3">Pendências</h3>
                  <p className="text-3xl font-black text-red-500">
                    {(metricas?.totalLojasPendentes ?? 0) + (metricas?.totalProdutosPendentes ?? 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">lojas + produtos aguardando</p>
                </div>
              </section>
            </div>
          )}

          {/* VERIFICAÇÃO */}
          {abaAtiva === 'verificacao' && (
            <div className="space-y-6">
              {/* Lojas pendentes */}
              <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158] mb-1">
                  Lojas aguardando verificação
                  {lojasPendentes.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{lojasPendentes.length}</span>
                  )}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Verifique antes de liberar o vendedor para a vitrine
                </p>

                {lojasPendentes.length === 0 ? (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center gap-3">
                    <CheckCircle size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma loja pendente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lojasPendentes.map(loja => (
                      <div key={loja.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#f9943b]/30 transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 bg-[#394158]/5 text-[#394158] rounded-full flex items-center justify-center shrink-0"><Store size={18} /></div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm uppercase text-[#394158] truncate">{loja.nomeLoja}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 truncate">
                              {loja.usuarioNome} · {loja.cidade}/{loja.estado}
                            </p>
                            <p className="text-[10px] font-bold text-[#55833d] mt-0.5 truncate">{loja.usuarioEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="danger"
                            onClick={() => setConfirmar({ aberto: true, tipo: 'suspenderLoja', id: loja.id })}>
                            Recusar
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleVerificarLoja(loja.id)}
                            iconLeft={<CheckCircle size={14} />}>
                            Verificar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Produtos pendentes */}
              <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158] mb-1">
                  Produtos aguardando aprovação
                  {totalProdutosPendentes > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{totalProdutosPendentes}</span>
                  )}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Apenas produtos rejeitados saem da vitrine
                </p>

                {produtosPendentes.length === 0 ? (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center gap-3">
                    <CheckCircle size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum produto pendente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {produtosPendentes.map((prod: any) => (
                      <div key={prod.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#f9943b]/30 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={prod.imagemUrl || 'https://via.placeholder.com/64'}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" alt={prod.nome} />
                          <div className="min-w-0">
                            <h4 className="font-black text-sm uppercase text-[#394158] truncate">{prod.nome}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 truncate">
                              {prod.nomeLoja} · R$ {Number(prod.precoAtual).toFixed(2)}/{prod.unidadeMedida}
                            </p>
                            <p className="text-[10px] font-black text-[#f9943b] mt-0.5 truncate">
                              {prod.nomeCategoria || '—'} · Estoque: {prod.estoqueAtual}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="danger" onClick={() => handleStatusProduto(prod.id, 'REJEITADO')}
                            iconLeft={<XCircle size={14} />}>Rejeitar</Button>
                          <Button size="sm" variant="primary" onClick={() => handleStatusProduto(prod.id, 'APROVADO')}
                            iconLeft={<CheckCircle size={14} />}>Aprovar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158] mb-6">Todos os usuários</h2>
              {carregando ? (
                <p className="text-center text-[10px] font-black uppercase text-gray-300 py-12">Carregando...</p>
              ) : (
                <div className="space-y-3">
                  {usuarios.map(u => (
                    <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm uppercase text-[#394158] truncate">{u.nomeCompleto}</h4>
                          {u.tipoPerfil === 'ADMIN' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-[#f9943b]/10 text-[#f9943b] px-2 py-0.5 rounded-full">
                              <Crown size={10} /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 truncate">
                          {u.email} · {u.tipoPerfil}
                        </p>
                        {!u.contaAtiva && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">
                            Suspenso{u.motivoSuspensao ? `: ${u.motivoSuspensao}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleResetSenha(u.id)}>
                          Reset senha
                        </Button>

                        {/* Promover a ADMIN (apenas se ainda não for) */}
                        {u.tipoPerfil !== 'ADMIN' && (
                          <Button size="sm" variant="warning"
                            onClick={() => handleMudarPerfil(u.id, 'ADMIN', u.email)}
                            iconLeft={<Crown size={14} />}>
                            Promover Admin
                          </Button>
                        )}

                        {/* Rebaixar ADMIN para COMPRADOR (UI bloqueia rebaixar a si mesmo) */}
                        {u.tipoPerfil === 'ADMIN' && u.email !== usuarioLogadoEmail && (
                          <Button size="sm" variant="ghost"
                            onClick={() => handleMudarPerfil(u.id, 'COMPRADOR', u.email)}
                            iconLeft={<ArrowDownCircle size={14} />}>
                            Rebaixar
                          </Button>
                        )}

                        {u.contaAtiva ? (
                          <Button size="sm" variant="danger" onClick={() => handleSuspenderUsuario(u.id, true)}
                            iconLeft={<ShieldOff size={14} />}>Suspender</Button>
                        ) : (
                          <Button size="sm" variant="primary" onClick={() => handleSuspenderUsuario(u.id, false)}
                            iconLeft={<ShieldCheck size={14} />}>Reativar</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BANNERS */}
          {abaAtiva === 'destaques' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 gap-3 shadow-sm">
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158]">Banners da Home</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Carrossel na página inicial pública</p>
                </div>
                <Button onClick={abrirNovoBanner} variant="warning" iconLeft={<Plus size={16} />}>Novo Banner</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-white flex flex-col">
                    <div className="aspect-video relative overflow-hidden">
                      <img src={b.imagemUrl} className="w-full h-full object-cover" alt={b.titulo} />
                      <div className={`absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${b.corDestaque}`}>{b.tipo}</div>
                      {!b.ativo && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-black uppercase">Inativo</div>}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-black text-sm uppercase text-[#394158] line-clamp-1">{b.titulo}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase line-clamp-2 italic mt-1">{b.subtitulo}</p>
                      {b.linkBlogId && (
                        <p className="text-[9px] font-bold text-[#55833d] mt-1.5 flex items-center gap-1">
                          <Link2 size={8} /> Notícia #{b.linkBlogId} vinculada
                        </p>
                      )}
                      <div className="mt-auto pt-3 flex justify-end gap-2">
                        <button onClick={() => abrirEditarBanner(b)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F2ED] text-[#394158] hover:bg-[#f9943b] hover:text-white transition-colors"><Edit2 size={12} /></button>
                        <button onClick={() => setConfirmar({ aberto: true, tipo: 'banner', id: b.id })} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTÍCIAS */}
          {abaAtiva === 'noticias' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 gap-3 shadow-sm">
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158]">Blog</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Publique novidades para a comunidade</p>
                </div>
                <Button onClick={abrirNovaNoticia} iconLeft={<Plus size={16} />}>Nova publicação</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noticias.map(n => (
                  <div key={n.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-white flex flex-col">
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                      {n.imagemUrl && <img src={n.imagemUrl} className="w-full h-full object-cover" alt={n.titulo} />}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-[#55833d]">{n.categoria}</div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-black text-sm uppercase text-[#394158] line-clamp-1">{n.titulo}</h3>
                      <p className="text-[10px] font-bold text-gray-400 line-clamp-2 italic mt-1">{n.subtitulo}</p>
                      <div className="mt-auto pt-3 flex justify-end gap-2">
                        <button onClick={() => abrirEditarNoticia(n)} className="p-2 text-gray-300 hover:text-[#f9943b] transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setConfirmar({ aberto: true, tipo: 'noticia', id: n.id })} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECEITAS */}
          {abaAtiva === 'receitas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 gap-3 shadow-sm">
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase italic text-[#394158]">Receitas</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gerencie as receitas que aparecem para compradores e vendedores</p>
                </div>
                <Button onClick={abrirNovaReceita} iconLeft={<Plus size={16} />}>Nova Receita</Button>
              </div>

              {receitas.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <UtensilsCrossed className="text-gray-300 mx-auto mb-3" size={40} />
                  <p className="text-sm text-gray-400">Nenhuma receita cadastrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receitas.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-white flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-gray-100">
                        {(r.imagem || r.img) && <img src={r.imagem || r.img} className="w-full h-full object-cover" alt={r.titulo} />}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-[#55833d] flex items-center gap-1">
                          <Clock size={8} /> {r.tempo}
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-[#f9943b] flex items-center gap-1">
                          <Flame size={8} /> {r.dificuldade}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-black text-sm uppercase text-[#394158] line-clamp-1">{r.titulo}</h3>
                        <p className="text-[10px] font-bold text-gray-400 line-clamp-2 italic mt-1">{r.descricao}</p>
                        <p className="text-[9px] font-bold text-[#55833d] mt-2">
                          {Array.isArray(r.ingredientes) ? r.ingredientes.length : 0} ingredientes
                        </p>
                        <div className="mt-auto pt-3 flex justify-end gap-2">
                          <button onClick={() => abrirEditarReceita(r)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F2ED] text-[#394158] hover:bg-[#f9943b] hover:text-white transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => setConfirmar({ aberto: true, tipo: 'receita', id: r.id })} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL BANNER */}
      <Modal open={modalBanner} onClose={() => setModalBanner(false)}
        title={formBanner.id ? 'Editar banner' : 'Novo banner'}>
        <div className="space-y-4">
          {/* VINCULAR NOTÍCIA */}
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5 flex items-center gap-1">
              <Link2 size={10} /> Vincular notícia
            </label>
            <select
              value={formBanner.linkBlogId || ''}
              onChange={e => {
                const selectedId = e.target.value ? Number(e.target.value) : null;
                if (selectedId) {
                  const noticia = noticias.find((n: any) => n.id === selectedId);
                  if (noticia) {
                    setFormBanner({
                      ...formBanner,
                      linkBlogId: selectedId,
                      titulo: noticia.titulo || formBanner.titulo,
                      subtitulo: noticia.subtitulo || formBanner.subtitulo,
                      imagemUrl: noticia.imagemUrl || formBanner.imagemUrl,
                      tipo: noticia.categoria || formBanner.tipo,
                    });
                  }
                } else {
                  setFormBanner({ ...formBanner, linkBlogId: null });
                }
              }}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]"
            >
              <option value="">Nenhuma (banner independente)</option>
              {noticias.map((n: any) => (
                <option key={n.id} value={n.id}>{n.titulo}</option>
              ))}
            </select>
            {formBanner.linkBlogId && (
              <p className="text-[9px] font-bold text-[#55833d] mt-1.5 ml-1 flex items-center gap-1">
                <Link2 size={8} /> Vinculada — o botão "Saiba Mais" levará para esta notícia
              </p>
            )}
          </div>
          <FormField label="Tag" value={formBanner.tipo}
            onChange={e => setFormBanner({ ...formBanner, tipo: e.target.value })} />
          <FormField label="Título" value={formBanner.titulo}
            onChange={e => setFormBanner({ ...formBanner, titulo: e.target.value })} />
          <FormField label="Subtítulo" value={formBanner.subtitulo || ''}
            onChange={e => setFormBanner({ ...formBanner, subtitulo: e.target.value })} />
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Imagem</label>
            <label className="w-full p-3 bg-[#F5F2ED]/50 text-gray-400 font-bold rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f9943b] flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon size={18} />
              {formBanner.imagemUrl ? 'Selecionada ✓' : 'Escolher imagem'}
              <input type="file" className="hidden" accept="image/*"
                onChange={e => lerImagemBase64(e, url => setFormBanner({ ...formBanner, imagemUrl: url }))} />
            </label>
            {formBanner.imagemUrl && <img src={formBanner.imagemUrl} className="mt-3 w-full h-32 object-cover rounded-xl" alt="preview" />}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="banner-ativo" checked={!!formBanner.ativo}
              onChange={e => setFormBanner({ ...formBanner, ativo: e.target.checked })} />
            <label htmlFor="banner-ativo" className="text-xs font-bold text-[#394158]">Ativo (aparece na home)</label>
          </div>
          <Button onClick={salvarBanner} fullWidth size="lg" iconLeft={<CheckCircle size={18} />}>
            {formBanner.id ? 'Atualizar' : 'Publicar'}
          </Button>
        </div>
      </Modal>

      {/* MODAL NOTÍCIA */}
      <Modal open={modalNoticia} onClose={() => setModalNoticia(false)}
        title={formNoticia.id ? 'Editar notícia' : 'Nova notícia'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Categoria</label>
            <select value={formNoticia.categoria}
              onChange={e => setFormNoticia({ ...formNoticia, categoria: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]">
              {['NOTICIA', 'TECNOLOGIA', 'SUSTENTABILIDADE', 'MANEJO', 'PRODUTOR', 'MERCADO'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <FormField label="Título" value={formNoticia.titulo}
            onChange={e => setFormNoticia({ ...formNoticia, titulo: e.target.value })} />
          <FormField label="Subtítulo" value={formNoticia.subtitulo || ''}
            onChange={e => setFormNoticia({ ...formNoticia, subtitulo: e.target.value })} />
          <FormField label="Tempo de leitura" value={formNoticia.tempoLeitura}
            onChange={e => setFormNoticia({ ...formNoticia, tempoLeitura: e.target.value })} />
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Imagem</label>
            <label className="w-full p-3 bg-[#F5F2ED]/50 text-gray-400 font-bold rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f9943b] flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon size={18} />
              {formNoticia.imagemUrl ? 'Selecionada ✓' : 'Escolher imagem'}
              <input type="file" className="hidden" accept="image/*"
                onChange={e => lerImagemBase64(e, url => setFormNoticia({ ...formNoticia, imagemUrl: url }))} />
            </label>
            {formNoticia.imagemUrl && <img src={formNoticia.imagemUrl} className="mt-3 w-full h-32 object-cover rounded-xl" alt="preview" />}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Conteúdo</label>
            <textarea rows={5} value={formNoticia.descricao}
              onChange={e => setFormNoticia({ ...formNoticia, descricao: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <Button onClick={salvarNoticia} fullWidth size="lg" iconLeft={<CheckCircle size={18} />}>
            {formNoticia.id ? 'Atualizar' : 'Publicar'}
          </Button>
        </div>
      </Modal>

      {/* MODAL RECEITA */}
      <Modal open={modalReceita} onClose={() => setModalReceita(false)}
        title={formReceita.id ? 'Editar receita' : 'Nova receita'} size="lg">
        <div className="space-y-4">
          <FormField label="Título" value={formReceita.titulo}
            onChange={e => setFormReceita({ ...formReceita, titulo: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tempo de preparo" placeholder="Ex: 45 min" value={formReceita.tempo}
              onChange={e => setFormReceita({ ...formReceita, tempo: e.target.value })} />
            <div>
              <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Dificuldade</label>
              <select value={formReceita.dificuldade}
                onChange={e => setFormReceita({ ...formReceita, dificuldade: e.target.value })}
                className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-bold rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d]">
                <option value="Fácil">Fácil</option>
                <option value="Média">Média</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Descrição curta</label>
            <textarea rows={2} value={formReceita.descricao}
              onChange={e => setFormReceita({ ...formReceita, descricao: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Ingredientes (um por linha)</label>
            <textarea rows={4} value={formReceita.ingredientes}
              placeholder={"500g de carne de sol\n1kg de macaxeira cozida\n200g de queijo coalho"}
              onChange={e => setFormReceita({ ...formReceita, ingredientes: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Modo de Preparo</label>
            <textarea rows={4} value={formReceita.preparo}
              onChange={e => setFormReceita({ ...formReceita, preparo: e.target.value })}
              className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Imagem</label>
            <label className="w-full p-3 bg-[#F5F2ED]/50 text-gray-400 font-bold rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f9943b] flex items-center justify-center gap-2 cursor-pointer">
              <ImageIcon size={18} />
              {formReceita.imagem ? 'Selecionada ✓' : 'Escolher imagem'}
              <input type="file" className="hidden" accept="image/*"
                onChange={e => lerImagemBase64(e, url => setFormReceita({ ...formReceita, imagem: url }))} />
            </label>
            {formReceita.imagem && <img src={formReceita.imagem} className="mt-3 w-full h-32 object-cover rounded-xl" alt="preview" />}
          </div>
          <FormField label="URL da imagem (alternativa)" placeholder="https://..." value={formReceita.imagem || ''}
            onChange={e => setFormReceita({ ...formReceita, imagem: e.target.value })} />
          <Button onClick={salvarReceita} fullWidth size="lg" iconLeft={<CheckCircle size={18} />}>
            {formReceita.id ? 'Atualizar' : 'Publicar receita'}
          </Button>
        </div>
      </Modal>

      {/* CONFIRMAR EXCLUSÃO */}
      <Modal open={confirmar.aberto} onClose={() => setConfirmar({ aberto: false, tipo: null, id: null })} size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={28} /></div>
          <h3 className="text-lg font-black uppercase italic text-[#394158]">Tem certeza?</h3>
          <p className="text-sm text-gray-500">
            {confirmar.tipo === 'banner' && 'Este banner será removido da home.'}
            {confirmar.tipo === 'noticia' && 'Esta notícia será removida do blog.'}
            {confirmar.tipo === 'suspenderLoja' && 'A loja será suspensa e não poderá vender.'}
            {confirmar.tipo === 'receita' && 'Esta receita será removida para compradores e vendedores.'}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setConfirmar({ aberto: false, tipo: null, id: null })}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={async () => {
              if (confirmar.tipo === 'banner' && confirmar.id) await deletarBanner(confirmar.id);
              if (confirmar.tipo === 'noticia' && confirmar.id) await deletarNoticia(confirmar.id);
              if (confirmar.tipo === 'receita' && confirmar.id) deletarReceita(confirmar.id);
              if (confirmar.tipo === 'suspenderLoja' && confirmar.id) {
                try {
                  await adminSuspenderLoja(confirmar.id, 'Recusado pelo admin');
                  success('Loja suspensa');
                  setConfirmar({ aberto: false, tipo: null, id: null });
                  carregarLojasPendentes();
                } catch (err: any) {
                  toastError(err?.message || 'Erro ao suspender loja');
                }
              }
            }}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
