import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpreendedoras } from '../../services/api';
import { MapPin, Star, X, BookOpen, Store, ChevronLeft, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { UserMenu } from '../../components/ui/UserMenu';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { Navbar } from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Home as HomeIcon, MessageCircle, User, LayoutDashboard } from 'lucide-react';

// Os dados agora são carregados da API.

export default function Empreendedoras() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [empreendedoras, setEmpreendedoras] = useState<any[]>([]);
  const [selecionada, setSelecionada] = useState<any | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    getEmpreendedoras()
      .then(setEmpreendedoras)
      .catch(err => console.error("Erro ao carregar empreendedoras", err));
  }, []);

  const empreendedorasFiltradas = empreendedoras.filter(m =>
    (m.nomeProprietaria || '').toLowerCase().includes(busca.toLowerCase()) ||
    (m.nomeLoja || '').toLowerCase().includes(busca.toLowerCase()) ||
    (m.cidade || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans antialiased pb-20 md:pb-0">
      <Navbar rotaAtiva="/empreendedoras" />
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        {/* Header */}
        <PageHeader
          titulo="Empreendedoras de Sergipe"
          subtitulo="Mulheres que transformam o Nordeste"
          voltarPara={perfil === 'PRODUTOR' ? '/home2' : '/home2'}
          labelVoltar="Início"
        />

        {/* Busca */}
        <div className="relative w-full mb-8 max-w-md mx-auto">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar empreendedora..."
            className="w-full bg-white py-3 pl-6 pr-12 rounded-full border border-gray-100 shadow-sm outline-none text-sm focus:ring-2 focus:ring-[#55833d] transition-all"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        {/* Título da seção */}
        <div className="flex items-center gap-3 mb-8">
          <Star size={20} className="fill-[#FFCD0D] text-[#FFCD0D]" />
          <h2 className="text-lg md:text-2xl font-black italic uppercase tracking-widest text-[#394158]">
            Todas as Empreendedoras
          </h2>
        </div>

        {/* Grid de empreendedoras */}
        {empreendedorasFiltradas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
              Nenhuma empreendedora encontrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {empreendedorasFiltradas.map(mulher => (
              <div
                key={mulher.id}
                onClick={() => setSelecionada(mulher)}
                className="bg-white rounded-[1.5rem] overflow-hidden shadow-lg group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-50"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={mulher.fotoEmpreendedoraUrl || mulher.fotoPerfilUrl || mulher.logoUrl || 'https://via.placeholder.com/400'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={mulher.nomeProprietaria || mulher.nomeLoja}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1.5 text-white/80 mb-1">
                      <MapPin size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{mulher.cidade || 'Sergipe'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-black uppercase text-[#394158] mb-1">{mulher.nomeProprietaria || 'Produtora'}</h3>
                  <span className="text-[#f9943b] font-black italic uppercase text-[10px] tracking-wider">{mulher.nomeLoja}</span>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2 italic">
                    "{mulher.historiaEmpreendedora || mulher.descricaoBio || 'Sem descricao.'}"
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/loja/${mulher.id}`); }}
                    className="mt-4 w-full bg-[#55833d] text-white py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-[#436b2f] transition-colors"
                  >
                    <Store size={14} /> Ver Loja
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalhe */}
      {selecionada && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelecionada(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[1rem] overflow-hidden shadow-2xl">
            <button onClick={() => setSelecionada(null)} className="absolute top-6 right-6 z-10 bg-white/80 p-2 rounded-full"><X size={20} /></button>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={selecionada.fotoEmpreendedoraUrl || selecionada.fotoPerfilUrl || selecionada.logoUrl || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt={selecionada.nomeProprietaria || selecionada.nomeLoja} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#55833d]/60 to-transparent" />
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#55833d] mb-2"><MapPin size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{selecionada.cidade || 'Sergipe'}</span></div>
                <h2 className="text-2xl font-black text-[#394158] mb-1">{selecionada.nomeProprietaria || 'Produtora'}</h2>
                <span className="text-[#f9943b] font-black italic uppercase text-xs mb-6">{selecionada.nomeLoja}</span>
                <div className="bg-[#F5F2ED] p-5 rounded-3xl mb-8">
                  <div className="flex items-center gap-2 mb-3 text-[#394158]/50 uppercase font-black text-[9px]"><BookOpen size={12} /> Nossa História</div>
                  <p className="text-sm text-[#394158] leading-relaxed italic">"{selecionada.historiaEmpreendedora || selecionada.descricaoBio || 'Sem descricao.'}"</p>
                </div>
                <button onClick={() => { setSelecionada(null); navigate(`/loja/${selecionada.id}`); }} className="w-full bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3"><Store size={16} /> Ver Loja</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar
        tabs={[
          { to: '/home2', label: 'Início', Icon: HomeIcon },
          { to: '/receitas', label: 'Receitas', Icon: LayoutDashboard },
          { to: '/chat', label: 'Chat', Icon: MessageCircle },
          { to: '/perfil', label: 'Perfil', Icon: User },
        ]}
      />
    </div>
  );
}
