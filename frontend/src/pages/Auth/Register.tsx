import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Mail, Lock, FileText, Phone, Users,
  ArrowRight, ChevronLeft, Eye, EyeOff 
} from 'lucide-react';
import { registrarUsuario } from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const location = useLocation();
  const perfilInicial = (location.state as any)?.tipoPerfil || 'COMPRADOR';
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const [formData, setFormData] = useState({
  nomeCompleto: '',
  cpfCnpj: '',
  telefone: '',
  genero: '',
  email: '',
  senha: '',
  tipoPerfil: perfilInicial  
});

  // Funções de Máscara
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 primeiros dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 6 primeiros dígitos
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2') // Coloca hífen antes dos últimos 2 dígitos
      .slice(0, 14); // Limita o tamanho
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses no DDD
      .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen no número
      .slice(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Aplica as máscaras apenas nos campos específicos
    if (name === 'cpfCnpj') value = maskCPF(value);
    if (name === 'telefone') value = maskPhone(value);

    setFormData({ ...formData, [name]: value });
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      // Limpa os símbolos antes de enviar para o backend (envia apenas números)
      await registrarUsuario({
        nomeCompleto: formData.nomeCompleto,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        genero: formData.genero,
        email: formData.email,
        senha: formData.senha,
        tipoPerfil: formData.tipoPerfil,
      });
      
      alert("🎉 Cadastro realizado com sucesso! Faça seu login.");
      navigate('/login');
    } catch (error: any) {
      alert("⚠️ " + (error?.message || "Erro ao cadastrar. Tente novamente."));
      console.error("Erro detalhado:", error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center py-10 px-6">
      <div className="mb-8">
        <Link to="/">
          <img src="/assets/logo-login.png" alt="Rede Nordeste" className="h-32" />
        </Link>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl max-w-md w-full border border-gray-100">
        <header className="flex items-center mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="flex-1 text-center text-2xl font-black uppercase italic tracking-tighter text-[#394158]">
            Crie sua conta
          </h2>
        </header>

        <form onSubmit={handleFinalize} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              name="nomeCompleto" 
              type="text"
              placeholder="Nome Completo" 
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#55833d] transition-all" 
              onChange={handleChange}
              value={formData.nomeCompleto}
              required
            />
          </div>

          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              name="cpfCnpj" 
              type="text"
              placeholder="CPF (000.000.000-00)" 
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#55833d] transition-all" 
              onChange={handleChange}
              value={formData.cpfCnpj}
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              name="telefone" 
              type="tel"
              placeholder="Telefone (00) 00000-0000" 
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#55833d] transition-all" 
              onChange={handleChange}
              value={formData.telefone}
              required
            />
          </div>

          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              name="genero"
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-4 rounded-2xl outline-none appearance-none focus:ring-2 focus:ring-[#55833d] transition-all text-gray-700"
              onChange={handleChange}
              value={formData.genero}
              required
            >
              <option value="" disabled>Como você se identifica?</option>
              <option value="FEMININO">Feminino</option>
              <option value="MASCULINO">Masculino</option>
              <option value="NAO_INFORMAR">Prefiro não informar</option>
            </select>
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              name="email" 
              type="email"
              placeholder="E-mail" 
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#55833d] transition-all" 
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              name="senha" 
              type={mostrarSenha ? "text" : "password"}
              placeholder="Senha" 
              className="w-full bg-[#F5F2ED]/50 py-4 pl-12 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-[#55833d] transition-all" 
              onChange={handleChange}
              value={formData.senha}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f9943b] transition-colors focus:outline-none"
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <select 
              name="tipoPerfil"
              className={`w-full py-4 px-4 rounded-2xl outline-none appearance-none font-bold focus:ring-2 transition-all ${
                formData.tipoPerfil === 'PRODUTOR'
                  ? 'bg-[#A0522D] text-white focus:ring-[#A0522D]/50'
                  : 'bg-[#f9943b] text-white focus:ring-[#f9943b]/50'
              }`}
              onChange={handleChange}
              value={formData.tipoPerfil}
              required
            >
              <option value="COMPRADOR">SOU COMPRADOR</option>
              <option value="PRODUTOR">SOU PRODUTOR</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={carregando}
            className={`w-full ${carregando ? 'bg-gray-400' : 'bg-[#55833d] hover:bg-[#394158]'} text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg mt-6`}
          >
            {carregando ? 'Processando...' : 'Finalizar Cadastro'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-[#394158]/40 uppercase tracking-widest">
          Já tem uma conta? <Link to="/login" className="text-[#55833d] hover:underline">Entre aqui</Link>
        </p>
      </div>
      
      <p className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-[#394158]/60">
        © 2026 Rede Nordeste - Todos os direitos reservados.
      </p>
    </div>
  );
}