import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField } from '../ui/Input';
import { CheckCircle, Camera, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { consultarCep } from '../../services/api';

interface ModalLojaProps {
  open: boolean;
  onClose: () => void;
  lojaAtual: any | null; // Dados da loja se estiver editando, ou null se for criação
  onSave: (dadosLoja: any) => Promise<void>;
}

export const ModalLoja: React.FC<ModalLojaProps> = ({ open, onClose, lojaAtual, onSave }) => {
  const { success, error: toastError } = useToast();

  // Estado local do formulário
  const [formLoja, setFormLoja] = useState<any>({});
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Sincroniza o form sempre que o modal abre
  useEffect(() => {
    if (open) {
      setFormLoja(lojaAtual || {
        nomeLoja: '', descricaoBio: '', historia: '',
        cidade: '', estado: 'SE', cep: '', bairro: '', logradouro: '',
        latitudeLoja: null, longitudeLoja: null, logoUrl: '',
        aceitaRetirada: false, fazEntrega: false
      });
    }
  }, [open, lojaAtual]);

  const lerImagemBase64 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError('Imagem muito grande (máx 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFormLoja((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };



  // Monitora digitação do CEP para buscar automaticamente
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawCep = e.target.value;
    let cepNumeros = rawCep.replace(/\D/g, '');

    // Formata o CEP se for maior que 5 (00000-000)
    let cepFormatado = cepNumeros;
    if (cepNumeros.length > 5) {
      cepFormatado = `${cepNumeros.substring(0, 5)}-${cepNumeros.substring(5, 8)}`;
    }

    setFormLoja((prev: any) => ({ ...prev, cep: cepFormatado }));

    if (cepNumeros.length === 8) {
      setBuscandoCep(true);
      const dadosCep = await consultarCep(cepNumeros);
      setBuscandoCep(false);

      if (dadosCep) {
        setFormLoja((prev: any) => ({
          ...prev,
          cidade: dadosCep.localidade || prev.cidade,
          estado: dadosCep.uf || prev.estado,
          bairro: dadosCep.bairro || prev.bairro,
          logradouro: dadosCep.logradouro || prev.logradouro
        }));
        success('Endereço encontrado via CEP!');
      } else {
        toastError('CEP não encontrado');
      }
    }
  };

  const handleSalvar = async () => {
    if (!formLoja.nomeLoja) {
      toastError('Nome da loja é obrigatório');
      return;
    }

    if (formLoja.aceitaRetirada) {
      if (!formLoja.cidade || !formLoja.estado || !formLoja.logradouro) {
        toastError('Para aceitar retirada, preencha Cidade, Estado e Endereço Completo');
        return;
      }
    } else {
      // Se não aceita retirada, limpa campos de endereço para não enviar lixo
      formLoja.cidade = null;
      formLoja.estado = null;
      formLoja.cep = null;
      formLoja.bairro = null;
      formLoja.logradouro = null;
      formLoja.latitudeLoja = null;
      formLoja.longitudeLoja = null;
    }

    setSalvando(true);
    await onSave(formLoja);
    setSalvando(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={lojaAtual ? 'Editar minha loja' : 'Criar minha loja'} size="lg">
      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
          {/* Upload de Logo - Circular */}
          <div className="flex-shrink-0">
            <label className="relative w-28 h-28 rounded-full bg-[#F5F2ED] border-2 border-dashed border-gray-300 hover:border-[#f9943b] flex items-center justify-center cursor-pointer overflow-hidden group shadow-sm transition-colors">
              {formLoja.logoUrl ? (
                <>
                  <img src={formLoja.logoUrl} alt="Logo da Loja" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-[#f9943b] transition-colors">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">Add<br />Logo</span>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={lerImagemBase64} />
            </label>
          </div>

          <div className="flex-1 w-full space-y-4">
            <FormField label="Nome da loja *" value={formLoja.nomeLoja || ''}
              onChange={e => setFormLoja({ ...formLoja, nomeLoja: e.target.value })} />

            <div>
              <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5">Descrição</label>
              <textarea rows={2} value={formLoja.descricaoBio || ''}
                onChange={e => setFormLoja({ ...formLoja, descricaoBio: e.target.value })}
                placeholder="Conte a história da loja..."
                className="w-full p-3 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none" />
            </div>
          </div>
        </div>

        {/* Opções de Logística */}
        <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl space-y-4 border border-gray-100">
          <h4 className="text-[10px] font-black uppercase text-[#55833d] tracking-widest">Opções de Logística</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
            <label className="flex items-center gap-3 font-bold text-[#394158] cursor-pointer hover:text-[#55833d] transition-colors">
              <input type="checkbox" checked={!!formLoja.aceitaRetirada}
                onChange={e => setFormLoja({ ...formLoja, aceitaRetirada: e.target.checked })}
                className="w-5 h-5 text-[#55833d] rounded focus:ring-[#55833d] accent-[#55833d]" />
              Aceita retirada no local
            </label>
            <label className="flex items-center gap-3 font-bold text-[#394158] cursor-pointer hover:text-[#55833d] transition-colors">
              <input type="checkbox" checked={!!formLoja.fazEntrega}
                onChange={e => setFormLoja({ ...formLoja, fazEntrega: e.target.checked })}
                className="w-5 h-5 text-[#55833d] rounded focus:ring-[#55833d] accent-[#55833d]" />
              Faz entrega
            </label>
          </div>
        </div>

        {/* Seção de Endereço - Condicional */}
        {formLoja.aceitaRetirada && (
          <div className="space-y-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="text-xs font-black uppercase italic text-[#394158]">Endereço de Retirada</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FormField label="CEP" value={formLoja.cep || ''} maxLength={9}
                  onChange={handleCepChange} placeholder="00000-000" />
                {buscandoCep && (
                  <div className="absolute right-3 top-[38px]">
                    <Loader2 className="w-4 h-4 text-[#f9943b] animate-spin" />
                  </div>
                )}
              </div>
              <FormField label="Bairro" value={formLoja.bairro || ''}
                onChange={e => setFormLoja({ ...formLoja, bairro: e.target.value })} />
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <FormField label="Cidade *" value={formLoja.cidade || ''}
                onChange={e => setFormLoja({ ...formLoja, cidade: e.target.value })} />
              <FormField label="Estado (UF) *" value={formLoja.estado || 'SE'} maxLength={2}
                onChange={e => setFormLoja({ ...formLoja, estado: e.target.value.toUpperCase() })} />
            </div>

            <FormField label="Endereço Completo (Rua, Nº, Comp.) *" value={formLoja.logradouro || ''}
              onChange={e => setFormLoja({ ...formLoja, logradouro: e.target.value })} />


          </div>
        )}

        <Button onClick={handleSalvar} fullWidth size="lg" iconLeft={salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />} disabled={salvando}>
          {salvando ? 'Salvando...' : (lojaAtual ? 'Salvar alterações' : 'Criar loja')}
        </Button>
      </div>
    </Modal>
  );
};
