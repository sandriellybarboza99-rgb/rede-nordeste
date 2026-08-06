package com.semeia_nordeste.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "pix")
public class PixConfig {

    /** Chave PIX do recebedor (e-mail, CPF, CNPJ, telefone ou chave aleatória). */
    private String chave = "financeiro@redenordeste.com.br";

    /** Nome do recebedor — máximo 25 caracteres conforme BR Code. */
    private String nomeRecebedor = "Rede Nordeste";

    /** Cidade do recebedor — máximo 15 caracteres conforme BR Code. */
    private String cidade = "Aracaju";

    /** Descrição exibida no app bancário do pagador. */
    private String descricao = "Pedido Rede Nordeste";

    public String getChave() {
        return chave;
    }

    public void setChave(String chave) {
        this.chave = chave;
    }

    public String getNomeRecebedor() {
        return nomeRecebedor;
    }

    public void setNomeRecebedor(String nomeRecebedor) {
        this.nomeRecebedor = nomeRecebedor;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}