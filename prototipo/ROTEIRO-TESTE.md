# Roteiro de teste · Juntar €3.000 para a viagem

Protótipo: [Summer Holiday Plan](https://claude.ai/artifact/37X8xDZ4rueY7sENGopCYw) (privado; compartilhe pelo menu Share antes da sessão).

## Objetivo

Verificar se a pessoa entende o que a IA calculou, consegue escolher entre **atingir a meta** e **preservar o mínimo livre**, e sabe o que acontece quando confirma.

A pergunta que decide se o protótipo funcionou vem antes da confirmação:

> **“Quanto você terá para a viagem em agosto, quanto fica livre por mês e o que acontece hoje se você confirmar?”**

Respostas esperadas no percurso principal (€350): **€2.750 até agosto**, **cerca de €95 livres por mês** e **nenhum valor sai hoje; o primeiro depósito é em 5 de fevereiro**.

## Preparação

- Sessão de 20 a 25 minutos, moderada, com pensamento em voz alta.
- **No computador:** abra o link em tela cheia. O painel à esquerda mostra a etapa atual e permite pular entre etapas. As perguntas de cada etapa estão na tabela de tarefas abaixo.
- **No celular:** o protótipo ocupa a tela inteira e o painel some. Tenha este roteiro à mão para acompanhar as tarefas.
- Atalhos no computador: `←` `→` mudam de etapa, `1`–`0` pulam para uma etapa, `R` reinicia.
- Para testar com Reduce Motion, marque o toggle no painel ou ative a opção no iPhone (Ajustes › Acessibilidade › Movimento).
- Reinicie (`R`) antes de cada participante.

## Abertura (2 min)

“Vou mostrar um protótipo de um app de banco. Ele é uma simulação: alguns botões não funcionam e nada aqui é real. Não estamos testando você, e sim o app. Pense em voz alta enquanto usa.”

**Cenário:** “Você quer juntar €3.000 para viajar no próximo verão e já tem €300 guardados. Não sabe quanto consegue guardar por mês.”

## Tarefas

| # | Etapa | O que pedir ou perguntar | O que observar |
|---|---|---|---|
| 1 | Home | “Mostre como você começaria.” | Encontra o botão da IA sem ajuda? |
| 2 | Abertura do chat | (só observar) | Encontra o campo de texto? Toca em enviar depois que a mensagem é digitada? |
| 3 | Resumo da meta | “Isso está certo para você?” | Lê o resumo? Corrige algo? Ao responder “Anything already put aside?”, a sheet passa sozinha para o passo 2; a pessoa se orienta? |
| 4 | Permissão de dados | “O que a IA vai olhar se você permitir? O que ela não vai fazer?” | Entende o escopo (conta, cartão, 3 meses) e que pode mudar depois. |
| 5 | Sobra mensal | “Quanto sobra por mês hoje, e quando isso muda?” | Cita cerca de €90 hoje e €445 a partir de fevereiro. Usa o slider? |
| 6 | **Plano interativo (decisão)** | “Pense em voz alta: €350 ou €386?” | Percebe a troca entre meta e folga? Nota o aviso abaixo de €90? Usa atalhos, slider ou stepper? |
| 7 | **Revisão** | **Pausar antes de confirmar** e fazer a pergunta principal (acima). | Acerta os três valores sem procurar muito? |
| 8 | Plano agendado | “O que acontece agora, e quando o dinheiro sai da sua conta pela primeira vez?” | 5 de fevereiro; checagem em janeiro. |
| 9 | Detalhe do pot | “Se o seu mês apertar em março, o que você faria aqui?” | Encontra “Pause plan” ou “Change day”. |
| 10 | Home com o pot | “Onde está o dinheiro da viagem agora?” | Aponta a aba Pots e o pot “Summer holiday”. |

## Critérios de sucesso

- **Entendimento da projeção:** responde “€2.750 até agosto” (ou o total do valor que escolheu) na etapa 7.
- **Entendimento do livre no mês:** responde “cerca de €95” (ou o livre do valor escolhido).
- **Entendimento da ação:** diz que nada sai hoje e que o primeiro depósito é em fevereiro.
- **Decisão consciente:** explica por que escolheu €350 ou €386 com base na meta ou na folga.
- **Controle:** sabe onde pausar ou mudar o plano depois.

## Perguntas finais (5 min)

1. Em algum momento você não soube o que a IA estava fazendo? Onde?
2. Você confiou nos números? O que aumentaria ou diminuiria essa confiança?
3. O que você mudaria no valor ou no plano, se fosse de verdade?
4. De 1 a 5, quão claro ficou o que você estava autorizando ao confirmar?

## Limites do protótipo (avisar se perguntarem)

- Os atalhos do chat (“Plan a goal” e os outros) são só exemplos e não respondem ao toque. Tocar no campo de texto abre o teclado e digita a mensagem da meta sozinho; a pessoa só precisa tocar em enviar (não há digitação livre).
- Os valores vêm de uma persona fictícia, com média de setembro a novembro de 2026.
- “Show me ways” abre o chat, mas sem uma conversa nova; “Change day” e “Other amount” não levam a novas telas.
- O Face ID é simulado.
