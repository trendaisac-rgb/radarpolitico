/**
 * RadarPolítico - Loading States
 * Componentes de loading, erro e estado vazio
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Users, RefreshCw, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Loading State
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-muted-foreground animate-pulse">Carregando dados...</p>
    </div>
  )
}

// Error State
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado</h2>
        <p className="text-muted-foreground mb-6">
          {message || 'Não foi possível carregar os dados. Tente novamente.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Empty State - Nenhum político cadastrado
export function EmptyState() {
  const navigate = useNavigate()

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Nenhum político cadastrado</h2>
        <p className="text-muted-foreground mb-6">
          Cadastre um político para começar a monitorar as menções na mídia e redes sociais.
        </p>
        <Button onClick={() => navigate('/add-politician')}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Político
        </Button>
      </CardContent>
    </Card>
  )
}

// Empty Data State - Político cadastrado mas sem dados
interface EmptyDataStateProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function EmptyDataState({ onRefresh, isRefreshing }: EmptyDataStateProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-8 w-8 text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sem dados ainda</h2>
        <p className="text-muted-foreground mb-6">
          Clique em "Atualizar" para buscar as últimas menções nas redes sociais e mídia.
        </p>
        <Button onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Buscar Agora
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Skeleton Card para loading
export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton Chart para loading
export function SkeletonChart() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="h-4 bg-muted rounded w-32 mb-4" />
        <div className="h-[200px] bg-muted rounded" />
      </CardContent>
    </Card>
  )
}
