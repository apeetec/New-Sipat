# Guia de Migração Conceitual — Legado WordPress para Portal SIPAT Honda

Este documento descreve a transição arquitetural do legado em WordPress para a arquitetura corporativa moderna baseada em TypeScript, React, Cloud Functions e Firebase/Firestore.

---

## 1. Mapa de Entidades e Estruturas de Dados

| Entidade no Sistema Legado (WordPress) | Nova Estrutura Moderna (Portal SIPAT Honda) | Justificativa & Correções de Segurança |
|---|---|---|
| `wp_users` + `wp_usermeta` | Firebase Authentication + Firestore `users/{userId}` | Elimina armazenamento inseguro de credenciais em PHP/MySQL; matrícula única e custom claims para controle de papéis (`admin`/`collaborator`). |
| Taxonomia `unidades` | Coleção Firestore `units/{unitId}` | Normalização de acentos, slugs únicos e prevenção de duplicidades textuais como `PROD-SUM` vs `PROD_SUM`. |
| Taxonomia `datas_perguntas` | Coleção Firestore `eventDays/{dayId}` | Timestamps reais compatíveis com fuso horário `America/Sao_Paulo`, com horário estrito de abertura/fechamento e código de presença com hash. |
| Custom Post Type `perguntas` + `grupo_de_respostas` | Coleção Firestore `questions/{questionId}` | Gabarito protegido exclusivamente no backend; perguntas separadas em avaliativas (`scored=true`) e de pesquisa de opinião. |
| User Meta dinâmico de respostas e notas (`respostas_dia_X`, `pontuacao_dia_X`) | Coleção Firestore `participations/{userId_dayId}` | Chave composta determinística (`userId_dayId`) garantindo uma única submissão por dia; imutabilidade após envio; auditoria de correções. |
| Custom Post Type `sorteios_sipat` | Coleção Firestore `draws/{drawId}` | Sorteios efetuados por algoritmo criptográfico no servidor (`crypto.getRandomValues`); snapshot de elegíveis gravado; status `voided` com justificativa em vez de deleção física. |
| Meta flags em string (`"Sim"`, `"Não"`, `"on"`, `"off"`, `"1"`, `"0"`) | Tipos primitivos estritos (`boolean`, `Timestamp`, ISO 8601 strings) | Eliminação de erros de parsing no cálculo da elegibilidade e conferência de regulamento. |

---

## 2. Estratégia do Script de Migração em Lote

Para bases legadas com dezenas de milhares de colaboradores:

1. **Extração Sanitizada do WordPress:**
   Executar script WP-CLI ou exportação SQL que gera arquivo JSON ou CSV limpo contendo apenas:
   - `employeeNumber` (login único do usuário)
   - `email`
   - `firstName`, `lastName`
   - `unitSlug`
   - Data de nascimento formatada para a senha temporária inicial (`DDMMAAAA`)

2. **Processamento Idempotente via Cloud Functions:**
   - O endpoint `processUserImportBatch` lê pacotes de 50 registros por vez.
   - Aplica a resolução: se o colaborador já existir por matrícula ou e-mail, realiza merge mantendo o histórico de participações anteriores.
   - Força `mustChangePassword = true` para garantir que senhas legadas em texto ou MD5 antigo não sejam reutilizadas.

3. **Auditoria Pós-Migração:**
   - Gera relatório com totais de contas importadas, contas atualizadas e divergências de cadastro (ex.: e-mails duplicados em CPFs diferentes).
