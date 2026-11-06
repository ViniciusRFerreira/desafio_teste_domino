/**
 * Implementação de uma partida de Dominó para 02 Jogadores.
 */

class PedraDomino {
  constructor(ladoA, ladoB) {
    if (
      !Number.isInteger(ladoA) ||
      !Number.isInteger(ladoB) ||
      ladoA < 0 ||
      ladoA > 6 ||
      ladoB < 0 ||
      ladoB > 6
    ) {
      throw new Error(`Valores de pedra inválidos: [${ladoA}|${ladoB}]. Permitido apenas de 0 a 6`);
    }
    this.ladoA = ladoA;
    this.ladoB = ladoB;
  }

  ehBucha() {
    return this.ladoA === this.ladoB;
  }

  somaPontos() {
    return this.ladoA + this.ladoB;
  }

  possuiValor(valor) {
    return this.ladoA === valor || this.ladoB === valor;
  }

  toString() {
    return `[${this.ladoA}|${this.ladoB}]`;
  }
}

class PartidaDomino {
  constructor(nomesJogadores = ['Jogador 1', 'Jogador 2']) {
    if (!Array.isArray(nomesJogadores) || nomesJogadores.length !== 2) {
      throw new Error('A partida de Dominó deste desafio deve ter exatamente 2 jogadores');
    }

    this.jogadores = [
      { id: 0, nome: nomesJogadores[0], mao: [] },
      { id: 1, nome: nomesJogadores[1], mao: [] }
    ];

    this.monte = []; // Dorme
    this.mesa = [];  // Lista de pedras jogadas na mesa
    this.pontaEsquerda = null;
    this.pontaDireita = null;
    this.jogadorDaVez = 0;
    this.passesConsecutivos = 0;
    this.status = 'AGUARDANDO_INICIO'; // 'AGUARDANDO_INICIO' | 'EM_ANDAMENTO' | 'FINALIZADA'
    this.vencedor = null; // 0, 1 ou 'EMPATE'
    this.motivoFim = null; // 'BATIDA' | 'JOGO_FECHADO'
  }

  static criarConjunto28Pedras() {
    const pedras = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        pedras.push(new PedraDomino(i, j));
      }
    }
    return pedras;
  }

  iniciarPartida() {
    const todasPedras = PartidaDomino.criarConjunto28Pedras();

    // Embaralhamento Fisher-Yates
    for (let i = todasPedras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasPedras[i], todasPedras[j]] = [todasPedras[j], todasPedras[i]];
    }

    // Distribui 7 pedras para cada um dos 2 jogadores e deixa 14 no monte (dorme)
    this.jogadores[0].mao = todasPedras.slice(0, 7);
    this.jogadores[1].mao = todasPedras.slice(7, 14);
    this.monte = todasPedras.slice(14, 28);

    this.mesa = [];
    this.pontaEsquerda = null;
    this.pontaDireita = null;
    this.passesConsecutivos = 0;
    this.status = 'EM_ANDAMENTO';
    this.vencedor = null;
    this.motivoFim = null;

    this.jogadorDaVez = this.determinarPrimeiroJogador();
  }

  /**
   * Determina quem inicia a partida: quem tiver a maior bucha ([6|6] down to [0|0]),
   * ou, caso ninguém tenha bucha, quem tiver a pedra de maior soma.
   */
  determinarPrimeiroJogador() {
    for (let valor = 6; valor >= 0; valor--) {
      const j0TemBucha = this.jogadores[0].mao.some((p) => p.ladoA === valor && p.ladoB === valor);
      const j1TemBucha = this.jogadores[1].mao.some((p) => p.ladoA === valor && p.ladoB === valor);
      if (j0TemBucha) return 0;
      if (j1TemBucha) return 1;
    }

    const maiorSomaJ0 = Math.max(...this.jogadores[0].mao.map((p) => p.somaPontos()));
    const maiorSomaJ1 = Math.max(...this.jogadores[1].mao.map((p) => p.somaPontos()));
    return maiorSomaJ1 > maiorSomaJ0 ? 1 : 0;
  }

  pedraEncaixaNaMesa(pedra) {
    if (this.mesa.length === 0) return true;
    return pedra.possuiValor(this.pontaEsquerda) || pedra.possuiValor(this.pontaDireita);
  }

  jogadorTemJogadaValida(idJogador) {
    return this.jogadores[idJogador].mao.some((pedra) => this.pedraEncaixaNaMesa(pedra));
  }

  /**
   * Joga uma pedra da mão do jogador da vez na extremidade escolhida ('esquerda' ou 'direita').
   */
  jogarPedra(idJogador, indiceMao, extremidade = 'direita') {
    if (this.status !== 'EM_ANDAMENTO') {
      throw new Error('A partida não está em andamento');
    }
    if (idJogador !== this.jogadorDaVez) {
      throw new Error(`Não é a vez do Jogador ${idJogador + 1}`);
    }

    const jogador = this.jogadores[idJogador];
    if (indiceMao < 0 || indiceMao >= jogador.mao.length) {
      throw new Error('Índice de pedra inválido na mão do jogador');
    }

    const pedra = jogador.mao[indiceMao];

    if (this.mesa.length === 0) {
      this.pontaEsquerda = pedra.ladoA;
      this.pontaDireita = pedra.ladoB;
      this.mesa.push(pedra);
    } else if (extremidade === 'esquerda') {
      if (pedra.ladoB === this.pontaEsquerda) {
        this.pontaEsquerda = pedra.ladoA;
        this.mesa.unshift(pedra);
      } else if (pedra.ladoA === this.pontaEsquerda) {
        // Gira a pedra para conectar ladoA na pontaEsquerda
        const pedraGirada = new PedraDomino(pedra.ladoB, pedra.ladoA);
        this.pontaEsquerda = pedraGirada.ladoA;
        this.mesa.unshift(pedraGirada);
      } else {
        throw new Error(`A pedra ${pedra} não encaixa na ponta esquerda (${this.pontaEsquerda})`);
      }
    } else if (extremidade === 'direita') {
      if (pedra.ladoA === this.pontaDireita) {
        this.pontaDireita = pedra.ladoB;
        this.mesa.push(pedra);
      } else if (pedra.ladoB === this.pontaDireita) {
        // Gira a pedra para conectar ladoB na pontaDireita
        const pedraGirada = new PedraDomino(pedra.ladoB, pedra.ladoA);
        this.pontaDireita = pedraGirada.ladoB;
        this.mesa.push(pedraGirada);
      } else {
        throw new Error(`A pedra ${pedra} não encaixa na ponta direita (${this.pontaDireita})`);
      }
    } else {
      throw new Error(`Extremidade inválida: ${extremidade}. Use 'esquerda' ou 'direita'`);
    }

    // Remove a pedra da mão do jogador
    jogador.mao.splice(indiceMao, 1);
    this.passesConsecutivos = 0;

    // Verifica batida (mão vazia)
    if (jogador.mao.length === 0) {
      this.status = 'FINALIZADA';
      this.vencedor = idJogador;
      this.motivoFim = 'BATIDA';
      return;
    }

    // Passa o turno para o outro jogador
    this.jogadorDaVez = idJogador === 0 ? 1 : 0;
  }

  /**
   * Compra uma pedra do monte (dorme) caso o jogador da vez não tenha nenhuma pedra compatível na mão.
   */
  comprarDoMonte(idJogador) {
    if (this.status !== 'EM_ANDAMENTO') {
      throw new Error('A partida não está em andamento');
    }
    if (idJogador !== this.jogadorDaVez) {
      throw new Error(`Não é a vez do Jogador ${idJogador + 1}`);
    }
    if (this.jogadorTemJogadaValida(idJogador)) {
      throw new Error('O jogador já possui pedra compatível na mão e não precisa comprar do monte');
    }
    if (this.monte.length === 0) {
      throw new Error('O monte de compra (dorme) está vazio');
    }

    const pedraComprada = this.monte.pop();
    this.jogadores[idJogador].mao.push(pedraComprada);
    return pedraComprada;
  }

  /**
   * Passa a vez apenas quando o jogador não tem jogada válida e o monte está vazio.
   */
  passarVez(idJogador) {
    if (this.status !== 'EM_ANDAMENTO') {
      throw new Error('A partida não está em andamento');
    }
    if (idJogador !== this.jogadorDaVez) {
      throw new Error(`Não é a vez do Jogador ${idJogador + 1}`);
    }
    if (this.jogadorTemJogadaValida(idJogador)) {
      throw new Error('Não é permitido passar a vez tendo uma pedra jogável na mão');
    }
    if (this.monte.length > 0) {
      throw new Error('Não é permitido passar a vez enquanto houver pedras no monte para comprar');
    }

    this.passesConsecutivos++;

    if (this.passesConsecutivos >= 2) {
      this._resolverJogoFechado();
      return;
    }

    this.jogadorDaVez = idJogador === 0 ? 1 : 0;
  }

  calcularPontosMao(idJogador) {
    return this.jogadores[idJogador].mao.reduce((acc, pedra) => acc + pedra.somaPontos(), 0);
  }

  _resolverJogoFechado() {
    this.status = 'FINALIZADA';
    this.motivoFim = 'JOGO_FECHADO';

    const pontosJ0 = this.calcularPontosMao(0);
    const pontosJ1 = this.calcularPontosMao(1);

    if (pontosJ0 < pontosJ1) {
      this.vencedor = 0;
    } else if (pontosJ1 < pontosJ0) {
      this.vencedor = 1;
    } else {
      this.vencedor = 'EMPATE';
    }
  }
}

module.exports = {
  PedraDomino,
  PartidaDomino
};
