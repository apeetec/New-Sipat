# Teste local integrado e publicação

Este guia usa o frontend React, a API Node.js e o MariaDB do XAMPP. O modo abaixo não usa dados simulados do navegador.

## 1. Preparar uma vez

Requisitos: Node.js 20.19 ou superior e MySQL iniciado no painel do XAMPP.

```powershell
npm install
npm --prefix backend install
npm run setup:local
```

O último comando usa o banco da aplicação `sipat_portal`, importa `database/schema.sql` sem apagar dados existentes e executa o bootstrap idempotente. O banco `sipat_it_*` é reservado exclusivamente aos testes integrados.

Credenciais locais da API:

- matrícula: `admin.local`
- senha temporária: `AdminLocal2026`

O administrador será direcionado para a troca obrigatória de senha no primeiro acesso. Depois da troca, use a nova senha; o bootstrap não sobrescreve uma conta existente.

## 2. Iniciar frontend e backend

```powershell
npm run dev:full
```

- frontend: `http://localhost:3000/login`
- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`
- saúde do banco: `http://localhost:3001/api/health/ready`

O arquivo local `.env.local` contém `VITE_API_URL=http://localhost:3001`. Ele é ignorado pelo Git e garante que o React use a API em vez do adaptador de demonstração.

## 3. Roteiro de homologação

1. Entre com o administrador e conclua o primeiro acesso.
2. Em Administração, crie uma unidade e um colaborador com senha temporária.
3. Saia e valide o primeiro acesso do colaborador.
4. Crie um evento; envie uma capa PNG/JPEG/WebP e um vídeo MP4/WebM/OGG/MOV.
5. Crie perguntas, registre presença ou progresso de vídeo e envie o questionário.
6. Confira resultados, auditoria e exportação XLSX/CSV.
7. No envio por e-mail local, a API cria uma mensagem `.eml` em `backend/storage/outbox`. Produção usa SMTP.
8. Execute `npm run verify:all`, `npm audit` e `npm --prefix backend audit`.

Arquivos enviados localmente ficam em `backend/storage/uploads`. `backend/storage` é ignorado pelo Git.

## 4. Preparar produção

1. Use Hostinger VPS ou um plano que mantenha processo Node.js ativo. Hospedagem estática/compartilhada sem runtime Node publica apenas o React.
2. Crie banco e usuário exclusivos no hPanel, dê somente os privilégios necessários e importe `database/schema.sql` no phpMyAdmin.
3. Crie `backend/.env` no servidor a partir de `backend/.env.example`. Defina `NODE_ENV=production`, segredos novos, `TRUST_PROXY=1` e `CORS_ORIGINS=https://seu-dominio`. Use `EMAIL_MODE=smtp` para entrega real; `outbox` apenas gera uma mensagem local.
4. Mantenha `backend/storage` persistente e gravável pelo usuário do processo. Não o coloque dentro do diretório público.
5. No servidor, execute em `backend`: `npm ci`, `npm run build`, `npm run db:bootstrap` somente no primeiro provisionamento e `pm2 start ecosystem.config.cjs`.
6. Gere o React com `VITE_API_URL=https://seu-dominio npm run build` e publique somente o conteúdo de `dist/` no diretório web.
7. Configure o proxy `/api` usando `backend/deploy/nginx-sipat.conf`. O exemplo contempla SPA, uploads de vídeo e timeouts maiores.
8. Valide HTTPS, `/api/health/ready`, login, upload, e-mail SMTP, questionário, sorteio e backup/restauração.

Nunca publique `.env`, credenciais locais, `node_modules`, logs ou senhas. Antes do deploy definitivo, crie o administrador de produção com outra senha e remova as variáveis `BOOTSTRAP_*` do ambiente.

## 5. Atualizações futuras

Faça backup, atualize o código, rode `npm ci` e as verificações, gere novamente o `dist/`, publique seus arquivos e execute `pm2 reload sipat-api`. Preserve o banco e `backend/storage`; alterações de schema devem usar migrações incrementais.
