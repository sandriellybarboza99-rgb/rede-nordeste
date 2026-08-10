package com.semeia_nordeste.backend.service;

import com.semeia_nordeste.backend.dto.*;
import com.semeia_nordeste.backend.model.*;
import com.semeia_nordeste.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final CarrinhoService carrinhoService;
    private final ProdutoRepository produtoRepository;
    private final FreteService freteService;
    private final EntregadorService entregadorService;
    private final LojaRepository lojaRepository;
    private final NotificacaoService notificacaoService;

    public PedidoService(PedidoRepository pedidoRepository,
            CarrinhoService carrinhoService,
            ProdutoRepository produtoRepository,
            FreteService freteService,
            EntregadorService entregadorService,
            LojaRepository lojaRepository,
            NotificacaoService notificacaoService) {
        this.pedidoRepository = pedidoRepository;
        this.carrinhoService = carrinhoService;
        this.produtoRepository = produtoRepository;
        this.freteService = freteService;
        this.entregadorService = entregadorService;
        this.lojaRepository = lojaRepository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public Pedido checkout(CheckoutRequest request, Usuario usuario) {
        List<ItemCarrinho> itensCarrinho = carrinhoService
                .listarItensParaCheckout(usuario.getId());

        if (itensCarrinho.isEmpty())
            throw new RuntimeException("Seu carrinho está vazio.");

        // ── Monta itens e desconta estoque ───────────────────────────────
        List<ItemPedido> itensPedido = itensCarrinho.stream().map(ic -> {
            Produto produto = ic.getProduto();
            if (produto.getEstoqueAtual() < ic.getQuantidade())
                throw new RuntimeException("Estoque insuficiente: " + produto.getNome());

            produto.setEstoqueAtual(produto.getEstoqueAtual() - ic.getQuantidade());
            produtoRepository.save(produto);

            ItemPedido item = new ItemPedido();
            item.setProduto(produto);
            item.setQuantidade(ic.getQuantidade());
            item.setPrecoUnitarioNoMomento(produto.getPrecoAtual());
            return item;
        }).toList();

        BigDecimal totalProdutos = itensPedido.stream()
                .map(i -> i.getPrecoUnitarioNoMomento()
                        .multiply(BigDecimal.valueOf(i.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Monta entrega ─────────────────────────────────────────────────
        Entrega entrega = new Entrega();
        java.util.Map<Long, BigDecimal> mapaFreteLocal = new java.util.HashMap<>();

        if (request.retiradaNaLoja()) {
            entrega.setRetiradaNaLoja(true);
            entrega.setStatusEntrega(StatusEntrega.AGUARDANDO_RETIRADA);
            entrega.setEnderecoEntrega("Retirada na loja");
            entrega.setValorFrete(BigDecimal.ZERO);
            entrega.setCodigoRetirada(gerarCodigoRetirada());
        } else {
            // Valida que coordenadas foram enviadas
            if (request.latitudeDestino() == null || request.longitudeDestino() == null)
                throw new RuntimeException("Coordenadas de entrega são obrigatórias.");

            if (!freteService.estaDentroDeSergiipe(
                    request.latitudeDestino(), request.longitudeDestino()))
                throw new RuntimeException(
                        "Entregas disponíveis apenas dentro do estado de Sergipe.");

            BigDecimal freteTotal = BigDecimal.ZERO;
            BigDecimal maiorDistancia = BigDecimal.ZERO;
            TipoVeiculo maiorVeiculo = TipoVeiculo.MOTO;
            CategoriaCarga maiorCategoria = CategoriaCarga.LEVE;
            BigDecimal pesoTotalGeral = BigDecimal.ZERO;
            
            // Variáveis para a loja base do entregador
            double latOrigemBase = -10.9167;
            double lonOrigemBase = -37.0500;
            boolean isFirst = true;

            java.util.Map<Loja, java.util.List<ItemPedido>> itensPorLoja = itensPedido.stream()
                    .collect(java.util.stream.Collectors.groupingBy(i -> i.getProduto().getLoja()));

            for (java.util.Map.Entry<Loja, java.util.List<ItemPedido>> entry : itensPorLoja.entrySet()) {
                Loja loja = entry.getKey();
                double latOrigem = loja.getLatitudeLoja() != null ? loja.getLatitudeLoja() : -10.9167;
                double lonOrigem = loja.getLongitudeLoja() != null ? loja.getLongitudeLoja() : -37.0500;
                
                if (isFirst) {
                    latOrigemBase = latOrigem;
                    lonOrigemBase = lonOrigem;
                    isFirst = false;
                }

                BigDecimal distanciaLoja = freteService.calcularDistanciaKm(
                        latOrigem, lonOrigem, request.latitudeDestino(), request.longitudeDestino());

                if (distanciaLoja.compareTo(maiorDistancia) > 0) maiorDistancia = distanciaLoja;

                BigDecimal pesoLoja = freteService.calcularPesoTotal(entry.getValue());
                pesoTotalGeral = pesoTotalGeral.add(pesoLoja);

                CategoriaCarga categoriaLoja = freteService.classificarCarga(pesoLoja);
                if (categoriaLoja.ordinal() > maiorCategoria.ordinal()) maiorCategoria = categoriaLoja;

                TipoVeiculo veiculoLoja = freteService.definirVeiculo(categoriaLoja, distanciaLoja);
                if (veiculoLoja.ordinal() > maiorVeiculo.ordinal()) maiorVeiculo = veiculoLoja;

                boolean areaRemota = distanciaLoja.doubleValue() > 80;
                BigDecimal freteLoja = freteService.calcularFrete(veiculoLoja, distanciaLoja, areaRemota);
                freteTotal = freteTotal.add(freteLoja);
                mapaFreteLocal.put(loja.getId(), freteLoja);
            }

            BigDecimal frete = freteTotal;
            BigDecimal distancia = maiorDistancia;
            TipoVeiculo veiculo = maiorVeiculo;
            CategoriaCarga categoria = maiorCategoria;
            BigDecimal pesoTotal = pesoTotalGeral;

            // Associa entregador automaticamente
            Entregador entregador = null;
            try {
                entregador = entregadorService.encontrarMaisAdequado(
                        veiculo, latOrigemBase, lonOrigemBase);
                entregador.setDisponivel(false); // marca como ocupado
            } catch (RuntimeException ex) {
                // Se não há entregador, cria entrega pendente sem associação
            }

            entrega.setRetiradaNaLoja(false);
            entrega.setStatusEntrega(entregador != null
                    ? StatusEntrega.AGUARDANDO_ENTREGADOR
                    : StatusEntrega.PEDIDO_RECEBIDO);
            entrega.setEnderecoEntrega(request.enderecoEntrega());
            entrega.setCidadeDestino(request.cidadeDestino());
            entrega.setLatitudeDestino(request.latitudeDestino());
            entrega.setLongitudeDestino(request.longitudeDestino());
            entrega.setDistanciaKm(distancia);
            entrega.setValorFrete(frete);
            entrega.setTipoVeiculoNecessario(veiculo);
            entrega.setCategoriaCarga(categoria);
            entrega.setPesoTotalKg(pesoTotal);
            entrega.setEntregador(entregador);
        }

        // ── Pagamento ─────────────────────────────────────────────────────
        Pagamento pagamento = new Pagamento();
        pagamento.setMetodoPagamento(request.metodoPagamento());
        pagamento.setStatusPagamento(StatusPagamento.AGUARDANDO);

        // ── Total final (produtos + frete) ───────────────────────────────
        BigDecimal totalFinal = totalProdutos.add(
                entrega.getValorFrete() != null ? entrega.getValorFrete() : BigDecimal.ZERO);

        // ── Pedido ───────────────────────────────────────────────────────
        Pedido pedido = new Pedido();
        pedido.setComprador(usuario);
        pedido.setPagamento(pagamento);
        pedido.setEntrega(entrega);
        pedido.setValorTotal(totalFinal);
        pedido.setObservacoes(request.observacoes());
        itensPedido.forEach(i -> i.setPedido(pedido));
        pedido.setItens(itensPedido);
        
        if (request.retiradaNaLoja()) {
            // Se for retirada na loja, todos fretes são 0
            itensCarrinho.forEach(i -> mapaFreteLocal.put(i.getProduto().getLoja().getId(), BigDecimal.ZERO));
        }
        pedido.setFretePorLojaReal(mapaFreteLocal);

        Pedido salvo = pedidoRepository.save(pedido);
        carrinhoService.limpar(usuario);

        // ── Notificações: comprador + cada produtor envolvido ────────────
        // Best-effort: se a notificação falhar não desfazemos o pedido.
        try {
            notificacaoService.notificar(
                    usuario,
                    com.semeia_nordeste.backend.model.TipoNotificacao.PEDIDO,
                    "Pedido confirmado",
                    "Recebemos seu pedido #" + salvo.getId() + ". Total: R$ " + salvo.getValorTotal() + ".",
                    "/perfil");

            // Cada loja diferente envolvida recebe uma notificação de venda
            salvo.getItens().stream()
                    .map(i -> i.getProduto().getLoja().getUsuario())
                    .distinct()
                    .forEach(produtor -> notificacaoService.notificar(
                            produtor,
                            com.semeia_nordeste.backend.model.TipoNotificacao.PEDIDO,
                            "Nova venda!",
                            usuario.getNomeCompleto() + " comprou da sua loja. Pedido #" + salvo.getId() + ".",
                            "/painelvendedor"));
        } catch (Exception e) {
            // Notificação falhou — pedido continua válido, mas registramos
            org.slf4j.LoggerFactory.getLogger(PedidoService.class)
                    .warn("Falha ao criar notificações para pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }

    public Page<Pedido> listarMeusPedidos(Usuario usuario, Pageable pageable) {
        return pedidoRepository.findByCompradorId(usuario.getId(), pageable);
    }

    public Pedido buscarPorId(Long id, Usuario usuario) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado."));

        // Garante que só o dono vê o pedido
        if (!pedido.getComprador().getId().equals(usuario.getId()))
            throw new RuntimeException("Acesso negado.");

        return pedido;
    }

    public Page<Pedido> listarPedidosDaLoja(Usuario usuario, Pageable pageable) {
        return pedidoRepository.findByItens_Produto_Loja_UsuarioId(usuario.getId(), pageable);
    }

    @Transactional
    public Pedido atualizarStatusEntrega(Long pedidoId, StatusEntrega novoStatus, Usuario produtor) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado."));

        boolean pertenceAoProdutor = pedido.getItens().stream()
                .anyMatch(i -> i.getProduto().getLoja().getUsuario().getId().equals(produtor.getId()));

        if (!pertenceAoProdutor)
            throw new RuntimeException("Acesso negado.");

        pedido.getEntrega().setStatusEntrega(novoStatus);
        pedido.getEntrega().setDataAtualizacao(java.time.OffsetDateTime.now());
        
        if (novoStatus != StatusEntrega.PEDIDO_RECEBIDO && novoStatus != StatusEntrega.CANCELADO) {
            pedido.getPagamento().setStatusPagamento(StatusPagamento.APROVADO);
        }
        
        Pedido salvo = pedidoRepository.save(pedido);

        // ── Notifica comprador sobre mudança de status (best-effort) ─────
        try {
            String titulo;
            String mensagem;
            switch (novoStatus) {
                case SAIU_PARA_ENTREGA -> {
                    titulo = "Seu pedido está a caminho";
                    mensagem = "Pedido #" + salvo.getId() + " saiu para entrega. Acompanhe pelo rastreio.";
                }
                case ENTREGUE -> {
                    titulo = "Pedido entregue";
                    mensagem = "Seu pedido #" + salvo.getId() + " foi entregue. Avalie a loja!";
                }
                case CANCELADO -> {
                    titulo = "Pedido cancelado";
                    mensagem = "Seu pedido #" + salvo.getId() + " foi cancelado pela loja.";
                }
                case RETIRADA_DISPONIVEL -> {
                    titulo = "Pedido disponível para retirada";
                    mensagem = "Seu pedido #" + salvo.getId() + " está pronto na loja.";
                }
                default -> {
                    titulo = "Atualização do pedido";
                    mensagem = "O status do pedido #" + salvo.getId() + " mudou para " + novoStatus.name() + ".";
                }
            }
            notificacaoService.notificar(
                    salvo.getComprador(),
                    com.semeia_nordeste.backend.model.TipoNotificacao.PEDIDO,
                    titulo, mensagem, "/perfil");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PedidoService.class)
                    .warn("Falha ao notificar mudança de status do pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }

    @Transactional
    public Pedido confirmarRetirada(Long pedidoId, String codigo, Usuario produtor) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado."));

        boolean pertenceAoProdutor = pedido.getItens().stream()
                .anyMatch(i -> i.getProduto().getLoja().getUsuario().getId().equals(produtor.getId()));
        if (!pertenceAoProdutor)
            throw new RuntimeException("Acesso negado.");

        if (!StatusEntrega.AGUARDANDO_RETIRADA.equals(pedido.getEntrega().getStatusEntrega()))
            throw new RuntimeException("Pedido não está aguardando retirada.");

        if (!pedido.getEntrega().getCodigoRetirada().equals(codigo))
            throw new RuntimeException("Código de retirada inválido.");

        pedido.getEntrega().setStatusEntrega(StatusEntrega.ENTREGUE);
        pedido.getEntrega().setDataEntregue(java.time.OffsetDateTime.now());
        pedido.getEntrega().setDataAtualizacao(java.time.OffsetDateTime.now());
        Pedido salvo = pedidoRepository.save(pedido);

        try {
            notificacaoService.notificar(
                    salvo.getComprador(),
                    com.semeia_nordeste.backend.model.TipoNotificacao.PEDIDO,
                    "Retirada confirmada!",
                    "Pedido #" + salvo.getId() + " foi retirado com sucesso. Obrigada pela compra!",
                    "/perfil");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PedidoService.class)
                    .warn("Falha ao notificar confirmação de retirada do pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }

    private String gerarCodigoRetirada() {
        return String.format("%04d", new java.util.Random().nextInt(10000));
    }
}