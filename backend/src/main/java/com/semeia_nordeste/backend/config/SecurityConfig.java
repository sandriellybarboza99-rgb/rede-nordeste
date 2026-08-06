package com.semeia_nordeste.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Autowired
        private SecurityFilter securityFilter;

        @Autowired
        private RateLimitFilter rateLimitFilter;

        @Value("${cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
        private String allowedOrigins;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 1 — PÚBLICO (auth)
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/usuarios/registrar",
                                                                "/api/usuarios/login",
                                                                "/api/usuarios/refresh")
                                                .permitAll()

                                                // 2 — PÚBLICO (utilitários)
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/entregadores/cadastrar",
                                                                "/api/frete/simular")
                                                .permitAll()

                                                // 3 — WebSocket handshake (token validado no STOMP CONNECT)
                                                .requestMatchers("/ws/**").permitAll()

                                                // 4 — PÚBLICO (leitura — catálogo + conteúdo)
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/produtos/**",
                                                                "/api/lojas/**",
                                                                "/api/categorias",
                                                                "/api/receitas/**",
                                                                "/api/banners",
                                                                "/api/banners/**",
                                                                "/api/noticias",
                                                                "/api/noticias/**",
                                                                "/api/cep/**")
                                                .permitAll()

                                                // 5 — ADMIN
                                                .requestMatchers("/api/admin/**",
                                                                "/api/categorias/admin/**")
                                                .hasAuthority("ADMIN")

                                                // 6 — PRODUTOR
                                                .requestMatchers("/api/produtor/chats/**").hasAuthority("PRODUTOR")
                                                .requestMatchers("/api/produtor/**")
                                                .hasAnyAuthority("PRODUTOR", "ADMIN")

                                                // 7 — COMPRADOR (e PRODUTOR também pode comprar)
                                                // Regra de negócio: PRODUTOR vende E pode comprar de outras lojas.
                                                // Por isso liberamos carrinho/checkout/pedidos/chats para ambos.
                                                .requestMatchers("/api/comprador/chats/**")
                                                .hasAnyAuthority("COMPRADOR", "PRODUTOR")
                                                .requestMatchers("/api/comprador/**")
                                                .hasAnyAuthority("COMPRADOR", "PRODUTOR", "ADMIN")

                                                // 8 — Chat genérico (participantes validados no service)
                                                .requestMatchers("/api/chats/**").authenticated()

                                                // 9 — fallback
                                                .anyRequest().authenticated())
                                // RateLimitFilter ANTES do SecurityFilter — bloqueia brute-force
                                // sem nem chegar na validação de senha (que é cara).
                                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                                .httpBasic(basic -> basic.disable())
                                .formLogin(form -> form.disable());

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
                configuration.setAllowedMethods(
                                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public BCryptPasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
