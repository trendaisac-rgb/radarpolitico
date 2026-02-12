/**
 * RadarPolítico - Dashboard Toolbar
 * Barra de ações: seletor de político + botões
 */

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Plus, FileDown, Loader2 } from 'lucide-react'
import type { Politician } from '@/integrations/supabase/client'

interface DashboardToolbarProps {
  politicians: Politician[]
  selectedId: number | null
  onSelectPolitician: (id: number) => void
  onRefresh: () => void
  onAddPolitician: () => void
  onOpenReport: () => void
  isRefreshing: boolean
  hasMentions: boolean
}

export function DashboardToolbar({
  politicians,
  selectedId,
  onSelectPolitician,
  onRefresh,
  onAddPolitician,
  onOpenReport,
  isRefreshing,
  hasMentions
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <Tabs
        value={String(selectedId)}
        onValueChange={(v) => onSelectPolitician(Number(v))}
      >
        <TabsList>
          {politicians.map(p => (
            <TabsTrigger key={p.id} value={String(p.id)}>
              {p.nickname || p.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onOpenReport} disabled={!hasMentions}>
          <FileDown className="h-4 w-4 mr-2" />
          Relatório
        </Button>
        <Button variant="outline" onClick={onAddPolitician}>
          <Plus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>
    </div>
  )
}
