import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, X, Plus } from 'lucide-react';

interface ReceitaContexto {
  id: number;
  titulo: string;
  ingredientes: string[];
}

interface Props {
  receitaContexto: ReceitaContexto | null;
  termoPesquisado: string;
  onIngredienteClick: (ingrediente: string) => void;
  onClose: () => void;
}

const extrairTermo = (ingrediente: string): string =>
  ingrediente
    .replace(/^[\d\/\se]+(g|kg|l|ml|xícaras?|fatias?|latas?|pacotes?|litros?)?\s*(grossas\s*)?(de\s*)?/i, '')
    .replace(/ para acompanhar| a gosto|\(já lavado\)/gi, '')
    .trim();

export const RecipeWidget: React.FC<Props> = ({
  receitaContexto,
  termoPesquisado,
  onIngredienteClick,
  onClose,
}) => {
  const navigate = useNavigate();
  const [minimizado, setMinimizado] = useState(false);

  if (!receitaContexto) return null;

  const handleVoltar = () => {
    onClose();
    navigate('/receitas');
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-tl-2xl rounded-tr-2xl md:rounded-2xl border border-gray-200 bg-white
        bottom-[70px] md:bottom-6 right-0 md:right-6 left-0 md:left-auto w-full md:w-[350px]
        ${minimizado ? 'translate-y-[calc(100%-60px)] md:translate-y-0' : 'translate-y-0'}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-[#f9943b] text-white rounded-t-2xl cursor-pointer md:cursor-default"
        onClick={() => { if (window.innerWidth < 768) setMinimizado(m => !m); }}
      >
        <div className="flex items-center gap-2 font-bold truncate">
          <Sparkles size={18} />
          <span className="truncate">Lista: {receitaContexto.titulo}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setMinimizado(m => !m); }}
            className="hidden md:block p-1 hover:bg-white/20 rounded-full transition-colors"
            title={minimizado ? 'Expandir' : 'Minimizar'}
          >
            {minimizado ? <Plus size={18} /> : <div className="w-3 h-0.5 bg-white m-1" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            className="p-1 hover:bg-red-500 rounded-full transition-colors"
            title="Fechar Lista"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Corpo */}
      {!minimizado && (
        <div className="p-4 max-h-[40vh] md:max-h-[300px] overflow-y-auto">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Ingredientes</p>
          <div className="flex flex-col gap-2">
            {receitaContexto.ingredientes.map((ingrediente, index) => {
              const termoExtraido = extrairTermo(ingrediente);
              const isAtivo = termoPesquisado.toLowerCase() === termoExtraido.toLowerCase();

              return (
                <button
                  key={index}
                  onClick={() => onIngredienteClick(ingrediente)}
                  className={`flex items-start text-left gap-3 p-2 rounded-xl transition-all border ${
                    isAtivo
                      ? 'bg-[#f9943b]/10 border-[#f9943b] text-[#f9943b]'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100 text-[#394158]'
                  }`}
                >
                  <div className={`mt-0.5 min-w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isAtivo ? 'border-[#f9943b] bg-[#f9943b]' : 'border-gray-300'
                  }`}>
                    {isAtivo && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm leading-tight ${isAtivo ? 'font-bold' : 'font-medium'}`}>
                    {ingrediente}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleVoltar}
              className="w-full py-2 text-sm font-bold text-[#394158] hover:text-[#f9943b] transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen size={16} /> Voltar para Receitas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
