import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { login } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/Input';

const HOME_POR_PERFIL: Record<string, string> = {
  ADMIN: '/admin',
  PRODUTOR: '/home2',
  COMPRADOR: '/home2',
};

export default function Login() {
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [exibirEsqueciSenha, setExibirEsqueciSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const dados = await login(email, senha);
      loginContext(dados);
      success(`Bem-vindo de volta, ${dados.nome?.split(' ')[0] || 'usuário'}!`);
      navigate(HOME_POR_PERFIL[dados.perfil] || '/', { replace: true });
    } catch (err: any) {
      toastError(err?.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      // TODO: endpoint /api/usuarios/recuperar-senha (a implementar).
      info('Em breve: link de recuperação por e-mail. Entre em contato com o suporte.');
      setExibirEsqueciSenha(false);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center px-6 py-10">
      <Link to="/" className="mb-8 md:mb-10">
        <img src="/assets/logo-login.png" alt="Rede Nordeste" className="h-28 md:h-36" />
      </Link>

      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
        {!exibirEsqueciSenha ? (
          <>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#394158] mb-6 md:mb-8 text-center">
              Bem-vindo de volta
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <FormField
                type="email"
                placeholder="Seu e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                iconLeft={<Mail size={18} />}
                autoComplete="email"
              />
              <FormField
                type={mostrarSenha ? "text" : "password"}
                placeholder="Sua senha"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                iconLeft={<Lock size={18} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="focus:outline-none hover:text-[#f9943b] transition-colors"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                autoComplete="current-password"
              />
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setExibirEsqueciSenha(true)}
                  className="text-xs text-[#394158] font-semibold hover:text-[#f9943b] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Button
                type="submit"
                loading={carregando}
                fullWidth
                size="lg"
                iconRight={<ArrowRight size={16} />}
              >
                {carregando ? 'Validando...' : 'Entrar na Rede'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => setExibirEsqueciSenha(false)}
              className="flex items-center gap-2 text-xs font-bold text-[#394158] mb-6 hover:text-[#f9943b] transition-colors"
            >
              <ArrowLeft size={16} /> Voltar ao login
            </button>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#394158] mb-4 text-center">
              Recuperar Senha
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6 font-medium">
              Informe seu e-mail para receber um link de redefinição.
            </p>
            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <FormField
                type="email"
                placeholder="E-mail de cadastro"
                required
                value={emailRecuperacao}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
                iconLeft={<Mail size={18} />}
              />
              <Button
                type="submit"
                loading={carregando}
                fullWidth
                size="lg"
                variant="warning"
                iconRight={<ArrowRight size={16} />}
              >
                {carregando ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 md:mt-8 text-center">
          <Link
            to="/cadastro"
            className="text-sm font-medium text-[#394158]/60 hover:text-[#f9943b]"
          >
            Não tem conta? <span className="font-black">Cadastre-se aqui</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
