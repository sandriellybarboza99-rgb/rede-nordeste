import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, X, BookOpen, Store, ChevronLeft, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { UserMenu } from '../../components/ui/UserMenu';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { Navbar } from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Home as HomeIcon, MessageCircle, User, LayoutDashboard } from 'lucide-react';

// Dados estáticos — serão substituídos por chamada à API quando o endpoint
// GET /lojas/empreendedoras estiver pronto no backend (filtra gênero = FEMININO)
const EMPREENDEDORAS = [
  { id: 1, lojaId: 1, nome: "Dona Maria", negocio: "Cerâmicas do Povo", territorio: "Baixo São Francisco", historia: "Mestra ceramista há 30 anos em Santana do São Francisco. Aprendeu a arte com sua avó e hoje lidera uma cooperativa de 12 mulheres.", img: "https://cdn.awsli.com.br/2500x2500/1616/1616697/produto/109903915/e2bbd94d12.jpg" },
  { id: 2, lojaId: 2, nome: "Chef Ana Nunes", negocio: "Sabor de Mulher", territorio: "Grande Aracaju", historia: "Especialista em gastronomia afetiva, Ana utiliza apenas ingredientes de produtores locais para criar pratos que contam a história de Sergipe.", img: "https://www.brasildefato.com.br/wp-content/uploads/2024/09/image_processing20201106-23882-1kiy8l9.jpeg" },
  { id: 3, lojaId: 3, nome: "Lúcia da Palha", negocio: "Arte Ilha do Ferro", territorio: "Sertão Ocidental", historia: "Lúcia transforma a palha de Ouricuri em peças de design moderno sem perder a essência do artesanato tradicional.", img: "https://agenciasebrae.com.br/wp-content/uploads/2026/02/artesanato-7.jpeg" },
];

export default function Empreendedoras() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [selecionada, setSelecionada] = useState<typeof EMPREENDEDORAS[0] | null>(null);
  const [busca, setBusca] = useState('');

  const empreendedorasFiltradas = EMPREENDEDORAS.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.negocio.toLowerCase().includes(busca.toLowerCase()) ||
    m.territorio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#394158] font-sans antialiased pb-20 md:pb-0">
      <Navbar rotaAtiva="/empreendedoras" />
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        {/* Header */}
        <PageHeader
          titulo="Empreendedoras de Sergipe"
          subtitulo="Mulheres que transformam o Nordeste"
          voltarPara={perfil === 'PRODUTOR' ? '/vendedor' : '/home2'}
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
                    src={mulher.img}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={mulher.nome}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1.5 text-white/80 mb-1">
                      <MapPin size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{mulher.territorio}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-black uppercase text-[#394158] mb-1">{mulher.nome}</h3>
                  <span className="text-[#f9943b] font-black italic uppercase text-[10px] tracking-wider">{mulher.negocio}</span>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2 italic">
                    "{mulher.historia}"
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/loja/${mulher.lojaId}`); }}
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
                <img src={selecionada.img} className="w-full h-full object-cover" alt={selecionada.nome} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#55833d]/60 to-transparent" />
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#55833d] mb-2"><MapPin size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{selecionada.territorio}</span></div>
                <h2 className="text-2xl font-black text-[#394158] mb-1">{selecionada.nome}</h2>
                <span className="text-[#f9943b] font-black italic uppercase text-xs mb-6">{selecionada.negocio}</span>
                <div className="bg-[#F5F2ED] p-5 rounded-3xl mb-8">
                  <div className="flex items-center gap-2 mb-3 text-[#394158]/50 uppercase font-black text-[9px]"><BookOpen size={12} /> Nossa História</div>
                  <p className="text-sm text-[#394158] leading-relaxed italic">"{selecionada.historia}"</p>
                </div>
                <button onClick={() => { setSelecionada(null); navigate(`/loja/${selecionada.lojaId}`); }} className="w-full bg-[#55833d] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3"><Store size={16} /> Ver Loja</button>
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
