-- ===========================================
-- RadarPolítico - Schema Inicial
-- Execute este SQL no Supabase SQL Editor
-- ===========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE sentiment_type AS ENUM ('positivo', 'negativo', 'neutro');
CREATE TYPE source_type AS ENUM ('news', 'twitter', 'instagram', 'facebook', 'diario_oficial', 'tse', 'other');
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ===========================================
-- TABELAS
-- ===========================================

-- Políticos monitorados
CREATE TABLE politicians (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    party VARCHAR(50),
    position VARCHAR(100),
    state VARCHAR(2),
    city VARCHAR(100),

    -- Contatos para notificação
    whatsapp VARCHAR(20),
    email VARCHAR(255),

    -- Configurações de monitoramento
    keywords TEXT[], -- Palavras-chave adicionais
    competitors INTEGER[], -- IDs de políticos concorrentes
    is_active BOOLEAN DEFAULT TRUE,

    -- Preferências de notificação
    notify_whatsapp BOOLEAN DEFAULT TRUE,
    notify_email BOOLEAN DEFAULT TRUE,
    notify_critical_only BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menções encontradas
CREATE TABLE mentions (
    id SERIAL PRIMARY KEY,
    politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,

    -- Dados da menção
    title VARCHAR(500),
    content TEXT,
    summary TEXT, -- Resumo gerado por IA
    url VARCHAR(2000) NOT NULL,
    source_name VARCHAR(255),
    source_type source_type DEFAULT 'news',

    -- Análise
    sentiment sentiment_type DEFAULT 'neutro',
    sentiment_score DECIMAL(3,2), -- -1.00 a 1.00
    relevance_score DECIMAL(3,2), -- 0.00 a 1.00
    topics TEXT[],
    entities JSONB,

    -- Metadados
    published_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT FALSE,
    is_alerted BOOLEAN DEFAULT FALSE,

    -- Hash para evitar duplicatas
    content_hash VARCHAR(64) UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
    mention_id INTEGER REFERENCES mentions(id) ON DELETE SET NULL,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority alert_priority DEFAULT 'medium',

    -- Status de notificação
    sent_whatsapp BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relatórios diários
CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,

    report_date DATE NOT NULL,

    -- Conteúdo
    summary TEXT,
    highlights JSONB,
    sentiment_overview JSONB,

    -- Estatísticas
    mention_count INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,

    -- Status de envio
    sent_whatsapp BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(politician_id, report_date)
);

-- Fontes de notícias
CREATE TABLE news_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    search_url_template VARCHAR(1000),
    source_type source_type DEFAULT 'news',

    -- Configurações de scraping
    scraper_class VARCHAR(100),
    rate_limit_seconds INTEGER DEFAULT 5,
    requires_selenium BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_politicians_user_id ON politicians(user_id);
CREATE INDEX idx_politicians_state ON politicians(state);
CREATE INDEX idx_politicians_active ON politicians(is_active);

CREATE INDEX idx_mentions_politician_id ON mentions(politician_id);
CREATE INDEX idx_mentions_sentiment ON mentions(sentiment);
CREATE INDEX idx_mentions_published_at ON mentions(published_at DESC);
CREATE INDEX idx_mentions_source_type ON mentions(source_type);
CREATE INDEX idx_mentions_processed ON mentions(is_processed);

CREATE INDEX idx_alerts_politician_id ON alerts(politician_id);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

CREATE INDEX idx_daily_reports_politician_date ON daily_reports(politician_id, report_date DESC);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para politicians
CREATE POLICY "Users can view their own politicians"
    ON politicians FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own politicians"
    ON politicians FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own politicians"
    ON politicians FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own politicians"
    ON politicians FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para mentions (via politician ownership)
CREATE POLICY "Users can view mentions of their politicians"
    ON mentions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM politicians
            WHERE politicians.id = mentions.politician_id
            AND politicians.user_id = auth.uid()
        )
    );

-- Políticas para alerts (via politician ownership)
CREATE POLICY "Users can view alerts of their politicians"
    ON alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM politicians
            WHERE politicians.id = alerts.politician_id
            AND politicians.user_id = auth.uid()
        )
    );

-- Políticas para daily_reports (via politician ownership)
CREATE POLICY "Users can view reports of their politicians"
    ON daily_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM politicians
            WHERE politicians.id = daily_reports.politician_id
            AND politicians.user_id = auth.uid()
        )
    );

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER politicians_updated_at
    BEFORE UPDATE ON politicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- DADOS INICIAIS (News Sources)
-- ===========================================

INSERT INTO news_sources (name, base_url, search_url_template, source_type) VALUES
('G1', 'https://g1.globo.com', 'https://g1.globo.com/busca/?q={query}', 'news'),
('UOL', 'https://www.uol.com.br', 'https://busca.uol.com.br/?q={query}', 'news'),
('Folha de S.Paulo', 'https://www.folha.uol.com.br', 'https://search.folha.uol.com.br/?q={query}', 'news'),
('Estadão', 'https://www.estadao.com.br', 'https://busca.estadao.com.br/?q={query}', 'news'),
('R7', 'https://www.r7.com', 'https://www.r7.com/busca?q={query}', 'news'),
('Terra', 'https://www.terra.com.br', 'https://www.terra.com.br/busca/{query}', 'news');

-- ===========================================
-- FIM DO SCHEMA
-- ===========================================
