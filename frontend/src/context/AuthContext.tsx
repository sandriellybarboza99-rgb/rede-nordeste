import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { logoutBackend } from "../services/api";

/**
 * ⚠️  TRADE-OFF DE SEGURANÇA CONHECIDO — Tokens em localStorage
 * ──────────────────────────────────────────────────────────────
 * Esta aplicação armazena accessToken e refreshToken em localStorage.
 *
 * Vantagens (por que escolhemos isso aqui):
 *   • Simplicidade — funciona em qualquer SPA sem precisar configurar CSRF.
 *   • Multi-aba — todas as abas leem a mesma sessão automaticamente.
 *   • Demo/aulas — alunas conseguem inspecionar o token no DevTools.
 *
 * Riscos (o que esse trade-off custa):
 *   • Qualquer XSS executado neste domínio LÊ os tokens e pode se passar
 *     pelo usuário em outra máquina (token roubado).
 *   • Cookie HttpOnly + SameSite=Strict + Secure não é vulnerável a XSS,
 *     mas exige CSRF token em todas as requisições não-idempotentes.
 *
 * Para produção real, considere migrar para o padrão de cookies HttpOnly:
 *   1. Backend devolve o refreshToken em Set-Cookie HttpOnly em /login.
 *   2. accessToken pode continuar no body, vivendo apenas em memória
 *      (não persistido — recuperado via /refresh quando expira).
 *   3. Habilitar CSRF protection no Spring Security + enviar X-CSRF-Token
 *      em cada POST/PATCH/DELETE.
 *   4. Configurar SameSite=Strict no cookie para mitigar CSRF mesmo assim.
 */

// ── Tipos ────────────────────────────────────────────────────────
export type Perfil = "ADMIN" | "PRODUTOR" | "COMPRADOR";

export interface UsuarioLogado {
  accessToken: string;
  refreshToken: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoPerfilUrl?: string;
  perfil: Perfil;
}

interface AuthContextValue {
  usuario: UsuarioLogado | null;
  perfil: Perfil | null;
  estaLogado: boolean;
  carregando: boolean;
  login: (dados: UsuarioLogado) => void;
  logout: (motivo?: string) => Promise<void>;
  atualizarTokens: (parcial: Partial<UsuarioLogado>) => void;
}

const PERFIS_VALIDOS: Perfil[] = ["ADMIN", "PRODUTOR", "COMPRADOR"];
const STORAGE_KEY = "usuarioLogado";
const STORAGE_LIXOS = [
  "user_role",
  "mock_carrinho",
  "tutorial_visto_comprador",
  "tutorial_visto_vendedor",
  "favoritos_itens",
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Helpers internos ─────────────────────────────────────────────
const lerSessao = (): UsuarioLogado | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (!PERFIS_VALIDOS.includes(obj.perfil)) return null;
    if (typeof obj.accessToken !== "string" || obj.accessToken.length < 10) return null;
    return obj as UsuarioLogado;
  } catch {
    return null;
  }
};

const limparTudo = () => {
  localStorage.removeItem(STORAGE_KEY);
  STORAGE_LIXOS.forEach((k) => localStorage.removeItem(k));
};

// ── Provider ─────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Hidrata no mount + sincroniza entre abas via 'storage' event
  useEffect(() => {
    setUsuario(lerSessao());
    setCarregando(false);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        setUsuario(lerSessao());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((dados: UsuarioLogado) => {
    if (!PERFIS_VALIDOS.includes(dados.perfil)) {
      console.warn("[Auth] Perfil inválido recebido do backend:", dados.perfil);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    setUsuario(dados);
  }, []);

  const atualizarTokens = useCallback((parcial: Partial<UsuarioLogado>) => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const novo = { ...prev, ...parcial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
      return novo;
    });
  }, []);

  const logout = useCallback(async (_motivo?: string) => {
    const atual = lerSessao();
    try {
      if (atual?.refreshToken) await logoutBackend(atual.refreshToken);
    } catch {
      // best-effort — se o backend cair, ainda limpamos local
    }
    limparTudo();
    setUsuario(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    usuario,
    perfil: usuario?.perfil ?? null,
    estaLogado: !!usuario,
    carregando,
    login,
    logout,
    atualizarTokens,
  }), [usuario, carregando, login, logout, atualizarTokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook público ─────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};

// Utilitário standalone — usado em api.ts onde não temos hook React
export const lerSessaoStandalone = lerSessao;
export const limparSessaoStandalone = limparTudo;
