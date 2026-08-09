import React from 'react';
import { Filter, MapPin } from 'lucide-react';

interface Faceta {
  chave: string;
  quantidade: number;
}

interface EstadoNordeste {
  uf: string;
  nome: string;
}

interface Props {
  estadoFiltro: string;
  cidadeFiltro: string;
  ordenacao: string;
  facetasEstados: Faceta[];
  facetasCidades: Faceta[];
  estadosNordeste: EstadoNordeste[];
  onEstadoChange: (estado: string) => void;
  onCidadeChange: (cidade: string) => void;
  onOrdenacaoChange: (ordenacao: string) => void;
}

export const ProductFilters: React.FC<Props> = ({
  estadoFiltro,
  cidadeFiltro,
  ordenacao,
  facetasEstados,
  facetasCidades,
  estadosNordeste,
  onEstadoChange,
  onCidadeChange,
  onOrdenacaoChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtro por Estado */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
        <MapPin size={14} className="text-[#55833d]" />
        <select
          value={estadoFiltro}
          onChange={e => onEstadoChange(e.target.value)}
          className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#394158]"
        >
          <option value="">Todos os Estados</option>
          {facetasEstados.map(f => {
            const est = estadosNordeste.find(e => e.uf === f.chave);
            return (
              <option key={f.chave} value={f.chave}>
                {est ? est.nome : f.chave} ({f.quantidade})
              </option>
            );
          })}
        </select>
      </div>

      {/* Filtro por Cidade */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
        <select
          value={cidadeFiltro}
          onChange={e => onCidadeChange(e.target.value)}
          className="bg-transparent text-[10px] font-bold outline-none w-24 md:w-32 text-[#394158] uppercase cursor-pointer"
        >
          <option value="">Todas as Cidades</option>
          {facetasCidades.map(f => (
            <option key={f.chave} value={f.chave}>
              {f.chave} ({f.quantidade})
            </option>
          ))}
        </select>
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
        <Filter size={14} className="text-[#55833d]" />
        <select
          value={ordenacao}
          onChange={e => onOrdenacaoChange(e.target.value)}
          className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#394158]"
        >
          <option value="recomendados">Recomendados</option>
          <option value="menor_preco">Menor Preço</option>
          <option value="maior_preco">Maior Preço</option>
        </select>
      </div>
    </div>
  );
};
