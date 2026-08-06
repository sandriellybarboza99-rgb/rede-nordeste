package com.semeia_nordeste.backend.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.semeia_nordeste.backend.config.PixConfig;
import com.semeia_nordeste.backend.dto.CheckoutRequest;
import com.semeia_nordeste.backend.model.CategoriaCarga;
import com.semeia_nordeste.backend.model.Entrega;
import com.semeia_nordeste.backend.model.Entregador;
import com.semeia_nordeste.backend.model.ItemCarrinho;
import com.semeia_nordeste.backend.model.ItemPedido;
import com.semeia_nordeste.backend.model.Loja;
import com.semeia_nordeste.backend.model.Pagamento;
import com.semeia_nordeste.backend.model.Pedido;
import com.semeia_nordeste.backend.model.Produto;
import com.semeia_nordeste.backend.model.StatusEntrega;
import com.semeia_nordeste.backend.model.StatusPagamento;
import com.semeia_nordeste.backend.model.TipoChavePix;
import com.semeia_nordeste.backend.model.TipoNotificacao;
import com.semeia_nordeste.backend.model.TipoVeiculo;
import com.semeia_nordeste.backend.model.Usuario;
import com.semeia_nordeste.backend.repository.PedidoRepository;
import com.semeia_nordeste.backend.repository.ProdutoRepository;

/**
 * Serviço responsável pelo ciclo de vida dos pedidos.
 */
@Service
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);

    private final PedidoRepository pedidoRepository;
    private final CarrinhoService carrinhoService;
    private final ProdutoRepository produtoRepository;
    private final FreteService freteService;
    private final EntregadorService entregadorService;
    private final NotificacaoService notificacaoService;
    private final PixService pixService;
    private final PixConfig pixConfig;

    public PedidoService(
            PedidoRepository pedidoRepository,
            CarrinhoService carrinhoService,
            ProdutoRepository produtoRepository,
            FreteService freteService,
            EntregadorService entregadorService,
            NotificacaoService notificacaoService,
            PixService pixService,
            PixConfig pixConfig) {

        this.pedidoRepository = pedidoRepository;
        this.carrinhoService = carrinhoService;
        this.produtoRepository = produtoRepository;
        this.freteService = freteService;
        this.entregadorService = entregadorService;
        this.notificacaoService = notificacaoService;
        this.pixService = pixService;
        this.pixConfig = pixConfig;
    }

    @Transactional
    public Pedido checkout(CheckoutRequest request, Usuario usuario) {

        List<ItemCarrinho> itensCarrinho = carrinhoService.listarItensParaCheckout(usuario.getId());

        if (itensCarrinho.isEmpty())
            throw new RuntimeException("Seu carrinho está vazio.");

        // ── Itens ─────────────────────────────────────────────────────
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

        // ── Loja de origem (primeiro item do carrinho) ────────────────
        Loja lojaOrigem = itensCarrinho.get(0).getProduto().getLoja();

        // ── Entrega ───────────────────────────────────────────────────
        Entrega entrega = new Entrega();

        if (request.retiradaNaLoja()) {
            entrega.setRetiradaNaLoja(true);
            entrega.setStatusEntrega(StatusEntrega.RETIRADA_DISPONIVEL);
            entrega.setEnderecoEntrega("Retirada na loja");
            entrega.setValorFrete(BigDecimal.ZERO);

        } else {
            if (request.latitudeDestino() == null || request.longitudeDestino() == null)
                throw new RuntimeException("Coordenadas de entrega são obrigatórias.");

            if (!freteService.estaDentroDeSergiipe(
                    request.latitudeDestino(), request.longitudeDestino()))
                throw new RuntimeException(
                        "Entregas disponíveis apenas dentro do estado de Sergipe.");

            double latOrigem = lojaOrigem.getLatitudeLoja() != null ? lojaOrigem.getLatitudeLoja() : -10.9167;
            double lonOrigem = lojaOrigem.getLongitudeLoja() != null ? lojaOrigem.getLongitudeLoja() : -37.0500;

            BigDecimal distancia = freteService.calcularDistanciaKm(
                    latOrigem, lonOrigem,
                    request.latitudeDestino(), request.longitudeDestino());
            BigDecimal pesoTotal = freteService.calcularPesoTotal(itensPedido);
            CategoriaCarga cat = freteService.classificarCarga(pesoTotal);
            TipoVeiculo veiculo = freteService.definirVeiculo(cat, distancia);
            boolean areaRemota = distancia.doubleValue() > 80;
            BigDecimal frete = freteService.calcularFrete(veiculo, distancia, areaRemota);

            Entregador entregador = null;
            try {
                entregador = entregadorService.encontrarMaisAdequado(veiculo, latOrigem, lonOrigem);
                entregador.setDisponivel(false);
            } catch (RuntimeException ex) {
                /* sem entregador disponível */ }

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
            entrega.setCategoriaCarga(cat);
            entrega.setPesoTotalKg(pesoTotal);
            entrega.setEntregador(entregador);
        }

        // ── Total final ───────────────────────────────────────────────
        BigDecimal totalFinal = totalProdutos.add(
                entrega.getValorFrete() != null ? entrega.getValorFrete() : BigDecimal.ZERO);

        // ── Pagamento ─────────────────────────────────────────────────
        Pagamento pagamento = new Pagamento();
        pagamento.setMetodoPagamento(request.metodoPagamento());

        boolean isPix = "PIX".equalsIgnoreCase(request.metodoPagamento());

        // ── PIX: usa chave, tipo, nome e cidade da loja (fallback → PixConfig)
        if (isPix) {
            String txid = pixService.gerarTxid();
            String chaveLoja = lojaOrigem.getChavePix();
            TipoChavePix tipoChave = lojaOrigem.getTipoChavePix();
            String nomeLoja = lojaOrigem.getNomeLoja();
            String cidadeLoja = lojaOrigem.getCidade();

            String payload = pixService.gerarPayloadParaLoja(
                    totalFinal, txid, chaveLoja, tipoChave, nomeLoja, cidadeLoja);

            pagamento.setPixPayload(payload);
            pagamento.setPixTxid(txid);
            pagamento.setPixChave(
                    (chaveLoja != null && !chaveLoja.isBlank())
                            ? chaveLoja
                            : pixConfig.getChave());

            // Status específico: BR Code gerado, aguardando pagamento no banco
            pagamento.setStatusPagamento(StatusPagamento.PENDENTE_PIX);
        } else {
            pagamento.setStatusPagamento(StatusPagamento.AGUARDANDO);
        }

        // ── Pedido ────────────────────────────────────────────────────
        Pedido pedido = new Pedido();
        pedido.setComprador(usuario);
        pedido.setPagamento(pagamento);
        pedido.setEntrega(entrega);
        pedido.setValorTotal(totalFinal);
        pedido.setObservacoes(request.observacoes());
        itensPedido.forEach(i -> i.setPedido(pedido));
        pedido.setItens(itensPedido);

        Pedido salvo = pedidoRepository.save(pedido);
        carrinhoService.limpar(usuario);

        // ── Notificações (best-effort) ────────────────────────────────
        try {
            notificacaoService.notificar(usuario, TipoNotificacao.PEDIDO,
                    "Pedido confirmado",
                    "Recebemos seu pedido #" + salvo.getId()
                            + ". Total: R$ " + salvo.getValorTotal() + ".",
                    "/perfil");

            salvo.getItens().stream()
                    .map(i -> i.getProduto().getLoja().getUsuario())
                    .distinct()
                    .forEach(produtor -> notificacaoService.notificar(
                            produtor, TipoNotificacao.PEDIDO,
                            "Nova venda!",
                            usuario.getNomeCompleto()
                                    + " comprou da sua loja. Pedido #" + salvo.getId() + ".",
                            "/painelvendedor"));
        } catch (Exception e) {
            log.warn("Falha ao criar notificações para pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }

    public Page<Pedido> listarMeusPedidos(Usuario usuario, Pageable pageable) {
        return pedidoRepository.findByCompradorId(usuario.getId(), pageable);
    }

    public Pedido buscarPorId(Long id, Usuario usuario) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado."));
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
        pedido.getEntrega().setDataAtualizacao(OffsetDateTime.now());
        Pedido salvo = pedidoRepository.save(pedido);

        try {
            String titulo, mensagem;
            switch (novoStatus) {
                case SAIU_PARA_ENTREGA -> {
                    titulo = "Seu pedido está a caminho";
                    mensagem = "Pedido #" + salvo.getId() + " saiu para entrega.";
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
                    titulo = "Pronto para retirada";
                    mensagem = "Seu pedido #" + salvo.getId() + " está pronto na loja.";
                }
                default -> {
                    titulo = "Atualização do pedido";
                    mensagem = "Status do pedido #" + salvo.getId() + ": " + novoStatus.name() + ".";
                }
            }
            notificacaoService.notificar(salvo.getComprador(), TipoNotificacao.PEDIDO, titulo, mensagem, "/perfil");
        } catch (Exception e) {
            log.warn("Falha ao notificar status do pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }

    /**
     * Marca um pagamento PIX como aprovado.
     * Chame este método a partir de um webhook do PSP ou de uma checagem
     * manual/administrativa de confirmação de recebimento.
     */
    @Transactional
    public Pedido confirmarPagamentoPix(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado."));

        if (pedido.getPagamento().getStatusPagamento() != StatusPagamento.PENDENTE_PIX) {
            throw new RuntimeException("Este pedido não está aguardando pagamento PIX.");
        }

        pedido.getPagamento().setStatusPagamento(StatusPagamento.APROVADO);
        pedido.getPagamento().setDataPagamento(OffsetDateTime.now());
        Pedido salvo = pedidoRepository.save(pedido);

        try {
            notificacaoService.notificar(
                    salvo.getComprador(), TipoNotificacao.PEDIDO,
                    "Pagamento confirmado",
                    "Recebemos o pagamento PIX do seu pedido #" + salvo.getId() + ".",
                    "/perfil");
        } catch (Exception e) {
            log.warn("Falha ao notificar confirmação de pagamento do pedido {}: {}", salvo.getId(), e.getMessage());
        }

        return salvo;
    }
}