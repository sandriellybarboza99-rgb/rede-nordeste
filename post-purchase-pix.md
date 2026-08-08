# Correção da Exibição do Pagamento PIX no Perfil (Pós-Compra)

**Contexto:** O usuário relatou que ao confirmar a compra sem pagar (pagamento pendente), o pedido deve ser encontrado na aba "A Pagar" da página de Perfil, mas atualmente o sistema não exibe o QR Code / Copia-e-Cola para que o cliente possa concluir o pagamento a partir dali.

---

## 🔴 1. Diagnóstico do Problema

1. **Aba "A Pagar"**: O sistema já filtra corretamente os pedidos com `statusPagamento === 'AGUARDANDO'` para esta aba.
2. **Visualização do Detalhe**: O método `renderDetalhePedido()` não está configurado para exibir as opções de pagamento. Ele mostra um rastreio padrão genérico e um Wizard de tracking.
3. **Dados da API**: O backend já retorna em todos os pedidos a propriedade `detalhesPixLojas` (via `PedidoResponse.fromEntity`). O que falta é consumir esses dados no frontend quando o pedido estiver aguardando pagamento.

---

## 🛠 2. Plano de Ação no Frontend (`Perfil.tsx`)

### Passo 2.1: Importações e Preparação de Estado
- Importar as funções de geração de PIX: `import { gerarPayloadPix } from '@/utils/pixPayload';`
- Importar o ícone `Copy` (caso não esteja importado) da `lucide-react`.
- Adicionar um estado local em `Perfil` para controle visual da cópia (como já existe no Carrinho): `const [copiado, setCopiado] = useState<string | false>(false);`

### Passo 2.2: Atualização do `renderDetalhePedido`
Dentro da função `renderDetalhePedido`, no arquivo `Perfil.tsx`, iremos adicionar um bloco condicional específico:

```tsx
// Se o status de pagamento for aguardando
const isAguardandoPagamento = pedidoSelecionado.statusPagamento === 'AGUARDANDO';
```

Se `isAguardandoPagamento` for `true`, o sistema irá:
1. Ler o array `pedidoSelecionado.detalhesPixLojas`.
2. Mapear cada `lojaPix` para gerar o `copiaECola` dinamicamente:
   ```tsx
   const copiaECola = gerarPayloadPix({
     chavePix: lojaPix.chavePix || '...',
     tipoChavePix: lojaPix.tipoChavePix,
     nomeRecebedor: lojaPix.nomeLoja || 'Loja',
     cidadeRecebedor: 'Sergipe',
     valor: lojaPix.valorTotal,
     txId: '***'
   });
   const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copiaECola)}`;
   ```
3. Renderizar uma interface de pagamento **idêntica à tela de sucesso do Carrinho**, onde o usuário vê um Card por loja (se for multi-loja), o QR code, o valor e o botão Copiar.

### Passo 2.3: Ajustes UI/UX
- Ao lado do título "Pedido #ID", adicionar um *Badge* laranja com "Aguardando Pagamento".
- Ocultar a linha de progresso e o ícone de "A caminho" quando o pedido ainda estiver aguardando pagamento (ele ainda não começou a ser preparado).

---

## 🔗 3. Regra de Negócio: Exatidão do Frete e PIX (Rateio)
Vale notar que, na nossa última correção, implementamos o **Transient Map de Frete** no backend para salvar o valor cravado de cada frete na finalização da compra.
Como mapas Transient não são persistidos permanentemente, ao listar o pedido depois de fechado, o backend recalcula os `detalhesPixLojas` via rateio proporcional. Isso pode gerar uma discrepância minúscula de centavos para a cobrança histórica no painel do Perfil em relação à tela inicial do Checkout (ex: R$ 5,00 contra R$ 5,05). 

- Para esta etapa, seguiremos com o rateio nativo já presente no backend para resgate de histórico, pois a totalidade do pedido será exata (o total final é sempre o mesmo). Se o usuário exigir cravamento de centavos até no histórico de pós-venda futuro, sugeriremos a persistência da tabela real de fretes num sprint de banco de dados.

---

## ✅ 4. Aprovação Necessária
- Favor confirmar se a abordagem de clonar o visual da tela de pagamento do "Checkout" para o "Perfil" nas abas "A Pagar" atende a sua necessidade. Ao aprovar, utilize o comando `/create` ou me dê luz verde para iniciarmos a injeção do código PIX na tela do perfil.
