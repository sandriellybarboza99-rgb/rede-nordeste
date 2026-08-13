import React from 'react';
import { Modal } from '../ui/Modal';
import { FormLoja } from '../forms/FormLoja';

interface ModalLojaProps {
  open: boolean;
  onClose: () => void;
  lojaAtual: any | null;
  onSave: (dadosLoja: any) => Promise<void>;
}

export const ModalLoja: React.FC<ModalLojaProps> = ({ open, onClose, lojaAtual, onSave }) => {
  return (
    <Modal open={open} onClose={onClose} title={lojaAtual ? 'Editar minha loja' : 'Criar minha loja'} size="lg">
      <FormLoja lojaAtual={lojaAtual} onSave={onSave} />
    </Modal>
  );
};

