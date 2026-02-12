/**
 * RadarPolítico - Mention Item
 * Item individual de menção em lista compacta
 */

import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Mention } from '@/integrations/supabase/client'

interface MentionItemProps {
  mention: Mention
}

const sentimentConfig = {
  positivo: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: TrendingUp },
  negativo: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: TrendingDown },
  neutro: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Minus }
}

export function MentionItem({ mention }: MentionItemProps) {
  const config = sentimentConfig[mention.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutro
  const Icon = config.icon

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 hover:border-primary/20 transition-all cursor-pointer group"
      onClick={() => mention.url && window.open(mention.url, '_blank', 'noopener,noreferrer')}
    >
      {/* Sentimento dot */}
      <Badge className={`text-[10px] px-1.5 py-0.5 shrink-0 ${config.bg}`}>
        <Icon className="h-3 w-3 mr-0.5" />
        {mention.sentiment}
      </Badge>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
          {mention.title || 'Sem título'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{mention.source_name || 'Fonte'}</span>
          <span>•</span>
          <Clock className="h-3 w-3" />
          <span>
            {new Date(mention.published_at || mention.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Link */}
      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}
