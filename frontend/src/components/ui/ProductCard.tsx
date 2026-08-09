import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, MapPin } from 'lucide-react';

interface Produto {
  id: number;
  nome: string;
  nomeCategoria?: string;
  imagemUrl?: string;
  nomeLoja?: string;
  cidade?: string;
  estado?: string;
  precoAtual?: number;
}

interface Props {
  prod: Produto;
  isFavorito: boolean;
  onToggleFavorito: (e: React.MouseEvent, id: number) => void;
  onAdicionarRapido: (e: React.MouseEvent, id: number) => void;
}

/**
 * Card individual de produto.
 * Wrapped em React.memo: só re-renderiza quando suas próprias props mudarem,
 * isolando o grid de produto de re-renders causados por alterações de filtros,
 * abertura de modais ou mudança de busca.
 */
export const ProductCard: React.FC<Props> = React.memo(({ prod, isFavorito, onToggleFavorito, onAdicionarRapido }) => {
  return (
    <div className="relative bg-white p-2 md:p-5 rounded-[1rem] shadow-xl flex flex-col group border border-transparent hover:border-[#55833d]/20 transition-all">
      <button
        onClick={e => onToggleFavorito(e, prod.id)}
        className="absolute top-3 left-3 z-20 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform"
        aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart size={14} className={isFavorito ? 'fill-[#802D44] text-[#802D44]' : 'text-gray-400'} />
      </button>

      <div className="relative overflow-hidden rounded-[1rem] mb-3 md:mb-4 aspect-square">
        <Link to={`/produto/${prod.id}`}>
          <img
            src={prod.imagemUrl || 'https://via.placeholder.com/400'}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
            alt={prod.nome}
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          onClick={e => onAdicionarRapido(e, prod.id)}
          className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[#f9943b] text-white p-1.5 md:p-2.5 rounded-full shadow-xl z-10 active:scale-90"
          aria-label="Adicionar ao carrinho"
        >
          <Plus size={14} />
        </button>
      </div>

      <span className="text-[8px] md:text-[9px] font-black uppercase text-[#55833d] mb-1">
        {prod.nomeCategoria}
      </span>

      <Link to={`/produto/${prod.id}`}>
        <h3 className="font-bold text-[#394158] text-[11px] md:text-sm leading-tight mb-1 line-clamp-1 hover:text-[#55833d] transition-colors">
          {prod.nome}
        </h3>
      </Link>

      <div className="flex items-center gap-1 text-[#394158]/50 mb-2 uppercase font-bold text-[8px] md:text-[9px]">
        <MapPin size={8} />
        {prod.nomeLoja}
        {prod.cidade ? ` • ${prod.cidade}${prod.estado ? `/${prod.estado}` : ''}` : ''}
      </div>

      <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
        <span className="text-xs md:text-lg font-black text-[#394158]">
          R$ {prod.precoAtual?.toFixed(2)}
        </span>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
