/**
 * Gerador de payload PIX estático no padrão EMV/BRCode.
 *
 * Referência oficial:
 * - Manual de Padrões para Iniciação do PIX (Banco Central do Brasil)
 * - EMV QRCode Specification for Payment Systems (Merchant-Presented)
 *
 * Gera uma string válida que, ao ser convertida em QR Code,
 * pode ser lida por qualquer app de banco brasileiro.
 */

// ─── CRC16-CCITT (padrão exigido pelo BCB) ──────────────────────────
function crc16CCITT(str: string): string {
  let crc = 0xFFFF;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ─── Monta um campo TLV (Tag-Length-Value) ───────────────────────────
function montaTLV(id: string, valor: string): string {
  const len = valor.length.toString().padStart(2, '0');
  return id + len + valor;
}

// ─── Remove acentos e caracteres não-ASCII ───────────────────────────
function sanitizar(texto: string, maxLen: number): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-zA-Z0-9 \*]/g, '')    // só alfanumérico, espaço e asterisco
    .substring(0, maxLen)
    .toUpperCase()
    .trim();
}

// ─── Interface de parâmetros ─────────────────────────────────────────
export interface PixPayloadParams {
  /** Chave PIX do recebedor (CPF, CNPJ, email, telefone ou EVP) */
  chavePix: string;
  /** Tipo da chave PIX (CPF, CNPJ, EMAIL, TELEFONE, ALEATORIA) */
  tipoChavePix?: string;
  /** Nome do recebedor (máx 25 caracteres) */
  nomeRecebedor: string;
  /** Cidade do recebedor (máx 15 caracteres) */
  cidadeRecebedor: string;
  /** Valor da transação em reais (opcional para QR estático) */
  valor?: number;
  /** Identificador / referência (máx 25 caracteres, padrão: "***") */
  txId?: string;
}

/**
 * Formata a chave PIX de acordo com o tipo (ex: adiciona +55 para celular)
 */
function formatarChavePix(chave: string, tipo?: string): string {
  if (!tipo) return chave; // Se não informar tipo, usa como está

  const tipoUpper = tipo.toUpperCase();
  if (tipoUpper === 'TELEFONE' || tipoUpper === 'CELULAR') {
    let limpa = chave.replace(/[^0-9]/g, '');
    if (limpa.length === 10 || limpa.length === 11) {
      limpa = '55' + limpa; // Assume Brasil se não tiver
    }
    return '+' + limpa;
  }
  
  if (tipoUpper === 'CPF' || tipoUpper === 'CNPJ') {
    return chave.replace(/[^0-9]/g, ''); // Remove pontuação
  }
  
  return chave; // EMAIL e ALEATORIA vão como estão
}

/**
 * Gera o payload PIX Copia e Cola no formato EMV/BRCode.
 * O resultado pode ser convertido em QR Code e lido por qualquer banco.
 */
export function gerarPayloadPix(params: PixPayloadParams): string {
  const {
    chavePix,
    tipoChavePix,
    nomeRecebedor,
    cidadeRecebedor,
    valor,
    txId = '***',
  } = params;

  const chaveFormatada = formatarChavePix(chavePix, tipoChavePix);

  // ── Campo 00: Payload Format Indicator (obrigatório, fixo "01")
  let payload = montaTLV('00', '01');

  // ── Campo 01: Point of Initiation Method ("12" = pagamento único)
  payload += montaTLV('01', '12');

  // ── Campo 26: Merchant Account Information (contém a chave PIX)
  const campoGUI   = montaTLV('00', 'BR.GOV.BCB.PIX');
  const campoChave = montaTLV('01', chaveFormatada);
  payload += montaTLV('26', campoGUI + campoChave);

  // ── Campo 52: Merchant Category Code ("0000" = não informado)
  payload += montaTLV('52', '0000');

  // ── Campo 53: Transaction Currency ("986" = BRL)
  payload += montaTLV('53', '986');

  // ── Campo 54: Transaction Amount (opcional)
  if (valor != null && valor > 0) {
    payload += montaTLV('54', valor.toFixed(2));
  }

  // ── Campo 58: Country Code
  payload += montaTLV('58', 'BR');

  // ── Campo 59: Merchant Name
  payload += montaTLV('59', sanitizar(nomeRecebedor, 25));

  // ── Campo 60: Merchant City
  payload += montaTLV('60', sanitizar(cidadeRecebedor, 15));

  // ── Campo 62: Additional Data Field Template
  const campoTxId = montaTLV('05', sanitizar(txId, 25));
  payload += montaTLV('62', campoTxId);

  // ── Campo 63: CRC16 (calculado sobre tudo + "6304")
  payload += '6304';
  payload += crc16CCITT(payload);

  return payload;
}
