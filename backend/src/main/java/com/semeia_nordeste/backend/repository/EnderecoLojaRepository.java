package com.semeia_nordeste.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.semeia_nordeste.backend.model.EnderecoLoja;
import com.semeia_nordeste.backend.model.Loja;

@Repository
public interface EnderecoLojaRepository extends JpaRepository<EnderecoLoja, Long> {
    
    List<EnderecoLoja> findByLoja(Loja loja);
    
    Optional<EnderecoLoja> findByIdAndLoja(Long id, Loja loja);
}
