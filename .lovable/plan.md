

# Redesign Completo do Dashboard

## Problemas Identificados

1. **Seguranca critica**: Chave da OpenAI hardcoded no codigo-fonte (exposta publicamente)
2. **Dois dashboards redundantes**: `Dashboard.tsx` (598 linhas) e `DashboardPro.tsx` (855 linhas) - confuso
3. **Arquivo gigante**: DashboardPro.tsx com 855 linhas, dificil de manter
4. **Erro de build**: Edge function referencia `npm:openai` que nao existe
5. **Layout denso**: Muita informacao sem hierarquia visual clara
6. **Dados mock misturados**: CompetitorRanking com dados falsos polui a experiencia

## Plano de Implementacao

### 1. Corrigir erro de build da edge function
- Remover a importacao de `npm:openai` do `supabase/functions/analyze-mention/index.ts` (a funcao ja usa `fetch` direto para a API do Anthropic, nao precisa do pacote)

### 2. Mover chave OpenAI para secret seguro
- Remover a chave hardcoded de `src/services/aiAnalysis.ts`
- Criar uma edge function `ai-analysis` que recebe os dados e chama a OpenAI server-side
- O frontend chama a edge function ao inves de chamar a OpenAI diretamente

### 3. Eliminar dashboard duplicado
- Remover `src/pages/Dashboard.tsx` (o antigo)
- Manter apenas `DashboardPro.tsx` como o dashboard unico, renomeado para `Dashboard.tsx`
- Atualizar rota em `App.tsx`

### 4. Redesign visual do Dashboard (novo layout limpo)

O novo dashboard tera um layout mais limpo com 4 secoes claras:

```text
+--------------------------------------------------+
|  Header (logo + politico selecionado + acoes)     |
+--------------------------------------------------+
|  Banner de Alerta (se houver)                     |
+--------------------------------------------------+
|  Score Gauge  |   Resumo Rapido (3 stat cards)    |
|   (grande)    |   Total | Positivas | Negativas   |
+---------------+-----------------------------------+
|        Grafico de Evolucao (7/15/30 dias)         |
+--------------------------------------------------+
|  Midia (card)         |  YouTube (card)           |
+--------------------------------------------------+
|        Ultimas Mencoes (lista compacta)            |
+--------------------------------------------------+
```

**Mudancas visuais principais:**
- Remover CompetitorRanking (dados mock - nao agrega valor real)
- Remover secao de Insights/IA do layout principal (mover para modal de relatorio)
- Score Gauge + 3 stat cards na mesma linha (mais compacto)
- Grafico de evolucao em largura total
- Cards de rede lado a lado mais compactos
- Mencoes em lista ao inves de grid (mais legivel)
- Toolbar simplificada: apenas "Atualizar" + "Relatorio" + "Novo Politico"

### 5. Componentizacao

Extrair do arquivo monolitico para componentes menores:
- `src/components/dashboard/DashboardToolbar.tsx` - barra de acoes
- `src/components/dashboard/StatsRow.tsx` - score gauge + stat cards
- `src/components/dashboard/MentionList.tsx` - lista de mencoes
- `src/components/dashboard/MentionItem.tsx` - item individual de mencao

## Secao Tecnica

### Arquivos a criar:
- `supabase/functions/ai-analysis/index.ts` - edge function segura para chamadas OpenAI
- `src/components/dashboard/DashboardToolbar.tsx`
- `src/components/dashboard/StatsRow.tsx`
- `src/components/dashboard/MentionList.tsx`
- `src/components/dashboard/MentionItem.tsx`

### Arquivos a modificar:
- `src/services/aiAnalysis.ts` - remover chave hardcoded, chamar edge function
- `src/App.tsx` - atualizar rota para novo Dashboard
- `supabase/functions/analyze-mention/index.ts` - corrigir import que causa erro de build

### Arquivos a remover:
- `src/pages/Dashboard.tsx` (antigo, substituido pelo redesign)
- `src/components/dashboard/CompetitorRanking.tsx` (dados mock)

### Dependencias: Nenhuma nova dependencia necessaria.

