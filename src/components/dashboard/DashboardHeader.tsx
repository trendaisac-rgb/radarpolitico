/**
 * RadarPolítico - Dashboard Header
 * Cabeçalho do dashboard com info do político e ações
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell, Settings, LogOut, RefreshCw, Calendar, User,
  ChevronDown, BarChart3, Home
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardHeaderProps {
  politicianName?: string
  politicianParty?: string
  lastUpdate?: string
  onRefresh?: () => void
  onLogout?: () => void
  isRefreshing?: boolean
  userEmail?: string
}

export function DashboardHeader({
  politicianName,
  politicianParty,
  lastUpdate,
  onRefresh,
  onLogout,
  isRefreshing,
  userEmail
}: DashboardHeaderProps) {
  const navigate = useNavigate()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Nunca'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      {/* Logo e Título */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
          <BarChart3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Radar Político
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor 360° de Imagem
          </p>
        </div>
      </div>

      {/* Info do Político */}
      {politicianName && (
        <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{politicianName}</p>
            {politicianParty && (
              <Badge variant="secondary" className="text-xs">
                {politicianParty}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Última atualização */}
        {lastUpdate && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-md">
            <Calendar className="h-3.5 w-3.5" />
            <span>Atualizado: {formatDate(lastUpdate)}</span>
          </div>
        )}

        {/* Botão Atualizar */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>

        {/* Notificações */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Menu do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {userEmail && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground border-b mb-1">
                {userEmail}
              </div>
            )}
            <DropdownMenuItem onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/add-politician')}>
              <User className="h-4 w-4 mr-2" />
              Adicionar Político
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
