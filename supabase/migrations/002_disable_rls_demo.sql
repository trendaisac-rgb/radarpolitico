-- ===========================================
-- RadarPolítico - Desabilitar RLS para Demo
-- Execute este SQL no Supabase SQL Editor
-- IMPORTANTE: Em produção, habilite RLS novamente!
-- ===========================================

-- Desabilita RLS em todas as tabelas para permitir acesso público
ALTER TABLE politicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources DISABLE ROW LEVEL SECURITY;

-- Cria políticas públicas de acesso (alternativa ao RLS desabilitado)
-- Isso permite SELECT, INSERT, UPDATE, DELETE para todos

-- Politicians
DROP POLICY IF EXISTS "Public read politicians" ON politicians;
DROP POLICY IF EXISTS "Public insert politicians" ON politicians;
DROP POLICY IF EXISTS "Public update politicians" ON politicians;
DROP POLICY IF EXISTS "Public delete politicians" ON politicians;

CREATE POLICY "Public read politicians" ON politicians FOR SELECT USING (true);
CREATE POLICY "Public insert politicians" ON politicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update politicians" ON politicians FOR UPDATE USING (true);
CREATE POLICY "Public delete politicians" ON politicians FOR DELETE USING (true);

-- Mentions
DROP POLICY IF EXISTS "Public read mentions" ON mentions;
DROP POLICY IF EXISTS "Public insert mentions" ON mentions;

CREATE POLICY "Public read mentions" ON mentions FOR SELECT USING (true);
CREATE POLICY "Public insert mentions" ON mentions FOR INSERT WITH CHECK (true);

-- Daily Reports
DROP POLICY IF EXISTS "Public read daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Public insert daily_reports" ON daily_reports;

CREATE POLICY "Public read daily_reports" ON daily_reports FOR SELECT USING (true);
CREATE POLICY "Public insert daily_reports" ON daily_reports FOR INSERT WITH CHECK (true);

-- Alerts
DROP POLICY IF EXISTS "Public read alerts" ON alerts;
DROP POLICY IF EXISTS "Public insert alerts" ON alerts;

CREATE POLICY "Public read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Public insert alerts" ON alerts FOR INSERT WITH CHECK (true);

-- News Sources (apenas leitura)
DROP POLICY IF EXISTS "Public read news_sources" ON news_sources;
CREATE POLICY "Public read news_sources" ON news_sources FOR SELECT USING (true);

-- ===========================================
-- FIM - Agora o sistema funciona sem login!
-- ===========================================
