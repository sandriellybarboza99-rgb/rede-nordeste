import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, BookOpen, Store } from 'lucide-react';

interface Empreendedora {
  id: number;
  nomeProprietaria?: string;
  nomeLoja?: string;
  cidade?: string;
  fotoEmpreendedoraUrl?: string;
  fotoPerfilUrl?: string;
  logoUrl?: string;
  historiaEmpreendedora?: string;
  descricaoBio?: string;
}

interface Props {
  mulher: Empreendedora | null;
  onClose: () => void;
}

export const ModalDetalheMulher: React.FC<Props> = ({ mulher, onClose }) => {
  const navigate = useNavigate();

  if (!mulher) return null;

  const handleVerLoja = () => {
    onClose();
    navigate(`/loja/${mulher.id}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[1rem] overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 bg-white/80 p-2 rounded-full">
          <X size={20} />
        </button>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-64 md:h-auto relative">
            <img
              src={mulher.fotoEmpreendedoraUrl || mulher.fotoPerfilUrl || mulher.logoUrl || 'https://via.placeholder.com/400'}
              className="w-full h-full object-cover"
              alt={mulher.nomeProprietaria || mulher.nomeLoja}
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#55833d]/60 to-transparent" />
          </div>
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#55833d] mb-2">
              <MapPin size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{mulher.cidade || 'Sergipe'}</span>
            </div>
            <h2 className="text-2xl font-black text-[#394158] mb-1">{mulher.nomeProprietaria || 'Produtora'}</h2>
            <span className="text-[#f9943b] font-black italic uppercase text-xs mb-6">{mulher.nomeLoja}</span>
            <div className="bg-[#F5F2ED] p-5 rounded-3xl mb-8">
              <div className="flex items-center gap-2 mb-3 text-[#394158]/50 uppercase font-black text-[9px]">
                <BookOpen size={12} /> Nossa Historia
              </div>
              <p className="text-sm text-[#394158] leading-relaxed italic">
                "{mulher.historiaEmpreendedora || mulher.descricaoBio || 'Sem descricao.'}"
              </p>
            </div>
            <button
              onClick={handleVerLoja}
              className="w-full bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3"
            >
              <Store size={16} /> Ver Loja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
