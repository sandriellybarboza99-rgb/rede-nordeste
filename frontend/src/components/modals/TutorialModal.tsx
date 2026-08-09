import React from 'react';
import { Search, ShoppingCart, Heart, Bell, MessageCircle, User, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-[#F5F2ED] rounded-full hover:bg-gray-200">
          <X size={20} />
        </button>

        <div className="text-center space-y-2 mt-4 md:mt-0">
          <h2 className="text-xl md:text-2xl font-black italic uppercase text-[#394158]">Guia Rápido</h2>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Aprenda a usar a plataforma</p>
        </div>

        <div className="space-y-3 max-h-[50vh] md:max-h-[60vh] overflow-y-auto no-scrollbar pb-4 px-2">
          <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
            <div className="p-3 bg-white text-[#f9943b] rounded-full shadow-sm shrink-0"><Search size={20} /></div>
            <div>
              <h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Busca &amp; Filtros</h4>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Use a busca no topo ou clique nas categorias (Laticínios, Hortifruti) para achar exatamente o que precisa.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
            <div className="p-3 bg-white text-[#55833d] rounded-full shadow-sm shrink-0"><ShoppingCart size={20} /></div>
            <div>
              <h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Carrinho</h4>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Clique no botão laranja com "+" nos produtos para adicionar ao carrinho, depois vá no ícone superior para fechar a compra.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
            <div className="p-3 bg-white text-red-500 rounded-full shadow-sm shrink-0"><Heart size={20} /></div>
            <div>
              <h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Favoritar</h4>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Gostou de algo mas não quer comprar agora? Clique no coração no canto dos produtos para salvá-lo na sua lista.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-[#F5F2ED]/50 rounded-[1.5rem] border border-gray-100">
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><Bell size={14} /></div>
                <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm"><MessageCircle size={14} /></div>
              </div>
              <div className="p-2 bg-white text-[#394158] rounded-full shadow-sm w-fit mx-auto"><User size={14} /></div>
            </div>
            <div>
              <h4 className="font-black uppercase text-[#394158] text-[10px] md:text-xs">Menu Superior (PC) / Lateral (Celular)</h4>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Notificações, Chat direto com vendedores e Meu Perfil ficam sempre acessíveis nos ícones do cabeçalho ou menu.</p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-[#55833d] text-white py-4 rounded-[1rem] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg hover:bg-[#436b2f] transition-colors mt-2">
          Entendi, Vamos Lá!
        </button>
      </div>
    </div>
  );
};
