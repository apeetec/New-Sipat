# Guia legado de Implementacao: Backend Node.js + SQL (Hostinger)

> **Aviso:** este documento foi preservado como referencia historica. O schema oficial e importavel esta em `database/schema.sql`, o modelo em `docs/DATABASE_MODEL.md` e a auditoria/deploy em `docs/AUDITORIA_ARQUITETURA_PRODUCAO.md`. Nao copie o DDL antigo abaixo para producao.
### Portal SIPAT & Campanhas Corporativas

> **Objetivo Deste Documento:**  
> Este guia contém todas as especificações técnicas, arquitetura de banco de dados SQL (MySQL/MariaDB da Hostinger), especificação completa de endpoints REST, regras de negócio e o prompt mestre para gerar o servidor Node.js utilizando **Claude, ChatGPT** ou desenvolvimento manual.

---

## 1. Visão Geral da Arquitetura

O sistema atual foi desenhado com o padrão **Dual-Repository & Backend Service**.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Shadcn UI.
- **Backend a ser criado:** Node.js (v18 ou v20 LTS) com Express ou Fastify + TypeScript.
- **Banco de Dados:** MySQL ou MariaDB (hospedado nativamente na Hostinger via hPanel / phpMyAdmin ou VPS).
- **Hospedagem Hostinger:** Pode ser executado via **Node.js Selector / Application Manager** da Hostinger ou em VPS Hostinger com **PM2 + NGINX/Apache Reverse Proxy**.

```
[ Navegador Web / Frontend ]
          │  HTTP / HTTPS (JSON)
          │  Header: Authorization: Bearer <jwt_token>
          ▼
[ Hostinger Apache/OpenLiteSpeed ] (Porta 80 / 443)
          │  Reverse Proxy (.htaccess ou Nginx)
          ▼
[ Servidor Node.js / Express ] (Porta 3001 ou Socket)
          │  Pool de Conexões (mysql2/promise)
          ▼
[ Banco de Dados MySQL / Hostinger ] (Porta 3306)
```

---

## 2. Script DDL do Banco de Dados SQL (`schema.sql`)

Execute este script diretamente no **phpMyAdmin** da Hostinger ou via terminal MySQL:

```sql
-- ========================================================
-- BANCO DE DADOS OFICIAL: PORTAL SIPAT & CAMPANHAS HONDA
-- Compatível com: MySQL 8.0+ / MariaDB 10.5+ na Hostinger
-- Charset: utf8mb4 (suporte a acentos e emojis em pt-BR)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `sipat_honda` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `sipat_honda`;

-- 1. Tabela de Unidades Fabris / Setores
CREATE TABLE IF NOT EXISTS `units` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_units_active` (`active`),
  INDEX `idx_units_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Usuários / Colaboradores
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `employee_number` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Matrícula funcional única',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt da senha',
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `role` ENUM('admin', 'collaborator') NOT NULL DEFAULT 'collaborator',
  `unit_id` VARCHAR(64) NULL,
  `unit_name_backup` VARCHAR(150) NULL,
  `company` VARCHAR(150) NULL DEFAULT 'Honda Automóveis do Brasil',
  `admin_comment` TEXT NULL,
  `must_change_password` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Exige troca de senha no 1º acesso',
  `regulation_accepted_version` VARCHAR(32) NULL COMMENT 'Versão aceita do regulamento',
  `regulation_accepted_at` DATETIME NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`active`),
  INDEX `idx_users_emp` (`employee_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Dias & Sessões da Campanha
CREATE TABLE IF NOT EXISTS `event_days` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL COMMENT 'Ex: Segunda-feira ou Dia 01',
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `date_label` VARCHAR(100) NOT NULL COMMENT 'Ex: 10 de Novembro de 2026',
  `parent_id` VARCHAR(64) NULL COMMENT 'Para sessões subordinadas',
  `attraction` VARCHAR(255) NULL COMMENT 'Nome da palestra / atração',
  `theme` VARCHAR(255) NULL COMMENT 'Tema principal',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  `opens_at` DATETIME NOT NULL COMMENT 'Horário de abertura em UTC',
  `closes_at` DATETIME NOT NULL COMMENT 'Horário de encerramento em UTC',
  `video_type` ENUM('url', 'attachment') NOT NULL DEFAULT 'url',
  `video_url` TEXT NULL COMMENT 'Link streaming ou caminho relativo',
  `video_attachment_name` VARCHAR(255) NULL,
  `video_attachment_data` LONGTEXT NULL COMMENT 'DataURL ou URL relativa de upload na Hostinger',
  `card_cover_image_url` LONGTEXT NULL COMMENT 'Arte gráfica em destaque no card',
  `card_cover_image_name` VARCHAR(255) NULL,
  `banner_image_url` TEXT NULL,
  `attendance_code_hash` VARCHAR(64) NULL COMMENT 'Hash SHA-256 do código de presença presencial',
  `attendance_code_length` INT NOT NULL DEFAULT 7,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `counts_for_full_week` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Conta para o sorteio final da semana',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_events_slug` (`slug`),
  INDEX `idx_events_active` (`active`),
  INDEX `idx_events_dates` (`opens_at`, `closes_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Palestrantes do Dia
CREATE TABLE IF NOT EXISTS `event_speakers` (
  `id` INT AUTO-INCREMENT NOT NULL PRIMARY KEY,
  `event_day_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(150) NULL,
  `image_url` TEXT NULL,
  FOREIGN KEY (`event_day_id`) REFERENCES `event_days`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Perguntas & Questionários Avaliativos
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `event_day_id` VARCHAR(64) NOT NULL,
  `title` TEXT NOT NULL,
  `type` ENUM('single_choice', 'free_text', 'rating') NOT NULL DEFAULT 'single_choice',
  `required` BOOLEAN NOT NULL DEFAULT TRUE,
  `scored` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Se conta ponto para acerto de 100%',
  `suggestion_prompt` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_day_id`) REFERENCES `event_days`(`id`) ON DELETE CASCADE,
  INDEX `idx_q_day` (`event_day_id`, `active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Alternativas das Perguntas
CREATE TABLE IF NOT EXISTS `alternatives` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `question_id` VARCHAR(64) NOT NULL,
  `text` TEXT NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Apenas admin/backend enxerga',
  `sort_order` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Participações dos Colaboradores por Dia
CREATE TABLE IF NOT EXISTS `participations` (
  `id` VARCHAR(130) NOT NULL PRIMARY KEY COMMENT 'Formato: userId_eventDayId',
  `user_id` VARCHAR(64) NOT NULL,
  `event_day_id` VARCHAR(64) NOT NULL,
  `modality` ENUM('in_person', 'remote') NULL,
  `attendance_validated_at` DATETIME NULL,
  `video_progress_percent` INT NOT NULL DEFAULT 0,
  `video_completed_at` DATETIME NULL,
  `status` ENUM('not_started', 'in_progress', 'submitted') NOT NULL DEFAULT 'not_started',
  `correct_count` INT NOT NULL DEFAULT 0,
  `scored_question_count` INT NOT NULL DEFAULT 0,
  `percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `perfect_score` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '100% de acertos para concorrer aos prêmios',
  `submitted_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_day` (`user_id`, `event_day_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`event_day_id`) REFERENCES `event_days`(`id`) ON DELETE CASCADE,
  INDEX `idx_part_perfect` (`event_day_id`, `perfect_score`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Respostas Dadas pelo Colaborador
CREATE TABLE IF NOT EXISTS `participation_answers` (
  `id` BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `participation_id` VARCHAR(130) NOT NULL,
  `question_id` VARCHAR(64) NOT NULL,
  `alternative_id` VARCHAR(64) NULL,
  `text_answer` TEXT NULL,
  `rating_answer` INT NULL,
  `is_correct` BOOLEAN NULL,
  FOREIGN KEY (`participation_id`) REFERENCES `participations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Sorteios Oficiais Realizados
CREATE TABLE IF NOT EXISTS `draws` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `prize_name` VARCHAR(200) NOT NULL,
  `prize_image_url` TEXT NULL,
  `group_name` VARCHAR(150) NOT NULL,
  `scope_type` ENUM('day', 'full_week') NOT NULL,
  `scope_event_day_id` VARCHAR(64) NULL,
  `requested_winner_count` INT NOT NULL DEFAULT 1,
  `actual_winner_count` INT NOT NULL DEFAULT 1,
  `exclude_previous_winners` BOOLEAN NOT NULL DEFAULT TRUE,
  `eligible_count` INT NOT NULL DEFAULT 0,
  `eligible_user_ids_snapshot` JSON NULL,
  `status` ENUM('published', 'voided') NOT NULL DEFAULT 'published',
  `void_reason` TEXT NULL,
  `voided_by` VARCHAR(64) NULL,
  `voided_at` DATETIME NULL,
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX `idx_draw_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Ganhadores Contemplados no Sorteio
CREATE TABLE IF NOT EXISTS `draw_winners` (
  `id` BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `draw_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `employee_number` VARCHAR(64) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `unit_name` VARCHAR(150) NOT NULL,
  `company` VARCHAR(150) NULL,
  `position` INT NOT NULL,
  FOREIGN KEY (`draw_id`) REFERENCES `draws`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Regulamentos da Campanha
CREATE TABLE IF NOT EXISTS `regulations` (
  `version` VARCHAR(32) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content_html` LONGTEXT NOT NULL,
  `pdf_url` TEXT NULL,
  `published` BOOLEAN NOT NULL DEFAULT TRUE,
  `effective_from` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Configurações Globais & Identidade Visual (White-Label)
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT NOT NULL PRIMARY KEY DEFAULT 1,
  `event_name` VARCHAR(150) NOT NULL DEFAULT 'SIPAT Honda 2026',
  `event_year` INT NOT NULL DEFAULT 2026,
  `brand_name` VARCHAR(150) NULL DEFAULT 'Portal SIPAT Honda',
  `brand_subtitle` VARCHAR(255) NULL,
  `primary_logo_url` LONGTEXT NULL,
  `primary_color` VARCHAR(16) NOT NULL DEFAULT '#028056',
  `primary_dark_color` VARCHAR(16) NOT NULL DEFAULT '#015237',
  `action_color` VARCHAR(16) NOT NULL DEFAULT '#66bd39',
  `background_color` VARCHAR(16) NOT NULL DEFAULT '#e2e8e8',
  `login_title` VARCHAR(200) NULL,
  `login_subtitle` TEXT NULL,
  `login_badge_text` VARCHAR(150) NULL,
  `home_headline` VARCHAR(255) NULL,
  `home_description` TEXT NULL,
  `initial_password_help_text` VARCHAR(255) NULL,
  `active_regulation_version` VARCHAR(32) NOT NULL DEFAULT '2026.1',
  `video_completion_threshold_percent` INT NOT NULL DEFAULT 99,
  `show_correct_answers_after_submit` BOOLEAN NOT NULL DEFAULT TRUE,
  `mask_employee_number_in_winners` BOOLEAN NOT NULL DEFAULT TRUE,
  `support_contact` VARCHAR(150) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Trilha de Auditoria (Governança & LGPD)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `actor_user_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `before_data` JSON NULL,
  `after_data` JSON NULL,
  `ip_hash` VARCHAR(64) NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_timestamp` (`timestamp`),
  INDEX `idx_audit_actor` (`actor_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Logs de Acesso & Tentativas de Login
CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `employee_number` VARCHAR(64) NOT NULL,
  `result` ENUM('success', 'failure') NOT NULL,
  `failure_reason` VARCHAR(255) NULL,
  `ip_hash` VARCHAR(64) NULL,
  `user_agent_summary` VARCHAR(255) NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_access_ts` (`timestamp`),
  INDEX `idx_access_emp` (`employee_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserção de Registro Único de Configurações Iniciais
INSERT INTO `app_settings` (
  `id`, `event_name`, `event_year`, `brand_name`, `brand_subtitle`,
  `primary_color`, `primary_dark_color`, `action_color`, `background_color`,
  `login_title`, `login_subtitle`, `login_badge_text`, `home_headline`,
  `home_description`, `initial_password_help_text`, `active_regulation_version`
) VALUES (
  1, 'SIPAT Honda 2026', 2026, 'Portal SIPAT Honda', 'Cuidar de você é a nossa maior segurança',
  '#028056', '#015237', '#66bd39', '#e2e8e8',
  'Acesse sua conta', 'Utilize sua matrícula funcional da Honda para ingressar no evento.',
  'Honda Automóveis do Brasil', 'Semana Interna de Prevenção de Acidentes do Trabalho',
  'Participe diariamente dos treinamentos presenciais ou assista aos vídeos oficiais para validar sua presença e concorrer aos sorteios.',
  'Senha inicial: data de aniversário sem barras. Exemplo: 01051995', '2026.1'
) ON DUPLICATE KEY UPDATE `id` = 1;
```

---

## 3. Especificação Completa dos Endpoints REST (Node.js API)

Todos os endpoints utilizam formato JSON (`Content-Type: application/json`).  
Rotas protegidas exigem o cabeçalho: `Authorization: Bearer <jwt_token>`.

### 3.1. Autenticação & Acesso
- **`POST /api/auth/login`**
  - **Body:** `{ "employeeNumber": "string", "password": "string" }`
  - **Lógica:**
    1. Busca usuário por `employee_number`.
    2. Compara senha com `bcrypt.compare(password, user.password_hash)`.
    3. Se usuário novo com senha padrão (data de nascimento sem barras), aceita e marca `mustChangePassword = true`.
    4. Gera token JWT contendo `{ id, employeeNumber, role, displayName }` (expiração: 24h).
    5. Registra em `access_logs`.
  - **Retorno 200:** `{ "token": "...", "user": { ... } }`

- **`POST /api/auth/first-access`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }`
  - **Lógica:** Valida critérios de segurança (mínimo 8 caracteres, número, caractere especial). Atualiza hash e define `must_change_password = FALSE`.

- **`POST /api/auth/accept-regulation`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "version": "2026.1" }`
  - **Lógica:** Atualiza `regulation_accepted_version = '2026.1'` e `regulation_accepted_at = NOW()`.

---

### 3.2. Dias, Vídeos & Questionários
- **`GET /api/events`**
  - **Lógica:** Retorna todos os dias de evento ativos com palestrantes e status calculado com base no horário de Brasília (`opens_at` e `closes_at`). O hash do código de presença NÃO deve ser exposto ao cliente colaborador.

- **`GET /api/events/:slug`**
  - **Lógica:** Retorna detalhes do dia pelo slug, perguntas ativas e alternativas associadas (Ocultando o campo `is_correct` se o usuário não for admin).

- **`POST /api/events/:id/attendance`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "attendanceCode": "SIPAT01", "modality": "in_person" }`
  - **Lógica:** Calcula `sha256(attendanceCode.toUpperCase())` e compara com `attendance_code_hash`. Se correto, define `modality = 'in_person'` e `attendance_validated_at = NOW()`.

- **`POST /api/events/:id/video-progress`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "currentSeconds": 180, "durationSeconds": 182 }`
  - **Lógica:** Calcula a porcentagem. Se atingir 99%, registra `video_completed_at = NOW()` e define `modality = 'remote'`.

- **`POST /api/events/:id/quiz`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Body:** `{ "answers": { "q1": { "alternativeId": "alt-1" }, ... }, "suggestions": { ... } }`
  - **Lógica Segura no Servidor:**
    1. Verifica se presença ou 99% do vídeo foram validados.
    2. Compara cada resposta contra a alternativa correta no banco (`alternatives.is_correct = TRUE`).
    3. Calcula `correct_count`, `scored_question_count` e `percentage`.
    4. Se `correct_count === scored_question_count`, define `perfect_score = TRUE`.
    5. Grava em `participations` e `participation_answers`.
  - **Retorno 200:** `{ "correctCount": 3, "totalCount": 3, "percentage": 100, "perfectScore": true }`

---

### 3.3. Sorteios & Elegibilidade
- **`POST /api/admin/draws/preview`**
  - **Headers:** `Authorization: Bearer <token>` (Admin Only)
  - **Body:** `{ "scope": { "type": "day", "eventDayId": "day-1" }, "excludePreviousWinners": true }`
  - **Lógica SQL:**
    ```sql
    SELECT u.id, u.employee_number, u.display_name, u.email, un.name as unit_name
    FROM participations p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN units un ON un.id = u.unit_id
    WHERE p.event_day_id = ?
      AND p.perfect_score = TRUE
      AND p.status = 'submitted'
      AND u.active = TRUE
      AND (? = FALSE OR u.id NOT IN (SELECT user_id FROM draw_winners dw JOIN draws d ON d.id = dw.draw_id WHERE d.status = 'published'));
    ```

- **`POST /api/admin/draws/execute`**
  - **Headers:** `Authorization: Bearer <token>` (Admin Only)
  - **Body:** `{ "prizeName": "Smartwatch", "groupName": "Sumaré", "scope": { ... }, "requestedCount": 2, ... }`
  - **Lógica:** Seleciona aleatoriamente usando `crypto.randomInt` entre os elegíveis. Insere registro em `draws` e em `draw_winners`.

---

### 3.4. White-Label & Customização de Cores
- **`GET /api/settings`**
  - Retorna configurações globais, nome da marca, cores e logotipos.
- **`PUT /api/admin/settings`**
  - Atualiza cores (`primary_color`, `primary_dark_color`, `action_color`, `background_color`), logotipo e textos de cabeçalho e login.

---

## 4. Prompt Mestre para Gerar o Backend no Claude / ChatGPT

Copie e cole o prompt abaixo no Claude 3.7 Sonnet ou ChatGPT:

```markdown
Você é um Arquiteto de Software Backend Sênior especialista em Node.js, Express, TypeScript e MySQL na Hostinger.
Preciso que você crie o código de backend completo para conectar a uma aplicação React já existente.

Siga estritamente as especificações abaixo:
1. Arquitetura em camadas:
   - src/server.ts (Configuração do Express, CORS, Helmet, Rate Limit, inicialização da porta)
   - src/config/database.ts (Pool de conexões MySQL2 com suporte a promises e reconexão)
   - src/routes/ (Rotas separadas: auth.routes.ts, events.routes.ts, admin.routes.ts, settings.routes.ts)
   - src/controllers/ (Controllers correspondentes com tratamento de erros try/catch estruturado)
   - src/services/ (Lógica de autenticação com bcrypt e JWT, validação de gabarito e cálculo de sorteio com crypto seguro)
   - src/middlewares/ (authMiddleware com validação de JWT Bearer e verificação de role 'admin')
2. Use o esquema SQL exato descrito no arquivo schema.sql com todas as tabelas (users, units, event_days, questions, alternatives, participations, draws, app_settings, audit_logs).
3. Todas as regras de negócio de pontuação e anti-fraude devem ser validadas server-side (nunca confiar no frontend).
4. O código deve ser 100% comentado, limpo e pronto para rodar em produção na Hostinger.
```
