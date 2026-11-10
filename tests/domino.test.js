const { PedraDomino, PartidaDomino } = require('../src/domino');

describe('Dominó (Partida para 02 Jogadores) - Suíte de Casos de Teste', () => {
  describe('1. Conjunto de Pedras (28 peças) e Distribuição Inicial (02 Jogadores)', () => {
    test('CT01 - Deve gerar exatamente as 28 pedras únicas do Dominó ([0|0] a [6|6]), sendo 7 buchas e 21 pedras mistas', () => {
      const pedras = PartidaDomino.criarConjunto28Pedras();
      expect(pedras).toHaveLength(28);

      const buchas = pedras.filter((p) => p.ehBucha());
      expect(buchas).toHaveLength(7);

      const chavesUnicas = new Set(pedras.map((p) => p.toString()));
      expect(chavesUnicas.size).toBe(28);
    });

    test('CT02 - Deve exigir exatamente 2 jogadores e rejeitar pedras com valores fora do intervalo 0..6', () => {
      expect(() => new PartidaDomino(['Apenas Um'])).toThrow(
        'A partida de Dominó deste desafio deve ter exatamente 2 jogadores'
      );
      expect(() => new PartidaDomino(['J1', 'J2', 'J3'])).toThrow(
        'A partida de Dominó deste desafio deve ter exatamente 2 jogadores'
      );
      expect(() => new PedraDomino(-1, 4)).toThrow('Valores de pedra inválidos');
      expect(() => new PedraDomino(3, 7)).toThrow('Valores de pedra inválidos');
    });

    test('CT03 - Ao iniciar a partida para 2 jogadores, deve distribuir 7 pedras para cada jogador e manter 14 pedras no monte (dorme)', () => {
      const partida = new PartidaDomino(['Alice', 'Bob']);
      partida.iniciarPartida();

      expect(partida.jogadores[0].mao).toHaveLength(7);
      expect(partida.jogadores[1].mao).toHaveLength(7);
      expect(partida.monte).toHaveLength(14);
      expect(partida.status).toBe('EM_ANDAMENTO');
    });

    test('CT04 - Deve definir como primeiro jogador quem possuir a maior bucha (carroça) na mão', () => {
      const partida = new PartidaDomino();
      partida.jogadores[0].mao = [new PedraDomino(4, 4), new PedraDomino(1, 2)];
      partida.jogadores[1].mao = [new PedraDomino(6, 6), new PedraDomino(0, 1)];

      expect(partida.determinarPrimeiroJogador()).toBe(1);
    });
  });

  describe('2. Mecânica de Encaixe nas Pontas da Mesa e Rotação Automática', () => {
    test('CT05 - Deve abrir a mesa na primeira jogada e encaixar pedras nas pontas esquerda e direita girando-as quando necessário', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.jogadorDaVez = 0;

      partida.jogadores[0].mao = [new PedraDomino(6, 6), new PedraDomino(2, 5)];
      partida.jogadores[1].mao = [new PedraDomino(5, 6), new PedraDomino(1, 3)];

      // Jogador 1 abre com [6|6] -> pontas: esquerda=6, direita=6
      partida.jogarPedra(0, 0);
      expect(partida.pontaEsquerda).toBe(6);
      expect(partida.pontaDireita).toBe(6);
      expect(partida.jogadorDaVez).toBe(1);

      // Jogador 2 joga [5|6] na direita -> deve girar para [6|5], deixando pontaDireita = 5
      partida.jogarPedra(1, 0, 'direita');
      expect(partida.pontaEsquerda).toBe(6);
      expect(partida.pontaDireita).toBe(5);
      expect(partida.jogadorDaVez).toBe(0);

      // Jogador 1 joga [2|5] na direita -> deve girar para [5|2], deixando pontaDireita = 2
      partida.jogarPedra(0, 0, 'direita');
      expect(partida.pontaDireita).toBe(2);
    });

    test('CT06 - Deve impedir jogar fora da sua vez ou tentar encaixar uma pedra incompatível com a ponta escolhida', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.jogadorDaVez = 0;
      partida.jogadores[0].mao = [new PedraDomino(6, 6), new PedraDomino(0, 1)];
      partida.jogadores[1].mao = [new PedraDomino(2, 3), new PedraDomino(4, 5)];

      // Jogador 2 tenta jogar na vez do Jogador 1
      expect(() => partida.jogarPedra(1, 0)).toThrow('Não é a vez do Jogador 2');

      // Jogador 1 abre com [6|6]
      partida.jogarPedra(0, 0);

      // Jogador 2 tenta jogar [2|3] em uma mesa com pontas 6 e 6
      expect(() => partida.jogarPedra(1, 0, 'esquerda')).toThrow(
        'A pedra [2|3] não encaixa na ponta esquerda (6)'
      );
    });
  });

  describe('3. Compra no Monte (Dorme) e Regras de Passar a Vez', () => {
    test('CT07 - Jogador sem peça compatível deve comprar do monte até conseguir jogar, sendo proibido comprar se já tiver jogada válida', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      partida.jogadorDaVez = 0;

      partida.jogadores[0].mao = [new PedraDomino(1, 2)]; // Não encaixa no 6
      partida.monte = [new PedraDomino(6, 4)]; // Topo do monte é [6|4]

      // Como ainda há pedra no monte, não pode passar a vez sem comprar
      expect(() => partida.passarVez(0)).toThrow(
        'Não é permitido passar a vez enquanto houver pedras no monte para comprar'
      );

      // Compra do monte e recebe [6|4]
      const comprada = partida.comprarDoMonte(0);
      expect(comprada.toString()).toBe('[6|4]');
      expect(partida.jogadores[0].mao).toHaveLength(2);

      // Agora que tem [6|4] na mão, não pode comprar novamente nem passar a vez
      expect(() => partida.comprarDoMonte(0)).toThrow(
        'O jogador já possui pedra compatível na mão e não precisa comprar do monte'
      );
      expect(() => partida.passarVez(0)).toThrow(
        'Não é permitido passar a vez tendo uma pedra jogável na mão'
      );
    });
  });

  describe('4. Condições de Vitória: Batida Simples e Jogo Fechado (Trancado)', () => {
    test('CT08 - Deve declarar vitória por BATIDA imediatamente quando um jogador coloca sua última pedra na mesa', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(3, 3)];
      partida.pontaEsquerda = 3;
      partida.pontaDireita = 3;
      partida.jogadorDaVez = 0;

      partida.jogadores[0].mao = [new PedraDomino(3, 5)]; // Última pedra do Jogador 1
      partida.jogadores[1].mao = [new PedraDomino(1, 1), new PedraDomino(2, 4)];

      partida.jogarPedra(0, 0, 'direita');

      expect(partida.status).toBe('FINALIZADA');
      expect(partida.motivoFim).toBe('BATIDA');
      expect(partida.vencedor).toBe(0);
    });

    test('CT09 - Quando o monte está vazio e ambos os jogadores passam a vez consecutivamente (JOGO_FECHADO), deve vencer quem tiver menos pontos na mão', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      partida.monte = []; // Monte vazio
      partida.jogadorDaVez = 0;

      // Jogador 1 tem [1|2] (3 pontos); Jogador 2 tem [4|5] (9 pontos). Nenhum tem 6.
      partida.jogadores[0].mao = [new PedraDomino(1, 2)];
      partida.jogadores[1].mao = [new PedraDomino(4, 5)];

      partida.passarVez(0);
      expect(partida.status).toBe('EM_ANDAMENTO');
      expect(partida.jogadorDaVez).toBe(1);

      partida.passarVez(1);
      expect(partida.status).toBe('FINALIZADA');
      expect(partida.motivoFim).toBe('JOGO_FECHADO');
      expect(partida.vencedor).toBe(0); // Jogador 1 vence por 3 pontos contra 9
    });

    test('CT10 - Em caso de Jogo Fechado com mesma pontuação na mão de ambos os jogadores, deve declarar EMPATE', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      partida.monte = [];
      partida.jogadorDaVez = 0;

      partida.jogadores[0].mao = [new PedraDomino(2, 3)]; // 5 pontos
      partida.jogadores[1].mao = [new PedraDomino(1, 4)]; // 5 pontos

      partida.passarVez(0);
      partida.passarVez(1);

      expect(partida.status).toBe('FINALIZADA');
      expect(partida.motivoFim).toBe('JOGO_FECHADO');
      expect(partida.vencedor).toBe('EMPATE');
    });
  });

  describe('5. Primeiro Jogador sem Bucha, Encaixe à Esquerda e Jogadas Inválidas', () => {
    test('CT11 - Sem nenhuma bucha nas mãos, deve começar quem tiver a pedra de maior soma', () => {
      const partida = new PartidaDomino();
      partida.jogadores[0].mao = [new PedraDomino(1, 2), new PedraDomino(0, 3)]; // maior soma: 3
      partida.jogadores[1].mao = [new PedraDomino(4, 5), new PedraDomino(2, 6)]; // maior soma: 9
      expect(partida.determinarPrimeiroJogador()).toBe(1);

      partida.jogadores[0].mao = [new PedraDomino(5, 6), new PedraDomino(0, 3)]; // maior soma: 11
      partida.jogadores[1].mao = [new PedraDomino(1, 2), new PedraDomino(0, 4)]; // maior soma: 4
      expect(partida.determinarPrimeiroJogador()).toBe(0);
    });

    test('CT12 - Deve encaixar pedras na ponta esquerda da mesa, girando a pedra quando necessário', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.jogadorDaVez = 0;
      partida.jogadores[0].mao = [new PedraDomino(6, 6), new PedraDomino(1, 3), new PedraDomino(2, 2)];
      partida.jogadores[1].mao = [new PedraDomino(6, 3), new PedraDomino(0, 0)];

      partida.jogarPedra(0, 0); // abre com [6|6]

      // [6|3] na esquerda: gira para [3|6] e a ponta esquerda passa a ser 3
      partida.jogarPedra(1, 0, 'esquerda');
      expect(partida.pontaEsquerda).toBe(3);
      expect(partida.pontaDireita).toBe(6);

      // [1|3] na esquerda: já encaixa sem girar e a ponta esquerda passa a ser 1
      partida.jogarPedra(0, 0, 'esquerda');
      expect(partida.pontaEsquerda).toBe(1);
      expect(partida.pontaDireita).toBe(6);
      expect(partida.mesa.map((p) => p.toString())).toEqual(['[1|3]', '[3|6]', '[6|6]']);
    });

    test('CT13 - Deve rejeitar jogada com a partida não iniciada, índice de pedra inexistente ou extremidade desconhecida', () => {
      const partida = new PartidaDomino();
      partida.jogadores[0].mao = [new PedraDomino(6, 6)];

      // A partida ainda não foi iniciada
      expect(() => partida.jogarPedra(0, 0)).toThrow('A partida não está em andamento');

      partida.status = 'EM_ANDAMENTO';
      partida.jogadorDaVez = 0;
      expect(() => partida.jogarPedra(0, 3)).toThrow('Índice de pedra inválido na mão do jogador');

      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      expect(() => partida.jogarPedra(0, 0, 'centro')).toThrow(
        "Extremidade inválida: centro. Use 'esquerda' ou 'direita'"
      );
    });

    test('CT14 - Não deve permitir comprar de um monte vazio nem comprar ou passar a vez fora do próprio turno', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      partida.jogadorDaVez = 0;
      partida.jogadores[0].mao = [new PedraDomino(1, 2)];
      partida.jogadores[1].mao = [new PedraDomino(3, 4)];
      partida.monte = [];

      expect(() => partida.comprarDoMonte(1)).toThrow('Não é a vez do Jogador 2');
      expect(() => partida.passarVez(1)).toThrow('Não é a vez do Jogador 2');
      expect(() => partida.comprarDoMonte(0)).toThrow('O monte de compra (dorme) está vazio');
    });

    test('CT15 - Deve permitir compras múltiplas até obter pedra compatível (mantendo o turno) ou até esgotar o monte para liberar o passe', () => {
      const partida = new PartidaDomino();
      partida.status = 'EM_ANDAMENTO';
      partida.mesa = [new PedraDomino(6, 6)];
      partida.pontaEsquerda = 6;
      partida.pontaDireita = 6;
      partida.jogadorDaVez = 0;

      // Jogador 1 não possui pedra compatível com 6
      partida.jogadores[0].mao = [new PedraDomino(1, 2)];
      partida.jogadores[1].mao = [new PedraDomino(0, 1)];

      // Topo do monte (pop) é [2|3] (incompatível) e logo abaixo está [6|4] (compatível)
      partida.monte = [new PedraDomino(6, 4), new PedraDomino(2, 3)];

      // 1ª compra: recebe [2|3] (incompatível), mantém o turno em 0 e continua podendo comprar
      const primeiraCompra = partida.comprarDoMonte(0);
      expect(primeiraCompra.toString()).toBe('[2|3]');
      expect(partida.jogadorDaVez).toBe(0);
      expect(partida.jogadores[0].mao).toHaveLength(2);

      // 2ª compra: recebe [6|4] (compatível) e o turno permanece com o Jogador 1
      const segundaCompra = partida.comprarDoMonte(0);
      expect(segundaCompra.toString()).toBe('[6|4]');
      expect(partida.jogadorDaVez).toBe(0);
      expect(partida.jogadores[0].mao).toHaveLength(3);

      // Como agora possui pedra jogável ([6|4]), nova compra é bloqueada
      expect(() => partida.comprarDoMonte(0)).toThrow(
        'O jogador já possui pedra compatível na mão e não precisa comprar do monte'
      );

      // Jogador 1 joga a pedra comprada [6|4] na direita -> pontas ficam 6 e 4, turno avança para 1
      partida.jogarPedra(0, 2, 'direita');
      expect(partida.jogadorDaVez).toBe(1);
      expect(partida.pontaDireita).toBe(4);

      // Agora o Jogador 2 (mão [0|1]) compra até o monte acabar sem encontrar pedra compatível com 6 ou 4
      partida.monte = [new PedraDomino(0, 2), new PedraDomino(1, 3)];

      expect(partida.comprarDoMonte(1).toString()).toBe('[1|3]');
      expect(partida.jogadorDaVez).toBe(1);
      expect(partida.comprarDoMonte(1).toString()).toBe('[0|2]');
      expect(partida.jogadorDaVez).toBe(1);
      expect(partida.monte).toHaveLength(0);

      // Monte acabou sem pedra compatível: bloqueia nova compra e libera passar a vez
      expect(() => partida.comprarDoMonte(1)).toThrow('O monte de compra (dorme) está vazio');
      partida.passarVez(1);
      expect(partida.jogadorDaVez).toBe(0);
    });
  });
});
