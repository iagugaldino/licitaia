-- ============================================
-- LicitaIA — Schema Supabase para Digest Diário
-- Rode isso no SQL Editor do Supabase
-- ============================================

create table if not exists digest_preferences (
  id uuid primary key default gen_random_uuid(),
  -- Identificação do usuário (ajuste se já tiver tabela de auth/users própria)
  user_email text not null unique,
  user_name text,

  -- Preferências de envio
  enabled boolean default true,
  send_time text default '08:00',          -- formato HH:MM, horário de Brasília
  channel text default 'email',             -- 'email' | 'whatsapp' (whatsapp ainda não ativo)
  whatsapp_number text,                     -- preenchido quando WhatsApp for ativado

  -- Filtros de busca
  keywords text,                            -- ex: "TI, construção, limpeza"
  uf text,                                  -- ex: "SP" ou null para todos

  -- Controle de envio (evita duplicar no mesmo dia)
  last_sent_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice pra acelerar a query do cron (busca quem deve receber agora)
create index if not exists idx_digest_enabled_time on digest_preferences (enabled, send_time);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_digest_updated_at
before update on digest_preferences
for each row execute function update_updated_at();
