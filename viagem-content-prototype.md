# Juntar €3.000 para uma viagem no próximo verão

Perfil financeiro do participante, mapa de cenários conversacionais e protótipo de conteúdo para uma experiência bancária mobile com IA.

## 1. Perfil financeiro do participante

**Situação.** A pessoa recebe €1.200 por mês, tem €300 guardados e quer juntar €3.000 para viajar. Quer descobrir quanto cabe no orçamento e comparar o que acontece se usar os €300 na viagem ou se os mantiver separados. Este perfil se baseia nos valores informados para o case. As falas do protótipo são ilustrativas.

**Questão que orienta o design.** “Quanto consigo guardar para a viagem e quanto vai sobrar no meu mês se eu fizer isso?”

| Orçamento de novembro de 2026 | Valor |
|---|---:|
| Renda mensal informada | €1.200,00 |
| Remédio | €220,00 |
| Internet | €24,00 |
| Alimentação | €300,00 |
| Combustível | €150,00 |
| Fatura do cartão, convertida de R$ 3.547,95 | €566,81 |
| **Total de despesas informadas** | **€1.260,81** |
| **Saldo após essas despesas** | **−€60,81** |

Os €300 guardados são um saldo existente, contado uma única vez na projeção que os destina à viagem. A fatura foi convertida pela taxa de referência de 13 de novembro de 2026, de €1 para R$ 6,2595. [Cotação do Banco Central Europeu](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-brl.pt.html)

### Premissas da simulação

- **Horizonte escolhido para o case.** Viagem no fim de agosto de 2027. O percurso ilustrado prevê sete depósitos mensais, de fevereiro a agosto, e pressupõe que os €300 continuam guardados em fevereiro.
- **Mudança prevista nos gastos.** Há parcelas com término previsto em novembro, dezembro e janeiro. Retirando essas parcelas e mantendo as demais cobranças e o câmbio, a fatura mensal projetada a partir de fevereiro seria de aproximadamente €211,11. A margem estimada seria de **€294,89** por mês (€1.200 − €694 − €211,11).
- **Dados que a pessoa pode corrigir.** Outros gastos, cobranças que deixaram de existir e mudanças na renda alteram a projeção. A interface oferece **Ver cálculo** e **Editar despesas** antes da aprovação.
- **Preferências a validar.** A margem desejada de €90, a disposição para rever um serviço e a escolha final de preservar os €300 são exemplos para o roteiro. O app precisa perguntar para descobrir essas preferências.

## 2. Framework de decisão

Usamos **mapeamento de cenários conversacionais** (*conversation mapping*) para definir as ramificações e **diálogos de exemplo** (*sample dialogues*) para explorar como a IA poderia responder. A pergunta que orienta cada caminho é **“O que a pessoa ainda precisa resolver para decidir?”**

| Caminho | Gatilho | Papel da IA | Decisão da pessoa |
|---|---|---|---|
| **Simples · Avaliar uma sugestão** | “Não sei quanto consigo guardar.” | Oferecer um valor inicial e explicar o efeito no orçamento. | Aceitar a sugestão, experimentar outro valor ou parar. |
| **Mediano · Preservar uma margem** | “Quero deixar pelo menos €90 livres.” | Incorporar a preferência e comparar os efeitos de dois depósitos. | Escolher quanto guardar e se vai usar o saldo existente. |
| **Completo · Reorganizar uma despesa** | “Ainda fica longe da meta. O que posso mudar?” | Investigar uma cobrança com a pessoa e quantificar uma possível mudança. | Decidir o que explorar e qual plano autorizar agora. |

Os caminhos compartilham a abertura e a revisão final. Quem se sente confortável com a primeira sugestão pode ir direto à aprovação. As demais ramificações surgem quando a pessoa expressa uma preferência ou pede ajuda para se aproximar da meta.

## 3. Content prototype

### Abertura comum

**Pessoa** — “Quero juntar €3.000 para viajar no próximo verão, mas não sei quanto consigo guardar por mês.”

**IA** — “Até quando você quer ter o dinheiro disponível?”

**Pessoa** — “Até o fim de agosto. Já tenho €300 guardados, mas queria ver as opções antes de decidir se vou usá-los.”

**IA** — “Em novembro, as despesas que você informou passam sua renda em cerca de €61. Duas parcelas maiores terminam em janeiro. Se os outros gastos continuarem parecidos, a partir de fevereiro sobrariam cerca de €295 por mês. Podemos usar essa estimativa para comparar os planos?”

**Interface** — **Simular a partir de fevereiro** · **Conferir despesas**

### Caminho simples · Avaliar uma sugestão

**Pessoa** — “Sim. Por onde eu começo?”

**IA** — “Podemos testar €200 por mês. Isso deixaria cerca de €95 livres depois das despesas informadas. Em sete depósitos, você juntaria €1.400. Veja como os €300 que já guardou mudariam o resultado.”

| Escolha no cartão | Para a viagem em agosto | Falta para €3.000 |
|---|---:|---:|
| Manter meus €300 separados | €1.400 | €1.600 |
| Destinar meus €300 à viagem | €1.700 | €1.300 |

**Pessoa** — “Essa margem funciona para mim. Prefiro manter os €300 separados.”

**Interface** — “€200 por mês · €1.400 previstos para a viagem.” **Revisar plano** · **Testar outro valor**

**Racional.** Resolve a dificuldade de começar quando a pessoa ainda não tem um valor em mente. O limite é que a sugestão de €200 vem antes de conhecer a margem que ela deseja. A oportunidade é observar se mostrar o que sobraria permite aceitar ou contestar a proposta com confiança.

### Caminho mediano · Preservar uma margem

**Pessoa** — “Antes de escolher, queria entender quanto consigo guardar sem apertar o mês.”

**IA** — “Mesmo usando os €300 guardados, você precisaria de cerca de €386 por mês para chegar aos €3.000 até agosto. A margem estimada é de €295. Quanto desse valor você gostaria de deixar livre?”

**Pessoa** — “Pelo menos €90.”

**IA** — “Sugiro testar €200 por mês. Restariam €94,89, um pouco acima dos €90 que você quer preservar.”

| Depósito mensal | Livre após despesas e depósito | Viagem sem os €300 | Viagem com os €300 |
|---|---:|---:|---:|
| €200 | €94,89 | €1.400 | €1.700 |
| €250 | €44,89 | €1.750 | €2.050 |

**Interação** — A pessoa muda o depósito de €200 para €250. O cartão atualiza a projeção e informa “Ficariam €44,89 livres, abaixo dos €90 que você escolheu”. A data da viagem permanece visível.

**Pessoa** — “Então vou manter os €200 e deixar o dinheiro que já tenho separado.”

**Interface** — **Revisar sete depósitos de €200** · **Como posso chegar mais perto da meta?**

**Racional.** A recomendação responde a uma preferência concreta. O limite é que algumas pessoas também têm dificuldade para dizer qual margem querem preservar. A oportunidade é oferecer **Quero comparar primeiro**, permitindo explorar dois valores antes de responder.

### Caminho completo · Reorganizar uma despesa

Este caminho continua do anterior. A margem desejada, o prazo e a escolha sobre os €300 seguem preenchidos.

**Pessoa** — “€1.400 ainda fica longe da meta. Dá para juntar mais sem usar os €300?”

**IA** — “Podemos rever os gastos. Você informou internet de €24 por mês, e na fatura aparece também uma cobrança da Starlink de cerca de €99. Você pretende manter os dois serviços?”

**Pessoa** — “São dois serviços. Eu já estava pensando em cancelar a Starlink. Quanto isso mudaria?”

**IA** — “Se a cobrança de €98,89 for mensal e terminar antes de fevereiro, você poderia acrescentar esse valor a cada depósito. Em sete meses, seriam mais €692,23 para a viagem, preservando a mesma margem mensal de aproximadamente €95.”

| Projeção | Gastos atuais | Se a cobrança terminar antes de fevereiro |
|---|---:|---:|
| Depósito mensal | €200,00 | €298,89 |
| Viagem em agosto, com os €300 separados | €1.400,00 | €2.092,23 |
| Viagem em agosto, incluindo os €300 | €1.700,00 | €2.392,23 |

**Pessoa** — “Ainda vou decidir sobre a internet. Quero começar com os €200 e deixar os €300 separados.”

**IA** — “Certo. O plano para revisão fica em sete depósitos de €200. Você pode ajustar o valor quando a cobrança terminar.”

**Interface** — **Revisar plano de €200** · **Continuar simulando**

**Racional.** Resolve a dúvida que aparece quando a pessoa percebe a distância até a meta. O limite é que uma fatura isolada não confirma a recorrência, os termos de cancelamento ou a importância do serviço. A oportunidade é permitir comparar a economia possível e manter no agendamento apenas o valor que a pessoa escolheu. Se ela disser que precisa dos dois serviços, o fluxo segue com as despesas atuais.

## 4. Revisão e confirmação comuns

**Tela de revisão · percurso escolhido**

| Campo visível | Conteúdo |
|---|---|
| Origem → destino | Conta à ordem → meta “Viagem” |
| Calendário ilustrativo | €200 no dia 5 de cada mês, de 5 de fevereiro a 5 de agosto de 2027 |
| Depósitos | 7 transferências · €1.400 no total |
| Saldo existente | €300 mantidos separados |
| Projeção | €1.400 de €3.000 até agosto · faltariam €1.600 |

**Ações** — **Agendar 7 transferências de €200** · **Voltar e editar**

**Confirmação** — “Plano agendado. A primeira transferência de €200 será em 5 de fevereiro de 2027. Os €300 que você já guardou continuam separados.”

**Variação se a pessoa incluir os €300.** A revisão mostra o aporte inicial de €300, sua origem, quando ele acontece, os sete depósitos futuros e a previsão de €1.700. A aprovação nomeia as duas ações: **Destinar €300 agora e agendar 7 depósitos de €200**.

## 5. Recorte recomendado para o Figma

Prototipar o **caminho mediano** como percurso principal em cinco telas: conversa e prazo, estimativa do orçamento, simulador, revisão e confirmação. Usar a comparação simples dos €300 como controle dentro do simulador. O caminho completo cabe em uma ramificação de conversa acionada por **Como posso chegar mais perto da meta?**

Para testar, pausar antes da aprovação e perguntar **“Quanto vai para a viagem até agosto, quanto fica livre por mês e o que acontece com os €300 se você confirmar?”**. As respostas mostram se a pessoa entendeu a projeção, sua margem e a ação que está prestes a autorizar.
