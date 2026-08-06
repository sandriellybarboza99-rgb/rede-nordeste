package com.semeia_nordeste.backend.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.semeia_nordeste.backend.exception.UnauthorizedException;
import com.semeia_nordeste.backend.model.Sessao;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.repository.SessaoRepository;

import jakarta.servlet.http.HttpServletRequest;

/**
 * CORREÇÃO (erro "duplicate key value violates unique constraint
 * sessoes_refresh_token_key"):
 *
 * A causa raiz foi corrigida no TokenService (adição de jti/UUID a cada
 * token gerado), tornando colisões de refresh_token virtualmente
 * impossíveis. Ainda assim, este serviço agora trata
 * DataIntegrityViolationException de forma graciosa em vez de deixar a
 * exceção estourar como erro 500: se duas requisições concorrentes
 * tentarem criar sessões com o mesmo token (ex.: retry automático do
 * cliente reenviando a mesma requisição), a segunda tentativa não falha —
 * ela simplesmente recupera e devolve a sessão que já foi persistida pela
 * primeira, mantendo o comportamento idempotente.
 */
@Service
public class SessaoService {

    private static final long REFRESH_TTL_HORAS = 24;

    private final SessaoRepository sessaoRepository;

    public SessaoService(SessaoRepository sessaoRepository) {
        this.sessaoRepository = sessaoRepository;
    }

    @Transactional
    public Sessao criar(Usuario usuario, String refreshToken, HttpServletRequest request) {
        try {
            Sessao sessao = new Sessao();
            sessao.setUsuario(usuario);
            sessao.setRefreshToken(refreshToken);
            sessao.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
            sessao.setIp(extrairIp(request));
            sessao.setCriadoEm(OffsetDateTime.now());
            sessao.setExpiraEm(OffsetDateTime.now().plusHours(REFRESH_TTL_HORAS));
            sessao.setUltimoUsoEm(OffsetDateTime.now());
            return sessaoRepository.save(sessao);

        } catch (DataIntegrityViolationException e) {
            // Corrida concorrente: outra requisição já persistiu uma sessão
            // com este exato refresh_token entre o momento em que o token
            // foi gerado e o save() acima. Em vez de propagar um 500,
            // recuperamos a sessão já existente — o resultado é o mesmo
            // para quem chamou (uma sessão válida associada a este token).
            return sessaoRepository.findByRefreshToken(refreshToken)
                    .orElseThrow(() -> e); // se nem assim achar, relança o erro original
        }
    }

    /**
     * Rotaciona a sessão: revoga a antiga e cria uma nova com o novo refresh token.
     * Lança UnauthorizedException se a sessão original não existe ou foi revogada.
     *
     * Também tolera a corrida em que duas requisições de refresh chegam com
     * o mesmo tokenAntigo ao mesmo tempo: a segunda, ao tentar revogar uma
     * sessão que a primeira já revogou, simplesmente segue para criar()
     * (que por sua vez é idempotente quanto a duplicidade de token).
     */
    @Transactional
    public Sessao rotacionar(String tokenAntigo, String tokenNovo, Usuario usuario, HttpServletRequest request) {
        Sessao antiga = sessaoRepository.findByRefreshToken(tokenAntigo)
                .orElseThrow(() -> new UnauthorizedException("Refresh token inválido."));

        if (!antiga.isValida())
            throw new UnauthorizedException("Sessão expirada ou revogada.");

        antiga.setRevogadoEm(OffsetDateTime.now());
        try {
            sessaoRepository.save(antiga);
        } catch (DataIntegrityViolationException ignored) {
            // Outra requisição concorrente já revogou/atualizou esta sessão
            // no meio tempo — não é um erro real, apenas seguimos o fluxo.
        }

        return criar(usuario, tokenNovo, request);
    }

    @Transactional
    public void revogarPorToken(String refreshToken) {
        sessaoRepository.revogarPorToken(refreshToken, OffsetDateTime.now());
    }

    @Transactional
    public int revogarTodasDoUsuario(Long usuarioId) {
        return sessaoRepository.revogarTodasDoUsuario(usuarioId, OffsetDateTime.now());
    }

    public List<Sessao> listarAtivasDoUsuario(Long usuarioId) {
        return sessaoRepository.findByUsuarioIdAndRevogadoEmIsNull(usuarioId);
    }

    private String extrairIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank())
            return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
