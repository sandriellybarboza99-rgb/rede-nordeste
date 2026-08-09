package com.semeia_nordeste.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1) // Run before DemoSeeder
public class IndexSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(IndexSeeder.class);
    private final JdbcTemplate jdbcTemplate;

    public IndexSeeder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        logger.info("Verificando e criando índices de performance B-Tree no banco de dados...");

        try {
            // Índices funcionais para otimizar queries com LOWER()
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_lojas_estado_lower ON lojas (LOWER(estado));");
            logger.info("Índice idx_lojas_estado_lower verificado/criado.");

            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_lojas_cidade_lower ON lojas (LOWER(cidade));");
            logger.info("Índice idx_lojas_cidade_lower verificado/criado.");

            // Para otimizar o LIKE '%...%' com funções de lower/unaccent em grandes bases, 
            // usar pg_trgm seria o ideal (CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE INDEX ... USING gin).
            // Para o MVP atual, um índice normal em LOWER ajuda no '=' ou varreduras sequenciais mais rápidas.
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_produtos_nome_lower ON produtos (LOWER(nome));");
            logger.info("Índice idx_produtos_nome_lower verificado/criado.");
            
            logger.info("Índices de banco de dados aplicados com sucesso.");
        } catch (Exception e) {
            logger.warn("Não foi possível criar os índices do banco de dados (ignorando para permitir subida local): {}", e.getMessage());
        }
    }
}
