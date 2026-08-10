package com.semeia_nordeste.backend.repository;

import com.semeia_nordeste.backend.model.HistoricoEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoEntregaRepository extends JpaRepository<HistoricoEntrega, Long> {
    List<HistoricoEntrega> findByEntregaIdOrderByDataRegistroDesc(Long entregaId);
}
