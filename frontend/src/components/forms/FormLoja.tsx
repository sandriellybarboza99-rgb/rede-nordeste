import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/Input';
import { Camera, Loader2, CheckCircle, Copy, Share2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface FormLojaProps {
  lojaAtual: any | null; // Dados da loja se estiver editando, ou null se for criação
  onSave: (dadosLoja: any) => Promise<void>;
  textoBotaoSalvar?: string;
}

export const FormLoja: React.FC<FormLojaProps> = ({ lojaAtual, onSave, textoBotaoSalvar }) => {
  const { success, error: toastError } = useToast();

  const [formLoja, setFormLoja] = useState<any>({});
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const urlLoja = lojaAtual?.id ? `${window.location.origin}/loja/${lojaAtual.id}` : '';

  const copiarLink = () => {
    if (urlLoja) {
      navigator.clipboard.writeText(urlLoja);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  useEffect(() => {
    setFormLoja(lojaAtual ? { ...lojaAtual } : {
      nomeLoja: '', descricaoBio: '', logoUrl: '',
      aceitaRetirada: false, fazEntrega: false,
      taxaEntregaFixa: 0, valorMinimoPedido: 0,
      chavePix: '', tipoChavePix: 'CPF/CNPJ'
    });
  }, [lojaAtual]);

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

  const handleSalvar = async () => {
    if (!formLoja.nomeLoja) {
      toastError('Nome da loja é obrigatório');
      return;
    }

    setSalvando(true);
    try {
      await onSave(formLoja);
    } catch (err) {
      // erro tratado no pai
    } finally {
      setSalvando(false);
    }
  };

  const botaoLabel = textoBotaoSalvar || (lojaAtual ? 'Salvar alterações' : 'Criar loja');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
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

      <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl space-y-4 border border-gray-100">
        <h4 className="text-[10px] font-black uppercase text-[#55833d] tracking-widest">Opções Gerais e Pagamento</h4>

        {lojaAtual?.id && (
          <div className="mb-4">
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1 block mb-1.5 flex items-center gap-1">
              <Share2 size={12} /> Link da sua loja
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={urlLoja}
                className="flex-1 p-3 bg-white text-gray-500 font-medium rounded-xl outline-none border border-gray-200 text-sm cursor-text"
              />
              <Button type="button" onClick={copiarLink} size="md" className="shrink-0 rounded-xl px-4" iconLeft={copiado ? <CheckCircle2 size={16} /> : <Copy size={16} />}>
                {copiado ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Compartilhe este link com seus clientes nas redes sociais.</p>
          </div>
        )}

        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1">Tipo de Chave PIX</label>
            <select className="w-full p-3.5 bg-[#F5F2ED]/50 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] transition-all" value={formLoja.tipoChavePix || 'CPF/CNPJ'} onChange={e => setFormLoja({ ...formLoja, tipoChavePix: e.target.value })}>
              <option value="CPF/CNPJ">CPF/CNPJ</option>
              <option value="Telefone">Telefone</option>
              <option value="E-mail">E-mail</option>
              <option value="Chave Aleatória">Chave Aleatória</option>
            </select>
          </div>
          <FormField label="Chave PIX" value={formLoja.chavePix || ''} onChange={e => setFormLoja({ ...formLoja, chavePix: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm pt-4 border-t border-gray-100">
          <label className="flex items-center gap-3 font-bold text-[#394158] cursor-pointer hover:text-[#55833d] transition-colors">
            <input type="checkbox" checked={!!formLoja.aceitaRetirada}
              onChange={e => setFormLoja({ ...formLoja, aceitaRetirada: e.target.checked })}
              className="w-5 h-5 text-[#55833d] rounded focus:ring-[#55833d] accent-[#55833d]" />
            Aceita retirada (Endereços definidos na sessão abaixo)
          </label>
          <label className="flex items-center gap-3 font-bold text-[#394158] cursor-pointer hover:text-[#55833d] transition-colors">
            <input type="checkbox" checked={!!formLoja.fazEntrega}
              onChange={e => setFormLoja({ ...formLoja, fazEntrega: e.target.checked })}
              className="w-5 h-5 text-[#55833d] rounded focus:ring-[#55833d] accent-[#55833d]" />
            Faz entrega
          </label>
        </div>
      </div>

      <Button onClick={handleSalvar} fullWidth size="lg" iconLeft={salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />} disabled={salvando}>
        {salvando ? 'Salvando...' : botaoLabel}
      </Button>
    </div>
  );
};
