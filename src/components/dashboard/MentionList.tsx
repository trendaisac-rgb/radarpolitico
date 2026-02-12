/**
 * RadarPolítico - Mention List
 * Lista compacta de menções recentes
 */

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Newspaper, Play } from 'lucide-react'
import { MentionItem } from './MentionItem'
import type { Mention } from '@/integrations/supabase/client'

interface MentionListProps {
  mentions: Mention[]
  isLoading: boolean
  isMonitoring: boolean
  onRunMonitoring: () => void
  maxItems?: number
}

export function MentionList({ mentions, isLoading, isMonitoring, onRunMonitoring, maxItems = 10 }: MentionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-5 w-16" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (mentions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <Newspaper className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium mb-1">Nenhuma menção ainda</p>
        <p className="text-sm text-muted-foreground mb-4">
          Clique em "Atualizar" para buscar notícias
        </p>
        <Button onClick={onRunMonitoring} disabled={isMonitoring} size="sm">
          <Play className="h-4 w-4 mr-2" />
          Buscar Agora
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {mentions.slice(0, maxItems).map(mention => (
        <MentionItem key={mention.id} mention={mention} />
      ))}
    </div>
  )
}
