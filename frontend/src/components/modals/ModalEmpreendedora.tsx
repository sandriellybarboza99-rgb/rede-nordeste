import React, { useState, useEffect } from "react";
import { Camera, CheckCircle, Loader2, X, Sparkles, BookOpen, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { atualizarPerfilEmpreendedora, deletarPerfilEmpreendedora } from "../../services/api";

interface ModalEmpreendedoraProps {
  open: boolean;
  onClose: () => void;
  dadosAtuais?: {
    fotoEmpreendedoraUrl?: string;
    historiaEmpreendedora?: string;
  };
  onSalvo?: () => void;
}

const MAX_HISTORIA = 1000;

export const ModalEmpreendedora: React.FC<ModalEmpreendedoraProps> = ({
  open,
  onClose,
  dadosAtuais,
  onSalvo,
}) => {
  const { success, error: toastError } = useToast();
  const [foto, setFoto] = useState("");
  const [historia, setHistoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [confirmarDelete, setConfirmarDelete] = useState(false);

  const jaNoMural = !!(dadosAtuais?.fotoEmpreendedoraUrl || dadosAtuais?.historiaEmpreendedora);

  useEffect(() => {
    if (open) {
      setFoto(dadosAtuais?.fotoEmpreendedoraUrl || "");
      setHistoria(dadosAtuais?.historiaEmpreendedora || "");
      setConfirmarDelete(false);
    }
  }, [open, dadosAtuais]);

  const lerFotoBase64 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError("Imagem muito grande (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSalvar = async () => {
    if (!foto && !historia.trim()) {
      toastError("Adicione pelo menos uma foto ou sua historia");
      return;
    }
    setSalvando(true);
    try {
      await atualizarPerfilEmpreendedora({
        fotoEmpreendedoraUrl: foto || undefined,
        historiaEmpreendedora: historia.trim() || undefined,
      });
      success(jaNoMural ? "Perfil atualizado com sucesso!" : "Voce agora esta no mural!");
      onSalvo?.();
      onClose();
    } catch (err: any) {
      toastError(err.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async () => {
    if (!confirmarDelete) {
      setConfirmarDelete(true);
      return;
    }
    setDeletando(true);
    try {
      await deletarPerfilEmpreendedora();
      success("Removido do mural com sucesso.");
      onSalvo?.();
      onClose();
    } catch (err: any) {
      toastError(err.message || "Erro ao remover. Tente novamente.");
    } finally {
      setDeletando(false);
      setConfirmarDelete(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-[#F5F2ED] rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-2">
          <div className="flex items-center justify-center gap-2 text-[#f9943b] mb-2">
            <Sparkles size={20} className="fill-[#f9943b]" />
            <Sparkles size={14} className="fill-[#f9943b] opacity-60" />
          </div>
          <h2 className="text-xl md:text-2xl font-black italic uppercase text-[#394158]">
            {jaNoMural ? "Editar seu perfil" : "Conte sua historia"}
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
            {jaNoMural ? "Mural de Empreendedoras de Sergipe" : "Apareca no mural de Empreendedoras"}
          </p>
        </div>

        {/* Upload de foto */}
        <div className="flex flex-col items-center gap-3">
          <label className="relative w-32 h-32 rounded-full bg-[#fededf] border-2 border-dashed border-[#f9943b]/40 hover:border-[#f9943b] flex items-center justify-center cursor-pointer overflow-hidden group shadow-md transition-colors">
            {foto ? (
              <>
                <img src={foto} alt="Sua foto" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-[#f9943b]/60 group-hover:text-[#f9943b] transition-colors gap-1">
                <Camera className="w-8 h-8" />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">
                  Sua foto
                </span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={lerFotoBase64} />
          </label>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            JPG ou PNG - Max. 2MB
          </p>
        </div>

        {/* Campo de historia */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-[#55833d] tracking-widest">
              <BookOpen size={12} />
              Minha historia
            </label>
            <span className={`text-[9px] font-bold transition-colors ${historia.length > MAX_HISTORIA * 0.9 ? "text-[#f9943b]" : "text-gray-300"}`}>
              {historia.length}/{MAX_HISTORIA}
            </span>
          </div>
          <textarea
            rows={5}
            value={historia}
            onChange={e => {
              if (e.target.value.length <= MAX_HISTORIA) setHistoria(e.target.value);
            }}
            placeholder="Fale sobre voce, sua jornada, seus produtos e o que te move a empreender no Nordeste..."
            className="w-full p-4 bg-[#F5F2ED]/60 text-[#394158] font-medium rounded-2xl outline-none border-2 border-transparent focus:border-[#55833d] resize-none text-sm leading-relaxed transition-colors"
          />
        </div>

        {/* Botao salvar */}
        <button
          onClick={handleSalvar}
          disabled={salvando || deletando}
          className="w-full bg-[#55833d] text-white py-4 rounded-[1rem] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg hover:bg-[#436b2f] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:pointer-events-none"
        >
          {salvando
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
            : <><CheckCircle size={18} /> {jaNoMural ? "Salvar alteracoes" : "Publicar no mural"}</>
          }
        </button>

        {/* Botao remover — so aparece quando ja tem dados */}
        {jaNoMural && (
          <div className="border-t border-gray-100 pt-2">
            {confirmarDelete ? (
              /* Estado de confirmacao */
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Confirmar remocao?
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Sua foto e historia serao removidas do mural. Voce pode publicar novamente quando quiser.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmarDelete(false)}
                    disabled={deletando}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeletar}
                    disabled={deletando}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {deletando
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Trash2 size={13} /> Remover</>
                    }
                  </button>
                </div>
              </div>
            ) : (
              /* Botao inicial de remover */
              <button
                onClick={handleDeletar}
                disabled={salvando}
                className="w-full py-3 rounded-2xl border border-red-200 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-300 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Trash2 size={13} />
                Remover do mural
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
