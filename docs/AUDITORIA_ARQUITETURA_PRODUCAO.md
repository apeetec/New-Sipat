# Auditoria de Arquitetura e Preparacao para Producao

**Projeto:** Portal SIPAT Honda 2026  
**Data da auditoria:** 2026-11-01  
**Escopo:** frontend React atual, regras de negocio, seguranca, build, deploy Hostinger e arquitetura da futura API Node.js/MySQL.

> **Atualizacao de implementacao (2026-11-01):** os riscos e o estado descritos abaixo registram a fotografia anterior à API. A API foi implementada em `backend/`, o frontend agora seleciona os repositórios HTTP por `VITE_API_URL`, e as instruções operacionais atuais estão em `backend/README.md`.

## 1. Conclusao executiva

O repositorio e um frontend React funcional e bem segmentado por funcionalidades, com testes unitarios para regras centrais e uma camada de repositorios que facilita a migracao. O build estatico esta apto para publicacao de **homologacao/demonstracao** na Hostinger.

Ele ainda nao esta apto a operar dados reais em producao. O servico chamado `BackendService` roda no navegador e persiste usuarios, senhas, respostas, logs e sorteios em `localStorage`. Os guards de administrador tambem sao executados apenas no cliente. O cliente HTTP da futura API existe, mas nao esta conectado ao fluxo da aplicacao.

Arquitetura recomendada: frontend estatico React + API REST Node.js em monolito modular + MySQL/MariaDB. Na Hostinger, o frontend pode ficar em hospedagem Web/Cloud; a API Node.js precisa de VPS segundo a documentacao oficial atual da Hostinger.

### Estado por objetivo

| Objetivo | Estado | Observacao |
|---|---|---|
| Build estatico otimizado | Pronto | TypeScript, Vite, minificacao, assets com hash e rotas lazy |
| Roteamento SPA no Apache | Pronto | `public/.htaccess`, copiado para `dist/.htaccess` |
| Deploy de homologacao | Pronto | Publicar o conteudo de `dist/` |
| Dados reais e login seguro | Bloqueado | Depende da API Node.js ainda nao implementada |
| Modelo SQL | Pronto para revisao/importacao | `database/schema.sql` |
| Deploy operacional completo | Parcial | Requer VPS, API, secrets, migracao e observabilidade |

## 2. Premissas arquiteturais

Volume, concorrencia, equipe e requisitos formais de retencao nao foram informados. A decisao parte das evidencias do repositorio: uma campanha corporativa, CRUD administrativo, cinco dias de evento, importacao em lote e relatorios. Isso caracteriza um sistema transacional de pequeno/medio porte, sem evidencia de necessidade de microservicos.

- Arquitetura: monolito modular Node.js, separando modulos de autenticacao, campanhas, eventos, questionarios, participacoes, sorteios e auditoria.
- API: REST/JSON sincrona; filas somente para e-mail e importacoes grandes quando houver demanda comprovada.
- Banco: MySQL 8/MariaDB 10.5, InnoDB, `utf8mb4`, horario persistido em UTC.
- Identificadores: UUID v4 textual `CHAR(36)`, gerado na API com `crypto.randomUUID()`.
- ORM: Prisma, TypeORM ou Drizzle podem mapear o schema; ORM direto e transacoes de servico sao suficientes.
- Escala inicial assumida: ate dezenas de milhares de colaboradores e baixa taxa de escrita simultanea.

## 3. Estrutura e stack encontradas

```text
.
|-- public/                     # assets publicos e .htaccess
|-- src/
|   |-- app/router/             # mapa de rotas React Router
|   |-- app/providers/          # autenticacao, tema e toasts
|   |-- components/             # UI, layout e feedback
|   |-- features/               # casos de uso por dominio
|   |   |-- auth/
|   |   |-- events/
|   |   |-- quizzes/
|   |   |-- regulations/
|   |   |-- winners/
|   |   `-- admin/
|   |-- services/api/           # backend local e cliente HTTP futuro
|   |-- services/repositories/  # contratos e adaptador localStorage
|   |-- services/exports/       # CSV e XLSX
|   |-- seed/                   # dados demonstrativos
|   |-- types/                  # modelo TypeScript
|   `-- utils/                  # seguranca, CSV, tema e formatacao
|-- tests/unit/                 # Vitest
|-- database/                   # DDL MySQL/MariaDB
|-- docs/                       # documentacao e migracao
|-- vite.config.ts
|-- package.json
`-- .env.example
```

### Tecnologias

| Camada | Tecnologia | Uso observado |
|---|---|---|
| UI | React 19 + TypeScript | SPA e componentes funcionais |
| Rotas | React Router 7 | rotas publicas, protegidas e administrativas |
| Build | Vite 8 | dev server, minificacao e assets versionados |
| Estilo | Tailwind CSS 4 | tema e componentes utilitarios |
| Validacao CSV | PapaParse | importacao e exportacao com `;` |
| Excel | `write-excel-file` | exportacao administrativa sem parser de arquivos externos |
| Testes | Vitest 5 | 10 testes unitarios |
| Persistencia atual | `localStorage` | somente demonstracao/homologacao |
| Persistencia alvo | MySQL/MariaDB | schema entregue nesta auditoria |

Dependencias sem uso foram removidas do frontend: Firebase, Express, dotenv, Google GenAI e Motion. Os arquivos Firebase sem consumidores tambem foram removidos. Os artefatos de regras Firebase na raiz foram preservados apenas como historico de uma alternativa arquitetural anterior.

## 4. Fluxo de dados

### Fluxo atual

```mermaid
flowchart LR
  UI[React Pages] --> BS[BackendService no navegador]
  BS --> R[Repository interfaces]
  R --> LS[Local adapter]
  LS --> STORE[(localStorage do navegador)]
  UI -. nao conectado .-> HC[Node backend client]
```

Consequencias: os dados nao sao compartilhados entre dispositivos, o usuario controla o armazenamento e as regras de autorizacao podem ser contornadas. O nome `BackendService` nao significa que exista processamento server-side.

### Fluxo de producao recomendado

```mermaid
flowchart LR
  B[Browser React] -->|HTTPS /api + access token| RP[OpenLiteSpeed/Nginx]
  RP --> API[Node.js modular API]
  API --> DB[(MySQL/MariaDB)]
  API --> OBJ[Object storage para videos/imagens]
  API --> MAIL[SMTP/API transacional]
```

O frontend nunca deve receber hashes de senha, gabaritos antes da submissao, hash do codigo de presenca, credenciais do banco ou segredo JWT.

## 5. Entidades e casos de uso mapeados

### Entidades atuais

- Usuario/colaborador: matricula, e-mail, unidade, papel, primeiro acesso, status ativo.
- Unidade: nome, slug, ordem e status.
- Campanha/configuracoes: identidade visual, links, limites e versao de regulamento.
- Regulamento: versao, HTML, PDF, vigencia e publicacao.
- Dia/sessao: janela de abertura, video, palestrantes, codigo presencial e unidade.
- Pergunta e alternativa: escolha unica, texto livre ou avaliacao; obrigatoria e/ou pontuada.
- Participacao e resposta: modalidade, progresso, submissao, nota e elegibilidade.
- Sorteio, pool elegivel e vencedor: escopo diario/semanal, unidades e anulacao.
- Log de acesso e log de auditoria.
- Importacao de usuarios e erros de linha (implicitos no fluxo administrativo).

O modelo relacional detalhado esta em `docs/DATABASE_MODEL.md`.

### Casos de uso do colaborador

1. Login por matricula e senha.
2. Troca obrigatoria de senha no primeiro acesso.
3. Leitura e aceite da versao vigente do regulamento.
4. Consulta das sessoes liberadas por data/hora.
5. Validacao de presenca por codigo ou progresso de video.
6. Resposta e submissao unica do questionario.
7. Consulta do resultado e, se permitido, revisao das respostas.
8. Consulta de sorteios e vencedores com matricula mascarada.

### Casos de uso administrativos

- Dashboard de usuarios, participacoes e notas perfeitas.
- CRUD/arquivamento de dias, videos, palestrantes e codigos.
- CRUD de perguntas e alternativas.
- CRUD de unidades e usuarios, reset de senha e soft delete em massa.
- Importacao por CSV/TSV com relatorio de divergencias.
- Consulta e exportacao de resultados em CSV/XLSX.
- Previa, execucao e anulacao auditada de sorteios.
- Consulta de logs, configuracao de campanha e white-label.
- Preparacao de relatorio por e-mail; hoje abre `mailto:` e nao envia pelo servidor.

## 6. Regras e validacoes reconstruidas

- Matricula e e-mail sao identificadores unicos no escopo da organizacao.
- Usuario inativo nao pode autenticar nem submeter respostas.
- Administrador e colaborador sao os papeis existentes.
- Primeiro acesso exige senha com no minimo oito caracteres, letra e numero.
- O regulamento precisa estar publicado; o aceite deve ser versionado e imutavel.
- Abertura deve ser anterior ao encerramento da sessao.
- O codigo presencial deve ser comparado por hash e limitado a cinco tentativas por minuto.
- A modalidade remota libera o questionario apos o limiar de video, atualmente 99%.
- Perguntas obrigatorias precisam de resposta.
- Perguntas pontuadas devem ser de escolha unica e ter exatamente uma opcao correta.
- Perguntas de pesquisa nao entram no denominador da nota.
- Uma participacao enviada e imutavel; deve existir no maximo uma por usuario/dia.
- Nota perfeita significa acerto de todas as perguntas pontuadas ativas.
- Sorteio diario exige nota perfeita no dia.
- Sorteio semanal exige participacao perfeita em todos os dias ativos marcados `countsForFullWeek`.
- Vencedores anteriores podem ser excluidos do pool.
- Sorteio publicado nao e apagado: e anulado com autor, data e justificativa.
- O ultimo administrador ativo nao deve ser desativado.
- Dados publicos de vencedores devem mascarar a matricula.

A implementacao local da elegibilidade semanal aceitava qualquer quantidade positiva de participacoes perfeitas. Ela foi corrigida para exigir todos os dias ativos configurados.

## 7. Achados priorizados

| Severidade | Achado/evidencia | Impacto | Acao exigida |
|---|---|---|---|
| Critica | Senhas, sessao, papeis e dados em `localStorage` | tomada de conta, alteracao de papeis e fraude | implementar API e hashes Argon2id/bcrypt |
| Critica | Credenciais e codigos de desenvolvimento aceitos no cliente | acesso indevido previsivel | remover todos os bypasses no build operacional |
| Critica | Hashes dos codigos e gabaritos existem no bundle/seed | engenharia reversa e fraude | manter apenas no banco/API |
| Critica | Guards de admin sao somente React | qualquer autorizacao real pode ser burlada | RBAC obrigatorio na API em toda rota admin |
| Alta | Progresso de video confia em segundos enviados pelo cliente | desbloqueio artificial | eventos assinados/idempotentes e validacao de saltos |
| Alta | Janela `opensAt/closesAt` nao e aplicada em toda mutacao local | envio fora do periodo | validar na transacao server-side |
| Alta | HTML de regulamento usa `dangerouslySetInnerHTML` | XSS persistente se admin inserir HTML hostil | sanitizar no backend com allowlist |
| Resolvida | O pacote vulneravel `xlsx` foi removido | nenhuma superficie de parsing do SheetJS permanece | exportacao migrada para `write-excel-file` com neutralizacao de formulas |
| Alta | Cliente HTTP Node existe, mas nenhum provider o seleciona | falsa impressao de integracao | criar adapter HTTP e selecao explicita por ambiente |
| Media | Rate limit e memoria local reiniciam com processo/aba | brute force distribuido | Redis ou tabela/janela no servidor/proxy |
| Media | Midias podem virar Data URL no `localStorage` | quota, lentidao e indisponibilidade | object storage e URLs assinadas |
| Media | E-mail e apenas simulacao/`mailto:` | relatorio nao e entregue/auditado | fila + provedor SMTP/API |
| Media | Nao ha teste E2E nem teste de integracao SQL/API | regressao de fluxos completos | Playwright + banco efemero em CI |
| Baixa | Nao ha ESLint configurado | inconsistencias e bugs estaticos | adicionar ESLint depois da API |

O pacote `xlsx` foi removido e substituido por `write-excel-file`. O exportador tambem neutraliza strings iniciadas por caracteres de formula (`=`, `+`, `-`, `@`). A verificacao atual com `npm audit --omit=dev` termina sem vulnerabilidades conhecidas.

## 8. Decisoes arquiteturais

### ADR-001: monolito modular em vez de microservicos

**Decisao:** uma API Node.js com modulos internos e um unico banco.

**Motivo:** o dominio e transacional, o time/escala nao justificam operacao distribuida, e sorteios/submissoes precisam de transacoes fortes.

**Trade-off:** modulos escalam juntos. Reavaliar somente se houver times independentes, cargas muito diferentes ou mais de 100 mil usuarios ativos simultaneos.

### ADR-002: MySQL/MariaDB normalizado

**Decisao:** schema 3FN com tabelas de associacao, constraints e snapshots somente onde o historico exige.

**Trade-off:** consultas de relatorio usam mais joins; indices e consultas de leitura resolvem antes de considerar desnormalizacao.

### ADR-003: UUID como ID externo e primario

**Decisao:** `CHAR(36)` para compatibilidade imediata com IDs string do frontend e ORMs.

**Trade-off:** indices maiores que `BIGINT`. Se a base crescer para centenas de milhoes de linhas, migrar internamente para `BINARY(16)` ou chave numerica.

### ADR-004: frontend e API no mesmo dominio logico

**Decisao:** preferir `https://portal.exemplo.com` e API em `/api` via proxy reverso.

**Beneficio:** CORS e cookies ficam mais simples. Se usar subdominio, configurar allowlist exata e nunca `*` com credenciais.

## 9. Build de producao

Requisitos locais: Node.js LTS compativel com Vite 8 e npm.

```powershell
npm.cmd ci
npm.cmd run verify
```

O comando `verify` executa typecheck, testes e build. O artefato publicavel fica em `dist/`.

O build foi configurado com:

- alvo ES2022;
- minificacao e hashes de conteudo do Vite;
- source maps desabilitados;
- CSS separado;
- carregamento lazy das paginas;
- `.htaccess` incluido automaticamente.

O arquivo `package-lock.json` deve ser versionado para builds reproduziveis.

## 10. Variaveis de ambiente

O frontend usa somente variaveis `VITE_*`; todas ficam publicas no bundle.

| Variavel | Obrigatoria agora | Finalidade |
|---|---:|---|
| `VITE_API_URL` | Nao | URL base da futura API Node; preferir vazio com proxy `/api` |

O backend futuro deve ter um `.env` separado, nunca publicado, com pelo menos:

```dotenv
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_ACCESS_SECRET=<minimo-32-bytes-aleatorios>
JWT_REFRESH_SECRET=<outro-segredo-independente>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=https://portal.exemplo.com
TRUST_PROXY=1
PASSWORD_PEPPER=<segredo-opcional-independente>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## 11. Deploy Hostinger

### Opcao A: homologacao estatica em hospedagem Web/Cloud

1. Execute `npm.cmd ci` e `npm.cmd run verify` localmente/CI.
2. Confirme que `dist/index.html`, `dist/assets/` e `dist/.htaccess` existem.
3. Compacte **o conteudo** de `dist/`, nao a pasta pai.
4. No hPanel, abra `Websites -> Dashboard -> Files -> File Manager`.
5. Entre no `public_html` do dominio.
6. Faca backup do conteudo atual antes de substitui-lo.
7. Envie o ZIP, extraia diretamente em `public_html` e remova `default.php` se existir.
8. Ative/valide SSL e force HTTPS pelo hPanel.
9. Teste `/`, `/login`, `/admin`, `/dias/segunda-feira` e refresh direto dessas URLs.
10. Verifique cache: `index.html` sem cache e assets com cache longo.

Esta opcao armazena dados apenas no navegador e deve ser rotulada como homologacao.

### Opcao B: producao operacional com API Node.js

1. Contrate/provisione VPS Hostinger; hospedagem Web, WordPress e Cloud nao fornecem root para Node.js segundo o guia oficial.
2. Instale Node.js LTS, um gerenciador de processo (systemd ou PM2) e OpenLiteSpeed/Nginx.
3. Crie o banco e usuario; permita conexao somente a partir da API.
4. Importe `database/schema.sql` no banco selecionado.
5. Implante a API fora da raiz publica e configure secrets com permissao restrita.
6. Execute migracoes com usuario proprio; a API deve usar usuario sem permissao de alterar schema.
7. Sirva o frontend estatico e encaminhe `/api` para `127.0.0.1:3001`.
8. Configure health check, reinicio automatico, logs com rotacao e backup do banco.
9. Habilite TLS, HSTS apos validacao, rate limiting no proxy e limites de corpo/upload.
10. Rode smoke tests e so entao remova credenciais/botoes demonstrativos do frontend.

### Banco no hPanel/phpMyAdmin

1. No hPanel, crie banco, usuario e senha em `Databases -> Management`.
2. O nome recebe prefixo da conta Hostinger; use esse nome real em `DATABASE_URL`.
3. Abra o banco criado no phpMyAdmin e selecione `Import`.
4. Importe `database/schema.sql`. Ele nao contem `CREATE DATABASE`, `DROP`, `DEFINER`, procedure ou trigger.
5. Para local/VPS com privilegio, rode `database/create-database.sql` pelo cliente MySQL a partir da pasta `database/`.

## 12. Checklist de liberacao

- [ ] API Node implementada e conectada; nenhum dado real usa `localStorage`.
- [ ] Hash de senha Argon2id ou bcrypt com custo revisado.
- [ ] Access token curto e refresh token rotacionado/revogavel.
- [ ] RBAC validado no servidor e testes negativos de IDOR.
- [ ] Bypasses, contas e codigos demonstrativos removidos.
- [ ] Gabarito e hashes de presenca ausentes do bundle.
- [ ] Sanitizacao do HTML do regulamento.
- [ ] Submissao e sorteio executados em transacao com idempotencia.
- [x] Biblioteca `xlsx` substituida e exportacao protegida contra formula injection.
- [ ] Politica LGPD de retencao, acesso, exportacao e anonimizacao aprovada.
- [ ] Backup com restauracao testada.
- [ ] Logs sem senha/token/PII desnecessaria e com rotacao.
- [ ] Testes E2E dos fluxos de colaborador e administrador.
- [ ] `npm.cmd run verify` verde no mesmo commit do deploy.

## 13. Referencias oficiais Hostinger

- Node.js e suportado via VPS, nao nos planos Web/WordPress/Cloud: https://support.hostinger.com/en/articles/1583661-is-node-js-supported-at-hostinger
- Upload de arquivos no `public_html`: https://support.hostinger.com/en/articles/4548688-basic-actions-in-the-file-manager
- Criacao do banco MySQL no hPanel: https://support.hostinger.com/en/articles/1583542-how-to-create-a-new-mysql-database
- Requisitos para importar SQL no phpMyAdmin: https://support.hostinger.com/en/articles/1864324-how-to-upload-and-set-up-your-database-at-hostinger
