import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField } from '../ui/Input';
import { MapPin, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ModalCepProps {
  open: boolean;
  onClose: () => void;
  onCepSelecionado: (cep: string, cidade: string, estado: string) => void;
}

export function ModalCep({ open, onClose, onCepSelecionado }: ModalCepProps) {
  const [cep, setCep] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { error } = useToast();

  const handleBuscarCep = async () => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) {
      error('Digite um CEP válido com 8 números.');
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        error('CEP não encontrado. Verifique e tente novamente.');
        return;
      }

      onCepSelecionado(data.cep, data.localidade, data.uf);
      onClose();
    } catch (err) {
      error('Erro ao buscar o CEP. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-[#55833d]/10 text-[#55833d] rounded-full flex items-center justify-center mx-auto">
          <MapPin size={32} />
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase italic text-[#394158]">Insira sua localização</h2>
          <p className="text-gray-500 mt-2">Veja produtos e lojas perto de você.</p>
        </div>

        <div className="space-y-4 pt-4">
          <FormField
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const formatted = val.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
              setCep(formatted);
            }}
          />

          <Button onClick={handleBuscarCep} disabled={carregando} className="w-full h-12 flex items-center justify-center gap-2">
            {carregando ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search size={20} />
                Buscar Localização
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
