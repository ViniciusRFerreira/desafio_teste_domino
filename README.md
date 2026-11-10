# 🁢 Desafio de Teste: Dominó (`desafio_teste_domino`)

Repositório contendo a implementação em JavaScript e a suíte de **casos de teste automatizados (Jest)** para uma **partida de Dominó para 02 jogadores**.

---

## 👥 Colaborador(es)

- Vinicius Ramon Ferreira (@ViniciusRFerreira)

---

## 📋 Regras do Dominó (02 Jogadores)

1. **Conjunto Completo de 28 Pedras**: Peças únicas de `[0|0]` até `[6|6]`, sendo 7 buchas/carroças e 21 peças mistas.
2. **Distribuição para 02 Jogadores**:
   - Cada jogador recebe **7 pedras** no início da partida.
   - As **14 pedras restantes** compõem o **monte de compra (dorme)**.
3. **Saída Inicial**: Inicia a partida o jogador que possuir a maior bucha (`[6|6]`, `[5|5]`, etc.) ou, na ausência de buchas, a pedra de maior soma.
4. **Encaixe nas Pontas**: As pedras devem conectar com o número exposto na ponta esquerda ou direita da mesa, rotacionando automaticamente os lados quando necessário.
5. **Compra no Dorme e Passar a Vez**:
   - Se o jogador da vez não tiver pedra compatível na mão, deve comprar do monte até encontrar uma pedra jogável ou o monte acabar.
   - Só é permitido passar a vez se o jogador não tiver jogada válida **e** o monte estiver vazio.
6. **Fim de Partida**:
   - **Batida**: Vence quem esvaziar a mão primeiro.
   - **Jogo Fechado (Trancado)**: Se o monte acabar e ambos passarem a vez seguidamente, vence quem somar menos pontos nas pedras restantes da mão (ou empata se a soma for igual).

---

## 🧪 Funcionamento dos Casos de Teste (`tests/domino.test.js`)

A suíte possui **15 casos de teste** organizados em 5 seções:

| ID | Caso de Teste | O que valida / Como funciona |
| :--- | :--- | :--- |
| **CT01** | Geração das 28 pedras únicas | Verifica se `criarConjunto28Pedras()` cria exatamente 28 pedras sem repetição, incluindo as 7 buchas (`[0\|0]` a `[6\|6]`). |
| **CT02** | Validação de 02 jogadores e limites das pedras | Garante que a partida rejeita números de jogadores diferentes de 2 e rejeita pedras com valores menores que 0 ou maiores que 6. |
| **CT03** | Distribuição de 7 pedras por jogador e 14 no dorme | Inicia a partida e valida que cada jogador recebeu 7 pedras e restaram exatamente 14 pedras no monte de compra. |
| **CT04** | Definição do primeiro jogador pela maior bucha | Atribui `[4\|4]` ao Jogador 1 e `[6\|6]` ao Jogador 2, verificando que o Jogador 2 é escolhido para começar. |
| **CT05** | Abertura da mesa e encaixe com rotação de pedra | Joga `[6\|6]`, encaixa `[5\|6]` na direita (girando para `[6\|5]`) e depois `[2\|5]` (girando para `[5\|2]`), validando as pontas da mesa. |
| **CT06** | Bloqueio de jogada fora de turno ou incompatível | Garante que tentar jogar fora da vez ou tentar encaixar `[2\|3]` em uma ponta `6` lança erro. |
| **CT07** | Regras de compra no monte (dorme) e passe de vez | Verifica que o jogador sem peça compatível é impedido de passar se houver monte, compra `[6\|4]` e depois é impedido de comprar novamente por já ter jogada válida. |
| **CT08** | Vitória por Batida (mão vazia) | Simula o jogador jogando sua última pedra e valida `status === 'FINALIZADA'` e `motivoFim === 'BATIDA'`. |
| **CT09** | Vitória por menor pontuação em Jogo Fechado | Com monte vazio e ambos sem jogada, simula 2 passes seguidos e valida vitória de quem tem menos pontos na mão (`3` vs `9`). |
| **CT10** | Empate em Jogo Fechado com mesma pontuação | Simula jogo trancado onde ambos somam 5 pontos na mão e verifica que `vencedor === 'EMPATE'`. |
| **CT11** | Primeiro jogador sem bucha | Sem nenhuma bucha nas mãos, começa quem tiver a pedra de maior soma. |
| **CT12** | Encaixe na ponta esquerda | Joga `[6\|3]` e depois `[1\|3]` na esquerda e confere a rotação da pedra, as duas pontas e a ordem das pedras na mesa. |
| **CT13** | Jogadas inválidas | Confere os erros ao jogar com a partida não iniciada, com índice de pedra inexistente e com extremidade desconhecida. |
| **CT14** | Compra e passe fora de hora | Confere os erros ao comprar de monte vazio e ao comprar ou passar a vez fora do próprio turno. |
| **CT15** | Compras sucessivas até achar peça ou esgotar o monte | Compra uma pedra incompatível (`[2\|3]`) seguida de uma compatível (`[6\|4]`) mantendo o mesmo turno e bloqueando nova compra; depois simula compras sucessivas até esgotar o monte sem peça compatível para liberar `passarVez()`. |

---

## Interface esperada pelos testes

O arquivo `src/domino.js` usa `module.exports` para exportar `{ PedraDomino, PartidaDomino }`, importado nos testes com `require('../src/domino')`.

- `new PedraDomino(a, b)` com lados de 0 a 6. Métodos `ehBucha()` e `toString()` (formato `'[a|b]'`).
- `PartidaDomino.criarConjunto28Pedras()` (método estático) retorna as 28 pedras.
- `new PartidaDomino(nomes = ['Jogador 1', 'Jogador 2'])`: exige exatamente 2 jogadores.
- Propriedades da partida: `jogadores` (cada um com `mao`), `monte`, `mesa`, `pontaEsquerda`, `pontaDireita`, `jogadorDaVez` (0 ou 1), `status` (`'AGUARDANDO_INICIO'`, `'EM_ANDAMENTO'` ou `'FINALIZADA'`), `motivoFim` (`'BATIDA'` ou `'JOGO_FECHADO'`) e `vencedor` (0, 1 ou `'EMPATE'`).
- Métodos da partida: `iniciarPartida()`, `determinarPrimeiroJogador()` (retorna 0 ou 1), `jogarPedra(idJogador, indiceNaMao, extremidade = 'direita')`, `comprarDoMonte(idJogador)` (retorna a pedra comprada) e `passarVez(idJogador)`.

As mensagens de erro também são conferidas pelos testes; o texto exato esperado em cada caso está em `tests/domino.test.js`.

---

## 🚀 Como Executar os Testes

```bash
# 1. Instalar as dependências (Jest)
npm install

# 2. Executar a suíte de testes
npm test
```
