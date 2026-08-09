package com.semeia_nordeste.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.semeia_nordeste.backend.model.Loja;

@Repository
public interface LojaRepository extends JpaRepository<Loja, Long> {

    Optional<Loja> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);

    boolean existsByNomeLoja(String nomeLoja);

    Page<Loja> findByVerificadaFalseAndSuspensaFalse(Pageable pageable);

    Page<Loja> findByVerificadaTrueAndSuspensaFalse(Pageable pageable);

    long countByVerificadaTrueAndSuspensaFalse();

    java.util.List<Loja> findByUsuarioGeneroAndVerificadaTrueAndSuspensaFalse(String genero);
}
