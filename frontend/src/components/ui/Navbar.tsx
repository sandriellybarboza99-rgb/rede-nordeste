import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell, MessageCircle, HelpCircle, Menu, X, ChevronRight } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  /** Rota ativa para destacar o link (ex: '/home2', '/receitas') */
  rotaAtiva?: string;
}

/**
 * Navbar padronizada que aparece no topo de todas as páginas logadas.
 * Contém: logo, links de navegação, barra de busca (apenas visual — a pesquisa
 * real continua sendo feita pela Home), ícones de ação e UserMenu.
 */
export const Navbar: React.FC<NavbarProps> = ({ rotaAtiva }) => {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [menuAberto, setMenuAberto] = React.useState(false);

  const isVendedor = perfil === 'PRODUTOR';
  const homePath = isVendedor ? '/vendedor' : '/home2';
  const receitasPath = isVendedor ? '/receitasvendedor' : '/receitas';
  const perfilPath = isVendedor ? '/perfilvendedor' : '/perfil';

  const links = isVendedor
    ? [
        { to: '/vendedor', label: 'Início' },
        { to: '/receitasvendedor', label: 'Receitas' },
        { to: '/blog', label: 'Notícias' },
        { to: '/painelvendedor', label: 'Painel Vendedor' },
      ]
    : [
        { to: '/home2', label: 'Início' },
        { to: '/receitas', label: 'Receitas' },
        { to: '/blog', label: 'Notícias' },
      ];

  const getIconClass = (path: string) => {
    const base = "relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 group ";
    if (rotaAtiva === path) {
      return base + "bg-[#f9943b] text-white";
    }
    return base + "hover:bg-[#f9943b] hover:text-white text-[#394158]";
  };

  return (
    <>
      <header className="w-full bg-white py-4 px-4 md:px-8 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-10 flex-shrink-0">
            <Link to={homePath}><img src="/assets/logo-home.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" /></Link>
            <nav className="hidden lg:flex gap-6 text-xs md:text-sm font-medium text-[#394158]">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={rotaAtiva === link.to
                    ? 'text-[#f9943b] border-b-2 border-[#f9943b] pb-1'
                    : 'hover:text-[#f9943b] transition-colors'
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>



          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Link title="Notificações" to="/notificacoes" className={getIconClass('/notificacoes')}>
                <Bell className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </Link>
              <Link title="Chat" to="/chat" className={getIconClass('/chat')}>
                <MessageCircle className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </Link>
              <Link title="Carrinho" to="/carrinho" className={getIconClass('/carrinho')}>
                <ShoppingCart className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
              </Link>
              <UserMenu perfilPath={perfilPath} />
            </div>

            {/* Mobile */}
            <div className="flex lg:hidden items-center gap-3">
              <UserMenu perfilPath={perfilPath} />
              <button onClick={() => setMenuAberto(true)} className="p-1 text-[#394158] hover:text-[#f9943b]"><Menu size={24} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-8 flex flex-col gap-8">
            <button onClick={() => setMenuAberto(false)} className="self-end p-2 bg-[#F5F2ED] rounded-full"><X size={24} /></button>
            <nav className="flex flex-col gap-5 text-sm font-medium text-[#394158]">
              {links.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]">
                  <ChevronRight size={14} /> {link.label}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <Link to="/notificacoes" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><Bell size={20} /> Notificações</Link>
              <Link to="/chat" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><MessageCircle size={20} /> Chat</Link>
              <Link to="/carrinho" onClick={() => setMenuAberto(false)} className="flex items-center gap-4 hover:text-[#55833d]"><ShoppingCart size={20} /> Carrinho</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
