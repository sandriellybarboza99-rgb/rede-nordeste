import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/Input';
import { Loader2, Plus, Trash2, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { consultarCep, getEnderecosLoja, criarEnderecoLoja, atualizarEnderecoLoja, deletarEnderecoLoja } from '../../services/api';

const ListaHorarios = ({ valueStr, onChangeStr }: any) => {
    const list = React.useMemo(() => {
      if (!valueStr) return [];
      if (typeof valueStr === 'object') return valueStr;
      try { return JSON.parse(valueStr); } catch { return []; }
    }, [valueStr]);

    const update = (newList: any) => {
      onChangeStr(newList.length ? JSON.stringify(newList) : '');
    };

    const add = () => update([...list, { dias: '', horario: '' }]);
    const remove = (idx: number) => update(list.filter((_: any, i: number) => i !== idx));
    const change = (idx: number, field: string, val: string) => {
      const n = [...list];
      n[idx] = { ...n[idx], [field]: val };
      update(n);
    };

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1">Dias e Horários</label>
          <Button variant="ghost" size="sm" type="button" onClick={add} className="h-7 text-[10px] px-3"><Plus size={12}/> Adicionar</Button>
        </div>
        {list.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum horário definido.</p>}
        <div className="space-y-2">
          {list.map((item: any, i: number) => (
            <div key={i} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input type="text" placeholder="Ex: Seg a Sex" className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#55833d] transition-all bg-gray-50 focus:bg-white" value={item.dias} onChange={e => change(i, 'dias', e.target.value)} />
                <input type="text" placeholder="Ex: 08:00 às 18:00" className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#55833d] transition-all bg-gray-50 focus:bg-white" value={item.horario} onChange={e => change(i, 'horario', e.target.value)} />
              </div>
              <button type="button" onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

const ListaRegioes = ({ valueStr, onChangeStr }: any) => {
    const list = React.useMemo(() => {
      if (!valueStr) return [];
      if (typeof valueStr === 'object') return valueStr;
      try { return JSON.parse(valueStr); } catch { return []; }
    }, [valueStr]);

    const update = (newList: any) => {
      onChangeStr(newList.length ? JSON.stringify(newList) : '');
    };

    const add = () => update([...list, { estado: 'SE', cidade: '', bairro: '' }]);
    const remove = (idx: number) => update(list.filter((_: any, i: number) => i !== idx));
    const change = (idx: number, field: string, val: string) => {
      const n = [...list];
      n[idx] = { ...n[idx], [field]: val };
      update(n);
    };

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-[#55833d] tracking-widest ml-1">Regiões de Entrega</label>
          <Button variant="ghost" size="sm" type="button" onClick={add} className="h-7 text-[10px] px-3"><Plus size={12}/> Adicionar</Button>
        </div>
        {list.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma região definida.</p>}
        <div className="space-y-2">
          {list.map((item: any, i: number) => (
            <div key={i} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex-1 grid grid-cols-4 gap-2">
                <input type="text" placeholder="UF" className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#55833d] transition-all bg-gray-50 focus:bg-white" value={item.estado} onChange={e => change(i, 'estado', e.target.value)} maxLength={2} />
                <input type="text" placeholder="Cidade" className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#55833d] transition-all bg-gray-50 focus:bg-white col-span-3" value={item.cidade} onChange={e => change(i, 'cidade', e.target.value)} />
                <input type="text" placeholder="Bairro (Opcional, deixe vazio p/ cidade toda)" className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#55833d] transition-all bg-gray-50 focus:bg-white col-span-4" value={item.bairro} onChange={e => change(i, 'bairro', e.target.value)} />
              </div>
              <button type="button" onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // UI Components
const EnderecoFormFields = ({ form, setForm, isSede, buscandoCep, handleCepChange, handleCepBlur }: any) => (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      {!isSede && (
        <FormField label="Nome da Filial (Ex: Loja Centro)" required value={form.nomeLocal || ''} onChange={(e: any) => setForm({ ...form, nomeLocal: e.target.value })} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="CEP" 
          required 
          value={form.cep || ''} 
          onChange={(e: any) => handleCepChange(e, isSede)} 
          onBlur={() => handleCepBlur(isSede)}
          maxLength={9} 
          placeholder="00000-000"
          iconRight={buscandoCep ? <Loader2 className="animate-spin text-gray-400" size={16} /> : undefined} 
        />
        <FormField label="Rua / Logradouro" required value={form.rua || ''} onChange={(e: any) => setForm({ ...form, rua: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <FormField label="Número" value={form.numero || ''} onChange={(e: any) => setForm({ ...form, numero: e.target.value })} />
        <FormField label="Bairro" required value={form.bairro || ''} onChange={(e: any) => setForm({ ...form, bairro: e.target.value })} />
        <FormField label="Cidade" required value={form.cidade || ''} onChange={(e: any) => setForm({ ...form, cidade: e.target.value })} />
        <FormField label="UF" required value={form.estado || 'SE'} onChange={(e: any) => setForm({ ...form, estado: e.target.value.toUpperCase() })} maxLength={2} />
      </div>
      
      <div className="mt-6 border-t pt-4 border-gray-100">
        <h4 className="text-sm font-black uppercase text-[#394158] mb-4">Regras de Funcionamento e Logística</h4>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl border border-gray-100">
            <h5 className="text-[10px] font-black uppercase text-[#394158] tracking-widest mb-3 border-b pb-2 border-gray-200">1. Funcionamento do Local</h5>
            <ListaHorarios valueStr={form.diasHorariosFuncionamento} onChangeStr={(v: string) => setForm((prev: any) => ({ ...prev, diasHorariosFuncionamento: v }))} />
          </div>

          <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl border border-gray-100">
            <h5 className="text-[10px] font-black uppercase text-[#394158] tracking-widest mb-3 border-b pb-2 border-gray-200">2. Retirada no Local</h5>
            <ListaHorarios valueStr={form.diasHorariosRetirada} onChangeStr={(v: string) => setForm((prev: any) => ({ ...prev, diasHorariosRetirada: v }))} />
          </div>

          <div className="bg-[#F5F2ED]/50 p-4 rounded-2xl border border-gray-100 xl:col-span-2">
            <h5 className="text-[10px] font-black uppercase text-[#394158] tracking-widest mb-3 border-b pb-2 border-gray-200">3. Entregas (Delivery) saindo deste Local</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListaHorarios valueStr={form.diasHorariosEntrega} onChangeStr={(v: string) => setForm((prev: any) => ({ ...prev, diasHorariosEntrega: v }))} />
              <ListaRegioes valueStr={form.regioesEntrega} onChangeStr={(v: string) => setForm((prev: any) => ({ ...prev, regioesEntrega: v }))} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );

export const GerenciadorEnderecos = ({ lojaAtual, onSaveSede }: { lojaAtual: any, onSaveSede: (dados: any) => Promise<void> }) => {
  const { success, error: toastError } = useToast();

  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // States de Sanfona (Accordion)
  const [sedeExpandida, setSedeExpandida] = useState(true);
  const [filialExpandida, setFilialExpandida] = useState<number | 'nova' | null>(null);

  // Form states
  const [formSede, setFormSede] = useState<any>({});
  const [formFilial, setFormFilial] = useState<any>({
    id: null, nomeLocal: '', cep: '', bairro: '', cidade: '', estado: 'SE', rua: '', numero: '', diasHorariosFuncionamento: '', regioesEntrega: '', diasHorariosEntrega: '', diasHorariosRetirada: ''
  });

  const carregarEnderecos = async () => {
    if (!lojaAtual) return;
    try {
      const data = await getEnderecosLoja();
      setEnderecos(data);
    } catch {
      setEnderecos([]);
    }
  };

  useEffect(() => {
    carregarEnderecos();
    
    // Preparar formSede com os dados da lojaAtual
    let logradouro = lojaAtual?.logradouro || '';
    let rua = logradouro;
    let numero = '';

    if (rua.includes(', ')) {
      const lastCommaIndex = rua.lastIndexOf(', ');
      numero = rua.substring(lastCommaIndex + 2);
      rua = rua.substring(0, lastCommaIndex);
    }

    setFormSede({
      ...lojaAtual,
      rua,
      numero,
      estado: lojaAtual?.estado || 'SE',
      diasHorariosFuncionamento: lojaAtual?.diasHorariosFuncionamento || '',
      regioesEntrega: lojaAtual?.regioesEntrega || '',
      diasHorariosEntrega: lojaAtual?.diasHorariosEntrega || '',
      diasHorariosRetirada: lojaAtual?.diasHorariosRetirada || ''
    });

  }, [lojaAtual]);

  const buscarCep = async (cepLimpo: string, isSede: boolean) => {
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const dadosCep = await consultarCep(cepLimpo);
      if (dadosCep) {
        const formAtual = isSede ? formSede : formFilial;
        const isCidadeDiferente = formAtual.cidade && formAtual.cidade !== dadosCep.localidade;
        const novoBairro = dadosCep.bairro ? dadosCep.bairro : (isCidadeDiferente ? '' : formAtual.bairro || '');
        const novaRua = dadosCep.logradouro ? dadosCep.logradouro : (isCidadeDiferente ? '' : formAtual.rua || '');

        if (isSede) {
          setFormSede((prev: any) => ({
            ...prev,
            cidade: dadosCep.localidade || prev.cidade || '',
            estado: dadosCep.uf || prev.estado || 'SE',
            bairro: novoBairro,
            rua: novaRua
          }));
        } else {
          setFormFilial((prev: any) => ({
            ...prev,
            cidade: dadosCep.localidade || prev.cidade || '',
            estado: dadosCep.uf || prev.estado || 'SE',
            bairro: novoBairro,
            rua: novaRua
          }));
        }
      } else {
        toastError('CEP não encontrado.');
      }
    } catch {
      toastError('Erro ao consultar CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, isSede: boolean) => {
    const rawCep = e.target.value;
    let cepNumeros = rawCep.replace(/\D/g, '');
    if (cepNumeros.length > 8) cepNumeros = cepNumeros.substring(0, 8);

    let cepFormatado = cepNumeros;
    if (cepNumeros.length > 5) {
      cepFormatado = `${cepNumeros.substring(0, 5)}-${cepNumeros.substring(5, 8)}`;
    }

    if (isSede) setFormSede((prev: any) => ({ ...prev, cep: cepFormatado }));
    else setFormFilial((prev: any) => ({ ...prev, cep: cepFormatado }));

    if (cepNumeros.length === 8) {
      buscarCep(cepNumeros, isSede);
    }
  };

  const handleCepBlur = (isSede: boolean) => {
    const form = isSede ? formSede : formFilial;
    const cepNumeros = (form.cep || '').replace(/\D/g, '');
    if (cepNumeros.length === 8) {
      buscarCep(cepNumeros, isSede);
    }
  };

  const handleSalvarSede = async () => {
    if (!formSede.cep || !formSede.cidade || !formSede.rua) {
      toastError('Preencha os campos obrigatórios da sede.');
      return;
    }
    setSalvando(true);
    try {
      const logradouroUnido = formSede.numero ? `${formSede.rua}, ${formSede.numero}` : formSede.rua;
      await onSaveSede({
        ...formSede,
        logradouro: logradouroUnido
      });
      success('Endereço da sede salvo!');
      setSedeExpandida(false); // Fecha a sanfona após salvar
    } catch (err: any) {
      toastError(err?.message || 'Erro ao salvar sede.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirNovaFilial = () => {
    if (filialExpandida === 'nova') {
      setFilialExpandida(null);
    } else {
      setFormFilial({ id: null, nomeLocal: '', cep: '', bairro: '', cidade: '', estado: 'SE', rua: '', numero: '', diasHorariosFuncionamento: '', regioesEntrega: '', diasHorariosEntrega: '', diasHorariosRetirada: '' });
      setFilialExpandida('nova');
    }
  };

  const toggleFilial = (end: any) => {
    if (filialExpandida === end.id) {
      setFilialExpandida(null);
    } else {
      setFormFilial({ ...end });
      setFilialExpandida(end.id);
    }
  };

  const handleSalvarFilial = async () => {
    if (!formFilial.nomeLocal || !formFilial.cep || !formFilial.cidade || !formFilial.rua) {
      toastError('Preencha os campos obrigatórios da filial.');
      return;
    }
    setSalvando(true);
    try {
      if (formFilial.id) {
        await atualizarEnderecoLoja(formFilial.id, formFilial);
        success('Filial atualizada.');
      } else {
        await criarEnderecoLoja(formFilial);
        success('Filial cadastrada.');
      }
      setFilialExpandida(null); // Fecha a sanfona
      carregarEnderecos();
    } catch (err: any) {
      toastError(err?.message || 'Erro ao salvar filial.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirFilial = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta filial?')) return;
    try {
      await deletarEnderecoLoja(id);
      success('Filial removida.');
      if (filialExpandida === id) setFilialExpandida(null);
      carregarEnderecos();
    } catch (err: any) {
      toastError('Erro ao remover filial.');
    }
  };



  return (
    <div className="space-y-6">
      
      {/* SEDE (ACCORDION) */}
      <div className={`bg-white rounded-2xl border ${sedeExpandida ? 'border-[#394158] shadow-md' : 'border-gray-100 shadow-sm'} relative overflow-hidden transition-all duration-300`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-[#394158]" />
        
        {/* Header Sede */}
        <div 
          className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setSedeExpandida(!sedeExpandida)}
        >
          <div>
            <h3 className="font-black text-lg text-[#394158] flex items-center gap-2">
              <MapPin size={20} className="text-[#55833d]" /> 
              Sede Principal
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {!sedeExpandida && lojaAtual?.logradouro 
                ? `${lojaAtual.logradouro}, ${lojaAtual.bairro}, ${lojaAtual.cidade} - ${lojaAtual.estado}`
                : 'Este é o endereço principal da sua loja.'}
            </p>
          </div>
          <div className="text-gray-400">
            {sedeExpandida ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>

        {/* Form Sede Expandido */}
        {sedeExpandida && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <EnderecoFormFields form={formSede} setForm={setFormSede} isSede={true} buscandoCep={buscandoCep} handleCepChange={handleCepChange} handleCepBlur={handleCepBlur} />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSedeExpandida(false)}>Recolher</Button>
              <Button variant="primary" onClick={handleSalvarSede} disabled={salvando}>
                {salvando ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Sede'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FILIAIS (ACCORDIONS) */}
      <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg text-[#394158] flex items-center gap-2">
              <MapPin size={20} className="text-[#55833d]" /> 
              Endereços Adicionais (Filiais)
            </h3>
            <p className="text-xs text-gray-500">Cadastre outros locais de onde você pode despachar pedidos.</p>
          </div>
          <Button variant="primary" size="sm" onClick={abrirNovaFilial}>
            {filialExpandida === 'nova' ? 'Cancelar Nova' : '+ Adicionar Filial'}
          </Button>
        </div>

        {/* Nova Filial Accordion */}
        {filialExpandida === 'nova' && (
          <div className="bg-white rounded-2xl border border-[#55833d] shadow-md relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#55833d]" />
            <div className="p-6">
              <h4 className="font-black text-[#394158] text-sm mb-2">Cadastrando Nova Filial</h4>
              <EnderecoFormFields form={formFilial} setForm={setFormFilial} isSede={false} buscandoCep={buscandoCep} handleCepChange={handleCepChange} handleCepBlur={handleCepBlur} />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setFilialExpandida(null)}>Cancelar</Button>
                <Button variant="primary" onClick={handleSalvarFilial} disabled={salvando}>
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Filial'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Filiais Existentes */}
        {enderecos.length === 0 && filialExpandida !== 'nova' ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 font-medium">Nenhuma filial cadastrada.</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Filial" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enderecos.map(end => {
              const isExpanded = filialExpandida === end.id;

              return (
                <div key={end.id} className={`bg-white rounded-2xl border ${isExpanded ? 'border-[#55833d] shadow-md' : 'border-gray-200 shadow-sm'} relative overflow-hidden transition-all duration-300`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#55833d]" />
                  
                  {/* Header Filial */}
                  <div 
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFilial(end)}
                  >
                    <div>
                      <h4 className="font-black text-[#394158] uppercase text-sm mb-1">{end.nomeLocal}</h4>
                      <p className="text-xs text-gray-500">
                        {end.rua}{end.numero ? `, ${end.numero}` : ''}, {end.bairro} - {end.cidade}/{end.estado}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      {!isExpanded && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleExcluirFilial(end.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Form Filial Expandido */}
                  {isExpanded && (
                    <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <EnderecoFormFields form={formFilial} setForm={setFormFilial} isSede={false} buscandoCep={buscandoCep} handleCepChange={handleCepChange} handleCepBlur={handleCepBlur} />
                      <div className="mt-6 flex justify-between items-center">
                        <Button variant="danger" size="sm" type="button" onClick={() => handleExcluirFilial(end.id)}>Excluir Filial</Button>
                        <div className="flex gap-3">
                          <Button variant="ghost" onClick={() => setFilialExpandida(null)}>Recolher</Button>
                          <Button variant="primary" onClick={handleSalvarFilial} disabled={salvando}>
                            {salvando ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Alterações'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
