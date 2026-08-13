import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Info } from 'lucide-react';

interface ModalLoginRequiredProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const ModalLoginRequired: React.FC<ModalLoginRequiredProps> = ({ 
  open, 
  onClose,
  title = "Cadastro Necessário",
  message = "Você precisa estar logado para realizar esta ação. Junte-se à nossa rede para comprar e favoritar produtos incríveis do Nordeste!"
}) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-[#F5F2ED] rounded-full text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="w-16 h-16 bg-orange-50 text-[#f9943b] rounded-full flex items-center justify-center mb-2">
            <Info size={32} />
          </div>
          
          <h3 className="text-lg font-black uppercase text-[#394158]">{title}</h3>
          
          <p className="text-xs text-gray-500 leading-relaxed font-medium pb-4">
            {message}
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/cadastro')}
              className="w-full flex items-center justify-center gap-2 bg-[#f9943b] text-white py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-[#ff8a23] transition-colors shadow-md active:scale-95"
            >
              <UserPlus size={16} /> Criar minha conta
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 bg-[#F5F2ED] text-[#394158] py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors active:scale-95"
            >
              <LogIn size={16} /> Já tenho conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
