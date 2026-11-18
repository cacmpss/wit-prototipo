# Juntar €3.000 para uma viagem no próximo verão

Cenário de dados, mapa de cenários conversacionais e protótipo de conteúdo para uma experiência bancária mobile com IA. **Versão 2**, recalibrada a partir de `viagem-content-prototype.md`.

## 1. Cenário de dados

**Natureza do cenário.** É uma proto-persona ilustrativa, sem pesquisa com usuários. Os valores foram escolhidos para que a decisão central seja entre atingir a meta e preservar o dinheiro livre no mês. As falas são ilustrativas.

**Situação.** A pessoa quer juntar €3.000 para viajar no fim de agosto de 2027 e já tem €300 guardados para isso. Faltam €2.700. Ela não sabe quanto consegue guardar por mês.

**Questão que orienta o design.** “Quanto consigo guardar para a viagem e quanto vai sobrar no meu mês se eu fizer isso?”

**Origem dos dados.** A IA usa as movimentações da conta e do cartão do próprio banco, em euros, com a média de setembro a novembro de 2026. A pessoa não digita despesas; ela confere e corrige.

| Média mensal | Hoje | A partir de fevereiro de 2027 |
|---|---:|---:|
| Renda | €1.350 | €1.350 |
| Saúde | €220 | €220 |
| Internet | €24 | €24 |
| Alimentação | €300 | €300 |
| Combustível | €150 | €150 |
| Fatura do cartão | €567 | €211 |
| **Total de despesas** | **€1.261** | **€905** |
| **Sobra estimada** | **€89** | **€445** |

Duas compras parceladas terminam em janeiro de 2027 e reduzem a fatura em €356 por mês. Por isso o plano começa em fevereiro: até lá, a sobra de cerca de €90 é o que a pessoa quer manter livre.

### Vocabulário

| Termo | Significado | Exemplo |
|---|---|---|
| Sobra estimada | Renda menos despesas, antes do depósito | €445 |
| Depósito | Valor mensal enviado para a meta “Viagem” | €350 |
| Livre no mês | Sobra estimada menos o depósito | cerca de €95 |
| Mínimo livre | Quanto a pessoa quer manter livre | €90 |

Valores estimados aparecem arredondados e com “cerca de”. Valores exatos ficam reservados para depósitos e totais agendados.

### Premissas da simulação

- **Sete depósitos mensais**, no dia 5, de 5 de fevereiro a 5 de agosto de 2027.
- **Valor necessário:** €2.700 ÷ 7 = €386 por mês (o último depósito seria de €384 para fechar em €3.000).
- **Os €300 já guardados** contam para a meta desde o início. Não há decisão sobre usá-los ou não.
- **Dados que a pessoa pode corrigir:** despesas, cobranças que deixaram de existir e mudanças na renda. A interface oferece **Ver cálculo** e **Editar despesas** antes da aprovação.
- **Preferência a validar:** o mínimo livre de €90 é um exemplo. O app precisa perguntar para descobrir.

## 2. Mapa de cenários conversacionais

Usamos mapeamento de cenários conversacionais (*conversation mapping*) para definir as ramificações e diálogos de exemplo (*sample dialogues*) para explorar as respostas da IA. A pergunta que orienta cada caminho é **“O que a pessoa ainda precisa resolver para decidir?”**

| Caminho | Gatilho | Papel da IA | Decisão da pessoa | No protótipo |
|---|---|---|---|---|
| **Simples · Aceitar o necessário** | “Pode ser.” | Mostrar o valor necessário e o que ele deixa livre. | Aceitar, testar outro valor ou parar. | Documentado |
| **Mediano · Preservar um mínimo livre** | “€59 é pouco. Quero pelo menos €90 livres.” | Incorporar a preferência e mostrar quanto falta para a meta. | Escolher entre atingir a meta e manter o mínimo livre. | **Percurso principal** |
| **Completo · Fechar a diferença** | “Faltam €250. O que posso mudar?” | Investigar uma cobrança com a pessoa e quantificar a mudança. | Decidir o que rever e qual plano autorizar agora. | Documentado |

Os caminhos compartilham a abertura, a revisão e a confirmação.

## 3. Protótipo de conteúdo

### Abertura comum

**Pessoa** — “Quero juntar €3.000 para viajar no próximo verão, mas não sei quanto consigo guardar por mês.”

**IA** — “Vamos descobrir. Até quando você quer ter o dinheiro? E já tem algum valor guardado para a viagem?”

**Pessoa** — “Até o fim de agosto. Já tenho €300.”

**Interface · resumo corrigível** — Meta €3.000 · Data da viagem: fim de agosto de 2027 · Já guardado: €300 · Faltam €2.700. Ações: **Está certo** · **Corrigir**

**IA** — “Para estimar quanto cabe no seu mês, usei as movimentações da sua conta e do seu cartão de setembro a novembro. Hoje sobram cerca de €90 por mês. Duas compras parceladas terminam em janeiro, e a partir de fevereiro a sobra estimada sobe para cerca de €445.”

**Interface · cartão “Seu mês a partir de fevereiro”** — Uma barra única dividida em despesas (€905) e sobra estimada (€445), sobre a renda de €1.350. Ações: **Simular a partir de fevereiro** · **Ver cálculo** · **Editar despesas**

**IA** — “Para chegar aos €3.000, você precisaria de €386 por mês, de fevereiro a agosto. Isso cabe na sobra estimada e deixaria cerca de €59 livres por mês.”

### Caminho simples · Aceitar o necessário

**Pessoa** — “Pode ser.”

**Interface** — “€386 por mês · €3.000 até agosto · cerca de €59 livres.” Ações: **Revisar plano** · **Testar outro valor**

**Racional.** Resolve o caso em que o valor necessário cabe no mês e a pessoa só precisa de confirmação. O limite é que a IA ainda não sabe quanto a pessoa quer manter livre. A oportunidade é mostrar o valor livre ao lado da sugestão, para que ela possa contestar antes de aceitar.

### Caminho mediano · Preservar um mínimo livre (percurso principal)

**Pessoa** — “€59 é pouco. Quero continuar com pelo menos os €90 que sobram hoje.”

**IA** — “Com €350 por mês, ficariam cerca de €95 livres. Você teria €2.750 até agosto e faltariam €250 para a meta. Quer comparar os valores?”

**Interface · simulador** — Controle de depósito em €350. A meta, a data da viagem e os €300 definidos na conversa ficam fixos no topo.

| Depósito mensal | Livre no mês | Até agosto, com os €300 | Estado mostrado |
|---|---:|---:|---|
| €350 | cerca de €95 | €2.750 | Faltam €250 · mínimo livre preservado |
| €370 | cerca de €75 | €2.890 | Faltam €110 · abaixo dos €90 que você escolheu |
| €386 | cerca de €59 | €3.000 | Meta atingida · abaixo dos €90 que você escolheu |

**Interação · controle** — A pessoa arrasta o depósito de €350 para €386. A barra de progresso chega aos €3.000 e o aviso muda para “Ficariam cerca de €59 livres, abaixo dos €90 que você escolheu”. O botão de continuar permanece ativo: o aviso informa, não bloqueia.

**Interação · conversa** — A pessoa escreve “E se fossem €370?”. O controle se move para €370 e o cartão atualiza a projeção, sem abrir uma nova tela.

**Pessoa** — “Prefiro manter os €350.”

**Interface** — **Revisar 7 depósitos de €350** · **Como chegar aos €3.000?**

**Racional.** A recomendação responde a uma preferência concreta, e o ajuste mostra as duas consequências ao mesmo tempo: quanto falta para a meta e quanto fica livre. O limite é que algumas pessoas têm dificuldade para dizer qual mínimo querem preservar. A oportunidade é oferecer o valor que sobra hoje (€90) como ponto de partida, em vez de pedir um número do zero.

### Caminho completo · Fechar a diferença

Continua do caminho mediano. A meta, a data e o mínimo livre seguem preenchidos.

**Pessoa** — “Faltam €250. O que posso mudar para chegar aos €3.000?”

**IA** — “Podemos rever os gastos. Além da internet de €24, aparece na sua fatura um segundo serviço de internet de cerca de €99 por mês. Você pretende manter os dois?”

**Pessoa** — “Eu já estava pensando em cancelar esse. Quanto isso mudaria?”

**IA** — “Se essa cobrança terminar antes de fevereiro, a sobra estimada sobe para cerca de €544. Você poderia depositar €386, chegar aos €3.000 e ainda ficar com cerca de €158 livres por mês.”

**Pessoa** — “Ainda vou decidir. Quero começar com os €350.”

**IA** — “Certo. O plano para revisão fica em sete depósitos de €350. Você pode aumentar o valor quando a cobrança terminar.”

**Racional.** Resolve a dúvida que aparece quando a pessoa vê a diferença para a meta. O limite é que a fatura não confirma os termos de cancelamento nem a importância do serviço, e por isso a IA pergunta antes de sugerir. Só entra no agendamento o valor que a pessoa escolheu. Se ela disser que precisa dos dois serviços, o fluxo segue com as despesas atuais.

## 4. Revisão e confirmação comuns

**Tela de revisão · percurso principal**

| Campo visível | Conteúdo |
|---|---|
| O que acontece hoje | Nenhum valor sai da sua conta. Os €300 que já estão na poupança ficam marcados para a meta “Viagem”. |
| Depósitos | 7 depósitos de €350, no dia 5, de 5 de fevereiro a 5 de agosto de 2027 · €2.450 no total |
| Origem → destino | Conta corrente → meta “Viagem” |
| Projeção | €2.750 de €3.000 até agosto · faltam €250 |
| Livre no mês | Cerca de €95, pela estimativa a partir de fevereiro |
| Antes do primeiro depósito | Em janeiro, a IA confirma com você se a sobra estimada se manteve. |
| Se não houver saldo no dia 5 | O depósito daquele mês não é feito e você recebe um aviso. Regra a confirmar com o banco. |
| Alterar ou pausar | A qualquer momento, na meta “Viagem”. |

**Ações** — **Agendar 7 depósitos de €350** · **Voltar e editar**

**Confirmação** — “Plano agendado. O primeiro depósito de €350 será em 5 de fevereiro de 2027. Em janeiro, eu confirmo com você se a sobra estimada se manteve.”

**Próximos passos na confirmação** — **Ver meta “Viagem”** · **Alterar ou pausar** · **Como chegar aos €3.000?**

**Variação do caminho simples.** A revisão mostra 6 depósitos de €386 e um último de €384, com a projeção “€3.000 até agosto · meta atingida” e cerca de €59 livres no mês.

## 5. Recorte para o Figma

Prototipar o caminho mediano em cinco telas, uma por etapa da jornada.

| Etapa da jornada | Tela | Visual principal | Passagem entre conversa e controle |
|---|---|---|---|
| 1. Expressar a meta | Conversa com resumo corrigível | Cartão com meta, data e valor já guardado | A fala vira cartão editável |
| 2. Entender o que cabe no orçamento | Conversa com cartão de orçamento | Barra única: despesas e sobra estimada sobre a renda | **Ver cálculo** e **Editar despesas** abrem detalhes sem sair da conversa |
| 3. Experimentar e decidir | Simulador | Controle de depósito, barra de progresso até €3.000 e linha do mínimo livre | O controle e a conversa atualizam a mesma projeção |
| 4. Revisar e autorizar | Revisão | Lista dos campos da seção 4 | Botão que nomeia a ação |
| 5. Confirmar e próximos passos | Confirmação | Estado de sucesso com a primeira data | Atalhos de volta para a conversa |

A mudança de estado a demonstrar é o ajuste de €350 para €386 na tela 3, com o aviso do mínimo livre.

Para testar, pausar antes da aprovação e perguntar **“Quanto você terá para a viagem em agosto, quanto fica livre por mês e o que acontece hoje se você confirmar?”**. As respostas mostram se a pessoa entendeu a projeção, o valor livre e a ação que está prestes a autorizar.

## 6. O que mudou desde a versão 1

| Mudança | Motivo |
|---|---|
| Renda de €1.200 para €1.350; plano principal de €200 para €350 | Na versão 1 o percurso terminava em €1.400 de €3.000. Agora termina em €2.750, e a meta é atingível com €386. |
| Decisão central passa a ser €350 contra €386 | O ajuste coloca atingir a meta contra preservar o mínimo livre, que é o problema descrito no brief. |
| Fatura em euros, sem conversão de reais | O câmbio acrescentava uma premissa frágil e não ajudava a decisão. |
| Os €300 contam para a meta desde o início | Usar ou não os €300 era uma segunda decisão dentro do simulador. |
| Dados vindos das movimentações do banco, com média de três meses | A versão 1 misturava despesas “informadas” com leitura da fatura e usava um único mês. |
| Estimativas arredondadas; “depósito” como termo único | A versão 1 alternava “cerca de €295” e “€94,89”, e “depósito”, “transferência” e “aporte”. |
| Revisão com saldo insuficiente, alterar ou pausar e rechecagem em janeiro | A pessoa aprova em novembro um plano que começa em fevereiro, com base em uma previsão. |
| “Remédio” e “Starlink” viram “Saúde” e “segundo serviço de internet” | Evita dado de saúde específico e nome de marca. |
| Cada tela tem o visual e a passagem conversa-controle definidos | O desafio pede visuais simples e contexto preservado entre conversa e controles. |

## 7. Decisões em aberto

- **Idioma das telas.** O enunciado é em inglês e este documento está em português do Brasil. Definir antes de ir para o Figma.
- **Regra de saldo insuficiente.** O comportamento descrito na revisão é uma hipótese de design.
- **Começar antes de fevereiro.** O cenário não oferece depósitos menores de novembro a janeiro. Se a banca perguntar, a resposta é que a sobra atual equivale ao mínimo livre da pessoa.
- **Brief e mapa de jornada.** O exemplo do brief (dez depósitos de €300, “faltam €500”) e a dúvida da etapa 3 no mapa (“E se eu guardar um pouco menos?”) precisam ser atualizados para este cenário.
