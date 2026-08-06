package com.semeia_nordeste.backend.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.semeia_nordeste.backend.config.PixConfig;
import com.semeia_nordeste.backend.model.TipoChavePix;

@Service
public class PixService {

    private static final String NOME_FALLBACK = "SEMEIA NORDESTE";
    private static final String CIDADE_FALLBACK = "ARACAJU";

    private final PixConfig config;

    public PixService(PixConfig config) {
        this.config = config;
    }

    public String gerarTxid() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 25)
                .toUpperCase();
    }

    public String gerarPayloadParaLoja(
            BigDecimal valor,
            String txid,
            String chaveLoja,
            TipoChavePix tipoChave,
            String nomeLoja,
            String cidadeLoja) {

        String chave = preenchido(chaveLoja) ? chaveLoja : config.getChave();
        String nome = preenchido(nomeLoja) ? nomeLoja : config.getNomeRecebedor();
        String cidade = preenchido(cidadeLoja) ? cidadeLoja : config.getCidade();

        return gerarPayloadCompleto(valor, txid, chave, tipoChave, nome, cidade);
    }

    private String gerarPayloadCompleto(
            BigDecimal valor,
            String txid,
            String chave,
            TipoChavePix tipoChave,
            String nomeRecebedor,
            String cidadeRecebedor) {

        // 00: Payload Format Indicator
        String f00 = tlv("00", "01");

        // 01: Point of Initiation Method (12 = estático)
        String f01 = tlv("01", "12");

        // 26: Merchant Account Information
        String chaveFormatada = sanitizarChavePix(chave, tipoChave);
        String subGui = tlv("00", "BR.GOV.BCB.PIX");
        String subChave = tlv("01", chaveFormatada);

        String f26 = tlv("26", subGui + subChave);

        // 52: Merchant Category Code
        String f52 = tlv("52", "0000");

        // 53: Transaction Currency (986 = BRL)
        String f53 = tlv("53", "986");

        // 54: Transaction Amount
        String f54 = (valor != null && valor.compareTo(BigDecimal.ZERO) > 0)
                ? tlv("54", valor.setScale(2).toPlainString())
                : "";

        // 58: Country Code
        String f58 = tlv("58", "BR");

        // 59: Merchant Name (máx 25)
        String nomeSanitizado = sanitizarTexto(nomeRecebedor, 25);
        if (!preenchido(nomeSanitizado)) {
            nomeSanitizado = NOME_FALLBACK;
        }
        String f59 = tlv("59", nomeSanitizado);

        // 60: Merchant City (máx 15)
        String cidadeSanitizada = sanitizarTexto(cidadeRecebedor, 15);
        if (!preenchido(cidadeSanitizada)) {
            cidadeSanitizada = CIDADE_FALLBACK;
        }
        String f60 = tlv("60", cidadeSanitizada);

        // 62: Additional Data Field Template (TXID)
        String txidLimpo = (txid == null || txid.isBlank()) ? "***" : txid.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (txidLimpo.length() > 25) {
            txidLimpo = txidLimpo.substring(0, 25);
        }
        String f62 = tlv("62", tlv("05", txidLimpo));

        // Sem CRC (Termina em 6304)
        String semCrc = f00 + f01 + f26 + f52 + f53 + f54 + f58 + f59 + f60 + f62 + "6304";

        // 63: CRC16
        String crc = calcularCrc16(semCrc);
        return semCrc + crc;
    }

    public String sanitizarChavePix(String chave, TipoChavePix tipo) {
        if (!preenchido(chave)) {
            return "";
        }

        String c = chave.trim();

        if (tipo == TipoChavePix.EMAIL || c.contains("@")) {
            return c.toLowerCase().replaceAll("\\s+", "");
        }

        if (tipo == TipoChavePix.ALEATORIA
                || c.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
            return c.toLowerCase();
        }

        String digitos = c.replaceAll("[^0-9]", "");

        if (tipo == TipoChavePix.TELEFONE || digitos.length() == 11 || digitos.length() == 12
                || digitos.length() == 13) {
            if (digitos.length() == 12 && digitos.startsWith("0")) {
                digitos = digitos.substring(1);
            }
            if (digitos.length() == 11) {
                return "+55" + digitos;
            }
            if (digitos.length() == 13 && digitos.startsWith("55")) {
                return "+" + digitos;
            }
        }

        if (digitos.length() == 14 || digitos.length() == 11) {
            return digitos;
        }

        return c.replaceAll("\\s+", "");
    }

    private boolean preenchido(String s) {
        return s != null && !s.isBlank();
    }

    private String tlv(String tag, String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return tag + String.format("%02d", value.length()) + value;
    }

    private String sanitizarTexto(String valor, int maxLen) {
        if (!preenchido(valor)) {
            return "";
        }

        String s = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^A-Za-z0-9 ]", "")
                .trim()
                .toUpperCase();

        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    private String calcularCrc16(String payload) {
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        int crc = 0xFFFF;

        for (byte b : bytes) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }

        return String.format("%04X", crc & 0xFFFF);
    }
}