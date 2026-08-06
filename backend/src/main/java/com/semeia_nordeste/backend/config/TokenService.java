package com.semeia_nordeste.backend.config;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.semeia_nordeste.backend.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/**
 * CORREÇÃO (causa raiz do erro "duplicate key value violates unique
 * constraint sessoes_refresh_token_key"):
 *
 * O token era gerado apenas com subject + claims + issuedAt (granularidade
 * de milissegundos) + expiration. Se duas requisições de login/refresh
 * chegassem para o MESMO usuário dentro do MESMO milissegundo (comum em
 * cliques duplicados no frontend ou retries automáticos), o JWT resultante
 * era byte-a-byte IDÊNTICO — porque todos os inputs da assinatura eram
 * iguais. Isso fazia o SessaoService tentar inserir duas linhas com o
 * mesmo refresh_token, violando a constraint UNIQUE.
 *
 * A correção adiciona um claim "jti" (JWT ID) com um UUID aleatório a
 * CADA token gerado. Isso garante que dois tokens nunca sejam idênticos,
 * mesmo que emitidos no mesmo instante para o mesmo usuário.
 */
@Service
public class TokenService {

    private final Key key;

    private final long ACCESS_TOKEN_EXPIRATION = 900_000; // 15 min
    private final long REFRESH_TOKEN_EXPIRATION = 86_400_000; // 24h

    public TokenService(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String gerarAccessToken(Usuario usuario) {
        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(usuario.getEmail())
                .claim("perfil", usuario.getTipoPerfil().name())
                .claim("tipo", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String gerarRefreshToken(Usuario usuario) {
        return Jwts.builder()
                // jti garante unicidade mesmo em geração concorrente no mesmo ms.
                .setId(UUID.randomUUID().toString())
                .setSubject(usuario.getEmail())
                .claim("tipo", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String validarToken(String token) {
        try {
            Claims claims = parsear(token);
            if (!"access".equals(claims.get("tipo")))
                return null;
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public String validarRefreshToken(String token) {
        try {
            Claims claims = parsear(token);
            if (!"refresh".equals(claims.get("tipo"))) {
                throw new SecurityException("Token inválido para refresh.");
            }
            return claims.getSubject();
        } catch (JwtException e) {
            throw new SecurityException("Refresh token inválido ou expirado.");
        }
    }

    private Claims parsear(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
