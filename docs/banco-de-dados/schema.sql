
CREATE TABLE IF NOT EXISTS usuarios (
    id               BIGSERIAL PRIMARY KEY,
    nome_completo    VARCHAR(150) NOT NULL,
    cpf_cnpj         VARCHAR(18)  UNIQUE NOT NULL,
    telefone         VARCHAR(15)  UNIQUE NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    senha_hash       TEXT NOT NULL,
    tipo_perfil      VARCHAR(20)  NOT NULL
                         CHECK (tipo_perfil IN ('PRODUTOR', 'COMPRADOR', 'ADMIN')),
    foto_perfil_url  TEXT,
    conta_ativa      BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lojas (
    id                   BIGSERIAL PRIMARY KEY,
    usuario_id           BIGINT UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_loja            VARCHAR(100) NOT NULL,
    descricao_bio        TEXT,
    logradouro           VARCHAR(255),
    bairro               VARCHAR(100),
    cidade               VARCHAR(100),
    estado               CHAR(2)          DEFAULT 'SE',
    cep                  VARCHAR(8),
    aceita_retirada      BOOLEAN          DEFAULT TRUE,
    faz_entrega          BOOLEAN          DEFAULT FALSE,
    valor_minimo_pedido  DECIMAL(10,2)    DEFAULT 0.00,
    taxa_entrega_fixa    DECIMAL(10,2)    DEFAULT 0.00,
    logo_url             TEXT,
    -- Geolocalização para cálculo de frete
    latitude_loja        DOUBLE PRECISION,
    longitude_loja       DOUBLE PRECISION,
    data_abertura        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id               BIGSERIAL PRIMARY KEY,
    nome             VARCHAR(50) NOT NULL UNIQUE,
    descricao        TEXT,
    imagem_icone_url TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
    id              BIGSERIAL PRIMARY KEY,
    loja_id         BIGINT REFERENCES lojas(id) ON DELETE CASCADE,
    categoria_id    BIGINT REFERENCES categorias(id),
    nome            VARCHAR(100)  NOT NULL,
    descricao       TEXT,
    preco_atual     DECIMAL(10,2) NOT NULL,
    unidade_medida  VARCHAR(20)   NOT NULL,
    estoque_atual   INTEGER       DEFAULT 0,
    -- Peso para cálculo de frete e logística
    peso_kg         DECIMAL(8,2)  DEFAULT 0.5,
    imagem_url      TEXT,
    data_cadastro   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_carrinho (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT REFERENCES usuarios(id)  ON DELETE CASCADE,
    produto_id  BIGINT REFERENCES produtos(id)  ON DELETE CASCADE,
    quantidade  INTEGER NOT NULL CHECK (quantidade > 0),
    data_adicao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id                 BIGSERIAL PRIMARY KEY,
    metodo_pagamento   VARCHAR(50) NOT NULL,
    status_pagamento   VARCHAR(30) DEFAULT 'AGUARDANDO'
                           CHECK (status_pagamento IN
                               ('AGUARDANDO','APROVADO','REJEITADO','ESTORNADO')),
    data_pagamento     TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS entregadores (
    id              BIGSERIAL PRIMARY KEY,
    nome_completo   VARCHAR(150) NOT NULL,
    cpf             VARCHAR(14)  UNIQUE NOT NULL,
    telefone        VARCHAR(15)  UNIQUE NOT NULL,
    cidade          VARCHAR(100) NOT NULL,
    -- Localização base do entregador para matching de proximidade
    latitude_base   DOUBLE PRECISION,
    longitude_base  DOUBLE PRECISION,
    tipo_veiculo    VARCHAR(30)  NOT NULL
                        CHECK (tipo_veiculo IN
                            ('BICICLETA','MOTO','CARRO_PEQUENO',
                             'CARRO_UTILITARIO','CAMINHONETE','CAMINHAO')),
    placa_veiculo   VARCHAR(10),
    numero_cnh      VARCHAR(11),
    ativo           BOOLEAN DEFAULT FALSE,   -- admin aprova
    disponivel      BOOLEAN DEFAULT TRUE,
    data_cadastro   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entregas (
    id                      BIGSERIAL PRIMARY KEY,

    status_entrega          VARCHAR(40) DEFAULT 'PEDIDO_RECEBIDO'
                                CHECK (status_entrega IN (
                                    'PEDIDO_RECEBIDO',
                                    'AGUARDANDO_ENTREGADOR',
                                    'ENTREGADOR_ACEITOU',
                                    'PEDIDO_EM_COLETA',
                                    'SAIU_PARA_ENTREGA',
                                    'ENTREGUE',
                                    'RETIRADA_DISPONIVEL',
                                    'CANCELADO'
                                )),

    -- Destino
    endereco_entrega        TEXT,
    cidade_destino          VARCHAR(100),
    latitude_destino        DOUBLE PRECISION,
    longitude_destino       DOUBLE PRECISION,

    -- Dados calculados pelo FreteService
    distancia_km            DECIMAL(8,2),
    valor_frete             DECIMAL(10,2),
    tipo_veiculo_necessario VARCHAR(30)
                                CHECK (tipo_veiculo_necessario IN (
                                    'BICICLETA','MOTO','CARRO_PEQUENO',
                                    'CARRO_UTILITARIO','CAMINHONETE','CAMINHAO'
                                )),
    categoria_carga         VARCHAR(20)
                                CHECK (categoria_carga IN
                                    ('LEVE','MEDIA','PESADA','MUITO_PESADA')),
    peso_total_kg           DECIMAL(8,2),

    -- Entregador associado automaticamente
    entregador_id           BIGINT REFERENCES entregadores(id),

    retirada_na_loja        BOOLEAN DEFAULT FALSE,
    codigo_rastreio         VARCHAR(50),
    data_atualizacao        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_entregue           TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS historico_entrega (
    id              BIGSERIAL PRIMARY KEY,
    entrega_id      BIGINT REFERENCES entregas(id) ON DELETE CASCADE,
    status_entrega  VARCHAR(40) NOT NULL,
    descricao       VARCHAR(255),
    data_registro   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id           BIGSERIAL PRIMARY KEY,
    comprador_id BIGINT REFERENCES usuarios(id),
    pagamento_id BIGINT REFERENCES pagamentos(id),
    entrega_id   BIGINT REFERENCES entregas(id),
    valor_total  DECIMAL(10,2) NOT NULL,
    data_pedido  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    observacoes  TEXT
);

CREATE TABLE IF NOT EXISTS item_pedido (
    id                        BIGSERIAL PRIMARY KEY,
    pedido_id                 BIGINT REFERENCES pedidos(id)  ON DELETE CASCADE,
    produto_id                BIGINT REFERENCES produtos(id),
    quantidade                INTEGER       NOT NULL,
    -- Preço travado no momento da compra
    preco_unitario_no_momento DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
    id           BIGSERIAL PRIMARY KEY,
    comprador_id BIGINT REFERENCES usuarios(id),
    loja_id      BIGINT REFERENCES lojas(id),
    data_inicio  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comprador_id, loja_id)
);

CREATE TABLE IF NOT EXISTS mensagens (
    id           BIGSERIAL PRIMARY KEY,
    chat_id      BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    remetente_id BIGINT REFERENCES usuarios(id),
    conteudo     TEXT    NOT NULL,
    data_envio   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lida         BOOLEAN DEFAULT FALSE
);

-- Busca de produtos por loja e categoria (marketplace)
CREATE INDEX IF NOT EXISTS idx_produtos_loja       ON produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria  ON produtos(categoria_id);

-- Busca de itens do carrinho por usuário
CREATE INDEX IF NOT EXISTS idx_carrinho_usuario    ON item_carrinho(usuario_id);

-- Busca de pedidos por comprador
CREATE INDEX IF NOT EXISTS idx_pedidos_comprador   ON pedidos(comprador_id);

-- Busca de mensagens por chat (histórico)
CREATE INDEX IF NOT EXISTS idx_mensagens_chat      ON mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida      ON mensagens(lida);

-- Busca de entregadores disponíveis por tipo de veículo
CREATE INDEX IF NOT EXISTS idx_entregadores_tipo   ON entregadores(tipo_veiculo);
CREATE INDEX IF NOT EXISTS idx_entregadores_ativo  ON entregadores(ativo, disponivel);

-- Busca de chats por participante
CREATE INDEX IF NOT EXISTS idx_chats_comprador     ON chats(comprador_id);
CREATE INDEX IF NOT EXISTS idx_chats_loja          ON chats(loja_id);