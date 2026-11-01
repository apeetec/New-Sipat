# Especificação de Segurança & Invariantes — Portal SIPAT Honda

## 1. Invariantes de Dados & Regras de Acesso

1. **Privacidade de Gabarito:** Colaboradores comuns nunca recebem alternativas com o campo `isCorrect` antes da submissão do questionário. A correção é realizada exclusivamente no backend.
2. **Imutabilidade de Participações:** Após submissão (`status: 'submitted'`), o colaborador não pode modificar suas respostas, modalidade ou nota. Apenas correções administrativas justificadas são permitidas e geram trilha de auditoria.
3. **Antifraude de Presença:** O código presencial nunca é enviado em texto puro ou trafegado em respostas GET. A validação compara hashes SHA-256 e conta com rate limiting estrito por usuário/dia.
4. **Antifraude de Vídeo:** O cliente não pode marcar arbitrariamente 99% de conclusão em um instante. O progresso é validado e atualizado de forma contínua com throttling.
5. **Elegibilidade para Sorteios:** Apenas colaboradores com status `submitted` e `perfectScore == true` (100% nas questões avaliativas da data ou de todas as datas ativas) entram no snapshot de elegíveis.
6. **Integridade de Sorteios:** Uma vez publicado, um sorteio não é excluído fisicamente; sua anulação exige motivo obrigatório, autor, timestamp e permanece gravada na trilha de auditoria.

## 2. Cenários Adversos Mitigados (The "Dirty Dozen")

| ID | Cenário Adverso | Mitigação Implementada |
|---|---|---|
| P01 | Tentativa de alterar `role: 'admin'` no próprio perfil | Regra no Firestore/backend bloqueia alteração do campo `role` por não-administradores |
| P02 | Tentativa de submissão dupla para aumentar nota | Regra rejeita escrita se `status == 'submitted'` |
| P03 | Injeção de código presencial via brute force | Rate limiting com limite de 5 tentativas por minuto por usuário |
| P04 | Acesso ao gabarito via inspect de requisição | Endpoint `getParticipantEvent` filtra `isCorrect` das alternativas |
| P05 | Acesso a dados de outros usuários por colaborador | Regra `users/{userId}` restringe leitura a `isOwner` ou `isAdmin` |
| P06 | Vencedor repetido em sorteios com exclusão | Backend filtra vencedores anteriores de sorteios `published` |
| P07 | Manipulação de resultado do sorteio pelo cliente | Sorteio executado com gerador criptográfico no servidor (`crypto.getRandomValues`) |
| P08 | Desativação acidental de todos os administradores | Regra impede desativação do último admin ou da conta em sessão |
| P09 | Envio de questionário antes de assistir vídeo | Validação no backend rejeita envio se `videoProgressPercent < 99` e sem código |
| P10 | Consulta a respostas de pesquisas confidenciais | Matriz de respostas restrita exclusivamente à rota administrativa com role admin |
| P11 | Conflito de matrícula e e-mail no importador | Validador acusa erro se matrícula e e-mail apontarem para pessoas diferentes |
| P12 | Exposição de senhas em logs ou relatórios | Senhas são sanitizadas de qualquer payload de auditoria, CSV de retorno ou log |
