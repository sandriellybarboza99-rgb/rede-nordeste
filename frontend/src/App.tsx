import React, { useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import type { Perfil as TipoPerfil } from './context/AuthContext';
import { useToast } from './context/ToastContext';

import Home from './pages/Home/Home';
import HomeComprador from './pages/Comprador/HomeComprador';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Receitas from './pages/Comprador/Receitas';
import ProdutoDetalhes from './pages/Comprador/ProdutoDetalhes';
import Carrinho from './pages/Comprador/Carrinho';
import Chat from './pages/Comprador/Chat';
import Blog from './pages/Blog/Blog';
import Post from './pages/Blog/Post';
import Loja from './pages/Comprador/Loja';
import Perfil from './pages/Comprador/Perfil';
import Notificacao from './pages/Comprador/Notificacao';
import Empreendedoras from './pages/Comprador/Empreendedoras';
import HomeVendedor from './pages/Vendedor/HomeVendedor';
import PainelVendedor from './pages/Vendedor/PainelVendedor';
import HomeAdmin from './pages/Admin/HomeAdmin';
import PerfilVendedor from './pages/Vendedor/PerfilVendedor';
import ReceitasVendedor from './pages/Vendedor/ReceitasVendedor';

// ── Helpers ───────────────────────────────────────────────────────
const HOME_POR_PERFIL: Record<TipoPerfil, string> = {
  ADMIN: '/admin',
  PRODUTOR: '/vendedor',
  COMPRADOR: '/home2',
};

// ── Loading splash ────────────────────────────────────────────────
const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#55833d] border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-[#394158]/60">
        Carregando...
      </p>
    </div>
  </div>
);

// ── Guard genérico: exige perfil(s) específico(s) ─────────────────
// ADMIN tem acesso a tudo (modo impersonate, conforme decisão da Rodada 1).
//
// Detalhe importante: `permitidos` é array literal recriado a cada render
// do componente pai. Se usássemos ele como dep do useEffect, o efeito
// dispararia em loop — toast aparecendo dezenas de vezes. Por isso
// guardamos a chave do array como string e usamos `useRef` para garantir
// que o warning seja exibido apenas UMA VEZ por mudança de rota.
const RotaProtegida: React.FC<{
  permitidos: TipoPerfil[];
  children: React.ReactNode;
}> = ({ permitidos, children }) => {
  const { estaLogado, perfil, carregando } = useAuth();
  const { warning } = useToast();
  const location = useLocation();

  const chavePermissoes = permitidos.join(',');
  const jaAvisado = useRef<string | null>(null);

  useEffect(() => {
    if (carregando || !estaLogado || !perfil) return;
    if (perfil === 'ADMIN') return;
    if (permitidos.includes(perfil)) return;

    // Só avisa uma vez por combinação rota+perfil — evita toast em loop
    const chave = `${location.pathname}|${perfil}|${chavePermissoes}`;
    if (jaAvisado.current === chave) return;
    jaAvisado.current = chave;

    warning(`Essa área é exclusiva para ${permitidos.join(' ou ')}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, estaLogado, perfil, chavePermissoes, location.pathname]);

  if (carregando) return <Splash />;
  if (!estaLogado) return <Navigate to="/login" state={{ from: location }} replace />;

  // ADMIN passa em qualquer rota (impersonate)
  if (perfil === 'ADMIN') return <>{children}</>;

  if (!perfil || !permitidos.includes(perfil)) {
    return <Navigate to={HOME_POR_PERFIL[perfil ?? 'COMPRADOR']} replace />;
  }
  return <>{children}</>;
};

// ── Rota /login e /cadastro: se já logado, redireciona pra home ──
const RotaAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaLogado, perfil, carregando } = useAuth();
  if (carregando) return <Splash />;
  if (estaLogado && perfil) return <Navigate to={HOME_POR_PERFIL[perfil]} replace />;
  return <>{children}</>;
};

// ── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F2ED] text-[#394158] antialiased">
        <Routes>

          {/* ── PÚBLICAS ─────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<Post />} />
          <Route path="/login" element={<RotaAuth><Login /></RotaAuth>} />
          <Route path="/cadastro" element={<RotaAuth><Register /></RotaAuth>} />

          {/* ── MARKETPLACE — qualquer logado pode comprar ─────────
             Regra: COMPRADOR só compra; PRODUTOR vende E também pode
             comprar de outras lojas. Por isso todas as rotas de "área
             de compra" aceitam ambos. ADMIN passa em qualquer rota. */}
          <Route path="/home2" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><HomeComprador /></RotaProtegida>} />
          <Route path="/receitas" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Receitas /></RotaProtegida>} />
          <Route path="/produto/:id" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><ProdutoDetalhes /></RotaProtegida>} />
          <Route path="/loja/:id" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Loja /></RotaProtegida>} />
          <Route path="/carrinho" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Carrinho /></RotaProtegida>} />
          <Route path="/notificacoes" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Notificacao /></RotaProtegida>} />
          <Route path="/perfil" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Perfil /></RotaProtegida>} />

          {/* ── CHAT — comprador ou vendedor ─────────────────── */}
          <Route path="/chat" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Chat /></RotaProtegida>} />

          {/* ── EMPREENDEDORAS ───────────────────────────────── */}
          <Route path="/empreendedoras" element={<RotaProtegida permitidos={['COMPRADOR', 'PRODUTOR']}><Empreendedoras /></RotaProtegida>} />

          {/* ── VENDEDOR ─────────────────────────────────────── */}
          <Route path="/vendedor" element={<RotaProtegida permitidos={['PRODUTOR']}><HomeVendedor /></RotaProtegida>} />
          <Route path="/painelvendedor" element={<RotaProtegida permitidos={['PRODUTOR']}><PainelVendedor /></RotaProtegida>} />
          <Route path="/perfilvendedor" element={<RotaProtegida permitidos={['PRODUTOR']}><PerfilVendedor /></RotaProtegida>} />
          <Route path="/receitasvendedor" element={<RotaProtegida permitidos={['PRODUTOR']}><ReceitasVendedor /></RotaProtegida>} />

          {/* ── ADMIN ────────────────────────────────────────── */}
          <Route path="/admin" element={<RotaProtegida permitidos={['ADMIN']}><HomeAdmin /></RotaProtegida>} />

          {/* ── FALLBACK ─────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
