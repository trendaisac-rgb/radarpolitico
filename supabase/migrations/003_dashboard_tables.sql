-- RadarPolítico - Tabelas para Dashboard Profissional
-- Migration: 003_dashboard_tables.sql

-- Relatórios diários por político
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  score_anterior INTEGER DEFAULT 50,

  -- Alertas
  alerta_nivel TEXT CHECK (alerta_nivel IN ('verde', 'amarelo', 'vermelho')),
  alerta_motivo TEXT,

  -- Análise IA
  sumario TEXT,
  recomendacoes TEXT[],

  -- Totais do dia
  total_mencoes INTEGER DEFAULT 0,
  mencoes_positivas INTEGER DEFAULT 0,
  mencoes_negativas INTEGER DEFAULT 0,
  mencoes_neutras INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Um relatório por político por dia
  UNIQUE(politician_id, data)
);

-- Métricas por rede social
CREATE TABLE IF NOT EXISTS network_metrics (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
  politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE,
  data DATE NOT NULL,

  -- Identificador da rede
  rede TEXT NOT NULL CHECK (rede IN ('midia', 'youtube', 'twitter', 'instagram', 'tiktok', 'telegram', 'facebook')),

  -- Métricas
  mencoes INTEGER DEFAULT 0,
  sentimento_positivo INTEGER DEFAULT 0,
  sentimento_negativo INTEGER DEFAULT 0,
  sentimento_neutro INTEGER DEFAULT 0,
  score INTEGER DEFAULT 50,

  -- Engajamento (quando disponível)
  engajamento INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  compartilhamentos INTEGER DEFAULT 0,

  -- Tendência vs dia anterior
  tendencia TEXT CHECK (tendencia IN ('subindo', 'descendo', 'estavel')),
  variacao_percentual DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uma métrica por rede por político por dia
  UNIQUE(politician_id, data, rede)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_politician_date ON daily_reports(politician_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_network_metrics_politician_date ON network_metrics(politician_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_network_metrics_report ON network_metrics(report_id);

-- Desabilita RLS para modo demo (remover em produção)
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE network_metrics DISABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON daily_reports;
CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
