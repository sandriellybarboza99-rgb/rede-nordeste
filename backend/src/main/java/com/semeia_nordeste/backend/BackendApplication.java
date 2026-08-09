package com.semeia_nordeste.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableCaching
public class BackendApplication {

	public static void main(String[] args) {
		// Carrega .env (da raiz do repo OU da pasta backend) e expõe como System properties
		// para que o Spring resolva ${DB_URL}, ${DB_PASSWORD}, ${JWT_SECRET}, etc.
		// ignoreIfMissing: em PROD usaremos variáveis de ambiente reais do host.
		Dotenv dotenv = Dotenv.configure()
				.directory("./")
				.ignoreIfMissing()
				.load();

		dotenv.entries().forEach(e -> {
			if (System.getProperty(e.getKey()) == null && System.getenv(e.getKey()) == null) {
				System.setProperty(e.getKey(), e.getValue());
			}
		});

		// Fallback: tenta também o .env na raiz do monorepo (../.env quando rodando de backend/)
		Dotenv parent = Dotenv.configure()
				.directory("../")
				.ignoreIfMissing()
				.load();

		parent.entries().forEach(e -> {
			if (System.getProperty(e.getKey()) == null && System.getenv(e.getKey()) == null) {
				System.setProperty(e.getKey(), e.getValue());
			}
		});

		SpringApplication.run(BackendApplication.class, args);
	}
}
