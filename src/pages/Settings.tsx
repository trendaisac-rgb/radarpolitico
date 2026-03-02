/**
 * RadarPolítico - Página de Configurações
 * Gerencia políticos monitorados, notificações e assinatura
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Sidebar } from '@/components/Sidebar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  CreditCard,
  Trash2,
  Edit,
  Plus,
  Save,
  Check,
  ArrowLeft,
  Loader2,
  Palette,
  X,
  Hash,
  Search,
  Tag
} from 'lucide-react'
import { supabase, type Politician } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// ============================================
// THEME COLORS
// ============================================

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const THEMES: Record<ThemeKey, {
  label: string
  dot: string
  bg: string
  bgGradient: string
  headerBg: string
  headerBorder: string
  cardBg: string
  cardBorder: string
  cardHoverBorder: string
  accentText: string
  accentMuted: string
  chartGrid: string
  tooltipBg: string
  tooltipBorder: string
  filterBg: string
  filterActive: string
  mutedText: string
  brightText: string
  bodyText: string
}> = {
  azul: {
    label: 'Azul',
    dot: 'bg-[hsl(210,60%,45%)]',
    bg: 'hsl(215,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)',
    headerBg: 'hsl(215,25%,11%)',
    headerBorder: 'hsl(215,25%,18%)',
    cardBg: 'hsl(215,25%,12%)',
    cardBorder: 'hsl(215,25%,20%)',
    cardHoverBorder: 'hsl(215,25%,30%)',
    accentText: 'hsl(210,40%,60%)',
    accentMuted: 'hsl(210,40%,20%)',
    chartGrid: 'hsl(215,25%,20%)',
    tooltipBg: 'hsl(215,25%,15%)',
    tooltipBorder: 'hsl(215,25%,25%)',
    filterBg: 'hsl(215,25%,15%)',
    filterActive: 'hsl(215,25%,25%)',
    mutedText: 'hsl(215,15%,50%)',
    brightText: 'hsl(210,40%,98%)',
    bodyText: 'hsl(215,15%,65%)',
  },
  verde: {
    label: 'Verde',
    dot: 'bg-[hsl(152,55%,42%)]',
    bg: 'hsl(155,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)',
    headerBg: 'hsl(155,25%,11%)',
    headerBorder: 'hsl(155,25%,18%)',
    cardBg: 'hsl(155,25%,12%)',
    cardBorder: 'hsl(155,25%,20%)',
    cardHoverBorder: 'hsl(155,25%,30%)',
    accentText: 'hsl(152,45%,55%)',
    accentMuted: 'hsl(152,40%,20%)',
    chartGrid: 'hsl(155,25%,20%)',
    tooltipBg: 'hsl(155,25%,15%)',
    tooltipBorder: 'hsl(155,25%,25%)',
    filterBg: 'hsl(155,25%,15%)',
    filterActive: 'hsl(155,25%,25%)',
    mutedText: 'hsl(155,15%,50%)',
    brightText: 'hsl(150,40%,98%)',
    bodyText: 'hsl(155,15%,65%)',
  },
  vermelho: {
    label: 'Vermelho',
    dot: 'bg-[hsl(0,70%,50%)]',
    bg: 'hsl(0,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)',
    headerBg: 'hsl(0,25%,11%)',
    headerBorder: 'hsl(0,25%,18%)',
    cardBg: 'hsl(0,25%,12%)',
    cardBorder: 'hsl(0,25%,20%)',
    cardHoverBorder: 'hsl(0,25%,30%)',
    accentText: 'hsl(0,70%,55%)',
    accentMuted: 'hsl(0,40%,20%)',
    chartGrid: 'hsl(0,25%,20%)',
    tooltipBg: 'hsl(0,25%,15%)',
    tooltipBorder: 'hsl(0,25%,25%)',
    filterBg: 'hsl(0,25%,15%)',
    filterActive: 'hsl(0,25%,25%)',
    mutedText: 'hsl(0,15%,50%)',
    brightText: 'hsl(0,40%,98%)',
    bodyText: 'hsl(0,15%,65%)',
  },
  amarelo: {
    label: 'Amarelo',
    dot: 'bg-[hsl(45,95%,55%)]',
    bg: 'hsl(45,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)',
    headerBg: 'hsl(45,25%,11%)',
    headerBorder: 'hsl(45,25%,18%)',
    cardBg: 'hsl(45,25%,12%)',
    cardBorder: 'hsl(45,25%,20%)',
    cardHoverBorder: 'hsl(45,25%,30%)',
    accentText: 'hsl(45,95%,50%)',
    accentMuted: 'hsl(45,40%,20%)',
    chartGrid: 'hsl(45,25%,20%)',
    tooltipBg: 'hsl(45,25%,15%)',
    tooltipBorder: 'hsl(45,25%,25%)',
    filterBg: 'hsl(45,25%,15%)',
    filterActive: 'hsl(45,25%,25%)',
    mutedText: 'hsl(45,15%,50%)',
    brightText: 'hsl(45,40%,98%)',
    bodyText: 'hsl(45,15%,65%)',
  },
  roxo: {
    label: 'Roxo',
    dot: 'bg-[hsl(270,60%,50%)]',
    bg: 'hsl(270,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)',
    headerBg: 'hsl(270,25%,11%)',
    headerBorder: 'hsl(270,25%,18%)',
    cardBg: 'hsl(270,25%,12%)',
    cardBorder: 'hsl(270,25%,20%)',
    cardHoverBorder: 'hsl(270,25%,30%)',
    accentText: 'hsl(270,60%,55%)',
    accentMuted: 'hsl(270,40%,20%)',
    chartGrid: 'hsl(270,25%,20%)',
    tooltipBg: 'hsl(270,25%,15%)',
    tooltipBorder: 'hsl(270,25%,25%)',
    filterBg: 'hsl(270,25%,15%)',
    filterActive: 'hsl(270,25%,25%)',
    mutedText: 'hsl(270,15%,50%)',
    brightText: 'hsl(270,40%,98%)',
    bodyText: 'hsl(270,15%,65%)',
  },
  teal: {
    label: 'Teal',
    dot: 'bg-[hsl(180,60%,45%)]',
    bg: 'hsl(180,25%,9%)',
    bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)',
    headerBg: 'hsl(180,25%,11%)',
    headerBorder: 'hsl(180,25%,18%)',
    cardBg: 'hsl(180,25%,12%)',
    cardBorder: 'hsl(180,25%,20%)',
    cardHoverBorder: 'hsl(180,25%,30%)',
    accentText: 'hsl(180,50%,55%)',
    accentMuted: 'hsl(180,40%,20%)',
    chartGrid: 'hsl(180,25%,20%)',
    tooltipBg: 'hsl(180,25%,15%)',
    tooltipBorder: 'hsl(180,25%,25%)',
    filterBg: 'hsl(180,25%,15%)',
    filterActive: 'hsl(180,25%,25%)',
    mutedText: 'hsl(180,15%,50%)',
    brightText: 'hsl(180,40%,98%)',
    bodyText: 'hsl(180,15%,65%)',
  },
}

// ============================================
// CONSTANTS
// ============================================

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const TIMEZONES_BR = [
  { value: 'America/Manaus', label: 'Manaus (AM-04)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (AM-04)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (AM-04)' },
  { value: 'America/Belém', label: 'Belém (AM-03)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (AM-03)' },
  { value: 'America/Recife', label: 'Recife (AM-03)' },
  { value: 'America/Maceio', label: 'Maceió (AM-03)' },
  { value: 'America/Bahia', label: 'Salvador (AM-03)' },
  { value: 'America/Araguaina', label: 'Palmas (AM-03)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (AM-03)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (AM-03)' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (AM-03)' },
  { value: 'America/Godthab', label: 'Brasília (AM-03)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (AM-05)' },
]

const SUBSCRIPTION_PLANS = {
  trial: {
    name: 'Teste Gratuito',
    maxPoliticians: 3,
    features: ['Até 3 políticos', 'Relatórios diários por email', 'Alertas básicos'],
  },
  starter: {
    name: 'Starter',
    maxPoliticians: 10,
    features: ['Até 10 políticos', 'Relatórios diários', 'Alertas prioritários', 'Análise de sentimento'],
  },
  pro: {
    name: 'Pro',
    maxPoliticians: 50,
    features: ['Até 50 políticos', 'Relatórios customizados', 'Alertas em tempo real', 'Análise de sentimento avançada', 'Exportar dados'],
  },
  gabinete: {
    name: 'Gabinete',
    maxPoliticians: 999,
    features: ['Políticos ilimitados', 'Relatórios customizados', 'Alertas em tempo real', 'Análise de IA', 'Suporte prioritário', 'API access'],
  },
}

// ============================================
// TYPES
// ============================================

interface UserSettings {
  user_id: string
  notification_hour: number
  whatsapp_number: string | null
  receive_whatsapp: boolean
  receive_email: boolean
  critical_alerts_only: boolean
  timezone: string
  created_at: string
  updated_at: string
}

interface Subscription {
  user_id: string
  plan: 'trial' | 'starter' | 'pro' | 'gabinete'
  trial_end_date: string | null
  created_at: string
  updated_at: string
}

// ============================================
// COMPONENTS
// ============================================

interface TabMeusPoliticosProps {
  politicians: Politician[]
  loading: boolean
  onEdit: (politician: Politician) => void
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  theme: typeof THEMES[ThemeKey]
}

function TabMeusPoliticos({
  politicians,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  theme,
}: TabMeusPoliticosProps) {
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            }}
          >
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {politicians.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{
            backgroundColor: theme.filterBg,
            borderColor: theme.cardBorder,
          }}
        >
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 mb-4">Nenhum político monitorado ainda</p>
          <Button
            onClick={() => navigate('/add-politician')}
            style={{ backgroundColor: theme.accentText }}
            className="text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Político
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => navigate('/add-politician')}
              style={{ backgroundColor: theme.accentText }}
              className="text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Político
            </Button>
          </div>

          {politicians.map(politician => (
            <div
              key={politician.id}
              className="p-6 rounded-lg border transition-all hover:border-opacity-100"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: theme.brightText }}>
                      {politician.name}
                    </h3>
                    {politician.is_active ? (
                      <Badge style={{ backgroundColor: theme.accentMuted }}>
                        <Check className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" style={{ borderColor: theme.mutedText, color: theme.mutedText }}>
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    {politician.party && (
                      <div>
                        <span style={{ color: theme.mutedText }} className="text-xs">Partido</span>
                        <p style={{ color: theme.bodyText }}>{politician.party}</p>
                      </div>
                    )}
                    {politician.position && (
                      <div>
                        <span style={{ color: theme.mutedText }} className="text-xs">Cargo</span>
                        <p style={{ color: theme.bodyText }}>{politician.position}</p>
                      </div>
                    )}
                    {politician.state && (
                      <div>
                        <span style={{ color: theme.mutedText }} className="text-xs">Estado</span>
                        <p style={{ color: theme.bodyText }}>{politician.state}</p>
                      </div>
                    )}
                    {politician.city && (
                      <div>
                        <span style={{ color: theme.mutedText }} className="text-xs">Cidade</span>
                        <p style={{ color: theme.bodyText }}>{politician.city}</p>
                      </div>
                    )}
                  </div>

                  {politician.keywords && politician.keywords.length > 0 && (
                    <div className="mt-4">
                      <span style={{ color: theme.mutedText }} className="text-xs">Termos Monitorados</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {politician.keywords.map((keyword, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            style={{
                              borderColor: theme.accentText,
                              color: theme.accentText,
                            }}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(politician)}
                    style={{ color: theme.accentText }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(politician.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: theme.cardBorder }}>
                <span style={{ color: theme.bodyText }} className="text-sm">
                  {politician.is_active ? 'Monitoramento ativo' : 'Monitoramento pausado'}
                </span>
                <Switch
                  checked={politician.is_active}
                  onCheckedChange={(checked) => onToggleActive(politician.id, checked)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Político?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este político do monitoramento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) {
                  await onDelete(deleteId)
                  setDeleteId(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface TabNotificacoesProps {
  settings: UserSettings | null
  loading: boolean
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  theme: typeof THEMES[ThemeKey]
}

function TabNotificacoes({
  settings,
  loading,
  onSave,
  theme,
}: TabNotificacoesProps) {
  const [formData, setFormData] = useState<Partial<UserSettings>>({
    notification_hour: settings?.notification_hour ?? 9,
    whatsapp_number: settings?.whatsapp_number ?? '',
    receive_whatsapp: settings?.receive_whatsapp ?? false,
    receive_email: settings?.receive_email ?? true,
    critical_alerts_only: settings?.critical_alerts_only ?? false,
    timezone: settings?.timezone ?? 'America/Sao_Paulo',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(formData)
      toast.success('Preferências de notificações salvas!')
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.brightText }}>
          <Bell className="h-4 w-4" />
          Relatório Diário
        </h3>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notification_hour" style={{ color: theme.bodyText }}>
                Horário para Receber Relatório (24h)
              </Label>
              <Select
                value={String(formData.notification_hour ?? 9)}
                onValueChange={(val) => setFormData({ ...formData, notification_hour: parseInt(val) })}
              >
                <SelectTrigger
                  id="notification_hour"
                  style={{
                    backgroundColor: theme.filterBg,
                    borderColor: theme.cardBorder,
                    color: theme.bodyText,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {String(i).padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" style={{ color: theme.bodyText }}>
                Fuso Horário
              </Label>
              <Select
                value={formData.timezone || 'America/Sao_Paulo'}
                onValueChange={(val) => setFormData({ ...formData, timezone: val })}
              >
                <SelectTrigger
                  id="timezone"
                  style={{
                    backgroundColor: theme.filterBg,
                    borderColor: theme.cardBorder,
                    color: theme.bodyText,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES_BR.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.brightText }}>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.707 12.293a.999.999 0 00-1.414 0L13 15.586V6a1 1 0 10-2 0v9.586l-3.293-3.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l5-5a1 1 0 000-1.414z" />
          </svg>
          WhatsApp
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number" style={{ color: theme.bodyText }}>
              Número WhatsApp
            </Label>
            <Input
              id="whatsapp_number"
              placeholder="11999999999"
              value={formData.whatsapp_number || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              style={{
                backgroundColor: theme.filterBg,
                borderColor: theme.cardBorder,
                color: theme.bodyText,
              }}
            />
            <p style={{ color: theme.mutedText }} className="text-xs">
              Inclua o código do país (ex: 55 para Brasil)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded" style={{ backgroundColor: theme.filterBg }}>
            <div>
              <Label style={{ color: theme.brightText }} className="text-sm font-medium">
                Receber Relatórios Diários por WhatsApp
              </Label>
              <p style={{ color: theme.mutedText }} className="text-xs mt-1">
                Receba um resumo das menções do dia
              </p>
            </div>
            <Switch
              checked={formData.receive_whatsapp || false}
              onCheckedChange={(checked) => setFormData({ ...formData, receive_whatsapp: checked })}
            />
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.brightText }}>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          Email
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded" style={{ backgroundColor: theme.filterBg }}>
            <div>
              <Label style={{ color: theme.brightText }} className="text-sm font-medium">
                Receber Relatórios por Email
              </Label>
              <p style={{ color: theme.mutedText }} className="text-xs mt-1">
                Relatório diário enviado para seu email cadastrado
              </p>
            </div>
            <Switch
              checked={formData.receive_email || false}
              onCheckedChange={(checked) => setFormData({ ...formData, receive_email: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded" style={{ backgroundColor: theme.filterBg }}>
            <div>
              <Label style={{ color: theme.brightText }} className="text-sm font-medium">
                Apenas Alertas Críticos
              </Label>
              <p style={{ color: theme.mutedText }} className="text-xs mt-1">
                Receba notificações apenas para eventos importantes
              </p>
            </div>
            <Switch
              checked={formData.critical_alerts_only || false}
              onCheckedChange={(checked) => setFormData({ ...formData, critical_alerts_only: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: theme.accentText }}
          className="text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

interface TabAssinaturaProps {
  subscription: Subscription | null
  politiciansCount: number
  loading: boolean
  theme: typeof THEMES[ThemeKey]
}

function TabAssinatura({
  subscription,
  politiciansCount,
  loading,
  theme,
}: TabAssinaturaProps) {
  const currentPlan = subscription?.plan || 'trial'
  const planInfo = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]
  const maxPoliticians = planInfo?.maxPoliticians || 3

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div
        className="p-8 rounded-lg border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: theme.brightText }}>
              {planInfo?.name}
            </h2>
            <p style={{ color: theme.bodyText }}>
              {currentPlan === 'trial'
                ? 'Teste gratuito - Upgrade para desbloquear mais recursos'
                : `Plano ativo com limite de ${maxPoliticians} ${maxPoliticians === 1 ? 'político' : 'políticos'}`}
            </p>
          </div>
          <CreditCard className="h-8 w-8" style={{ color: theme.accentText }} />
        </div>

        {currentPlan === 'trial' && subscription?.trial_end_date && (
          <div
            className="p-4 rounded mb-6"
            style={{
              backgroundColor: theme.accentMuted,
            }}
          >
            <p style={{ color: theme.accentText }} className="font-medium">
              Teste termina em:{' '}
              {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold mb-3" style={{ color: theme.brightText }}>
            Recursos do Plano
          </h3>
          <ul className="space-y-2">
            {planInfo?.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Check className="h-4 w-4" style={{ color: theme.accentText }} />
                <span style={{ color: theme.bodyText }}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t mb-6" style={{ borderColor: theme.cardBorder }} />

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p style={{ color: theme.mutedText }} className="text-sm mb-2">
              Políticos Monitorados
            </p>
            <p className="text-3xl font-bold" style={{ color: theme.brightText }}>
              {politiciansCount}
            </p>
          </div>
          <div>
            <p style={{ color: theme.mutedText }} className="text-sm mb-2">
              Limite do Plano
            </p>
            <p className="text-3xl font-bold" style={{ color: theme.accentText }}>
              {maxPoliticians}
            </p>
          </div>
        </div>

        {politiciansCount >= maxPoliticians && currentPlan !== 'gabinete' && (
          <div
            className="p-4 rounded mb-6 border"
            style={{
              backgroundColor: theme.filterBg,
              borderColor: theme.accentMuted,
            }}
          >
            <p style={{ color: theme.bodyText }} className="text-sm">
              Você atingiu o limite de políticos. Faça upgrade para adicionar mais.
            </p>
          </div>
        )}

        {currentPlan !== 'gabinete' && (
          <Button
            style={{ backgroundColor: theme.accentText }}
            className="w-full text-white py-6 text-lg font-semibold"
          >
            Fazer Upgrade
          </Button>
        )}
      </div>

      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <h3 className="font-semibold mb-4" style={{ color: theme.brightText }}>
          Comparação de Planos
        </h3>
        <div className="space-y-3">
          {(Object.entries(SUBSCRIPTION_PLANS) as [keyof typeof SUBSCRIPTION_PLANS, typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]][]).map(
            ([key, plan]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded"
                style={{
                  backgroundColor:
                    currentPlan === key ? theme.filterBg : 'transparent',
                  borderLeft: currentPlan === key ? `3px solid ${theme.accentText}` : 'none',
                }}
              >
                <div>
                  <p className="font-medium" style={{ color: theme.brightText }}>
                    {plan.name}
                  </p>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Até {plan.maxPoliticians} {plan.maxPoliticians === 1 ? 'político' : 'políticos'}
                  </p>
                </div>
                {currentPlan === key && (
                  <Badge style={{ backgroundColor: theme.accentText }}>
                    Atual
                  </Badge>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}


// ============================================
// TAB TOPICOS - Topic/Keyword Monitoring
// ============================================

interface TabTopicosProps {
  theme: typeof THEMES[ThemeKey]
  userId: string | null
}

const SUGGESTED_TOPICS = [
  { label: 'Saúde Pública', keywords: ['saúde pública', 'SUS', 'hospital', 'UBS', 'vacina'] },
  { label: 'Educação', keywords: ['educação', 'escola', 'professor', 'ENEM', 'universidade'] },
  { label: 'Segurança', keywords: ['segurança pública', 'polícia', 'criminalidade', 'violência'] },
  { label: 'Economia', keywords: ['economia', 'PIB', 'inflação', 'emprego', 'salário mínimo'] },
  { label: 'Meio Ambiente', keywords: ['meio ambiente', 'desmatamento', 'clima', 'sustentabilidade'] },
  { label: 'Infraestrutura', keywords: ['infraestrutura', 'obras', 'saneamento', 'transporte'] },
  { label: 'Reforma Tributária', keywords: ['reforma tributária', 'impostos', 'IVA', 'tributação'] },
  { label: 'Eleições 2026', keywords: ['eleições 2026', 'candidato', 'pesquisa eleitoral', 'campanha'] },
]

function TabTopicos({ theme, userId }: TabTopicosProps) {
  const [topics, setTopics] = useState<{ id: string; name: string; keywords: string[]; isActive: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('monitored-topics')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicKeywords, setNewTopicKeywords] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const saveTopic = () => {
    if (!newTopicName.trim()) {
      toast.error('Digite um nome para o tópico')
      return
    }
    const keywords = newTopicKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
    
    if (keywords.length === 0) {
      toast.error('Adicione pelo menos uma palavra-chave')
      return
    }

    const newTopic = {
      id: Date.now().toString(),
      name: newTopicName.trim(),
      keywords,
      isActive: true,
    }
    const updated = [...topics, newTopic]
    setTopics(updated)
    localStorage.setItem('monitored-topics', JSON.stringify(updated))
    setNewTopicName('')
    setNewTopicKeywords('')
    setShowAddForm(false)
    toast.success(`Tópico "${newTopic.name}" adicionado!`)
  }

  const addSuggestedTopic = (suggestion: typeof SUGGESTED_TOPICS[0]) => {
    if (topics.find(t => t.name === suggestion.label)) {
      toast.info('Este tópico já foi adicionado')
      return
    }
    const newTopic = {
      id: Date.now().toString(),
      name: suggestion.label,
      keywords: suggestion.keywords,
      isActive: true,
    }
    const updated = [...topics, newTopic]
    setTopics(updated)
    localStorage.setItem('monitored-topics', JSON.stringify(updated))
    toast.success(`Tópico "${suggestion.label}" adicionado!`)
  }

  const toggleTopic = (id: string) => {
    const updated = topics.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    setTopics(updated)
    localStorage.setItem('monitored-topics', JSON.stringify(updated))
  }

  const deleteTopic = (id: string) => {
    const updated = topics.filter(t => t.id !== id)
    setTopics(updated)
    localStorage.setItem('monitored-topics', JSON.stringify(updated))
    toast.success('Tópico removido')
  }

  return (
    <div className="space-y-6">
      {/* Suggested Topics */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.brightText }}>
          <Search className="h-4 w-4" />
          Tópicos Sugeridos
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.mutedText }}>
          Clique para adicionar tópicos comuns ao seu monitoramento
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TOPICS.map((suggestion, i) => {
            const isAdded = topics.find(t => t.name === suggestion.label)
            return (
              <button
                key={i}
                onClick={() => addSuggestedTopic(suggestion)}
                disabled={!!isAdded}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                style={{
                  backgroundColor: isAdded ? theme.filterActive : theme.filterBg,
                  borderColor: isAdded ? theme.accentText : theme.cardBorder,
                  color: isAdded ? theme.accentText : theme.bodyText,
                  opacity: isAdded ? 0.7 : 1,
                  cursor: isAdded ? 'default' : 'pointer',
                }}
              >
                {isAdded ? <Check className="h-3 w-3 inline mr-1" /> : <Plus className="h-3 w-3 inline mr-1" />}
                {suggestion.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Topic Form */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.brightText }}>
            <Tag className="h-4 w-4" />
            Tópico Personalizado
          </h3>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)} style={{ backgroundColor: theme.accentText }} className="text-white">
              <Plus className="h-4 w-4 mr-1" /> Novo Tópico
            </Button>
          )}
        </div>

        {showAddForm && (
          <div className="space-y-4 p-4 rounded-lg border" style={{ backgroundColor: theme.filterBg, borderColor: theme.cardBorder }}>
            <div className="space-y-2">
              <Label style={{ color: theme.bodyText }}>Nome do Tópico</Label>
              <Input
                placeholder="Ex: Reforma da Previdência"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.bodyText }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: theme.bodyText }}>Palavras-chave (separadas por vírgula)</Label>
              <Input
                placeholder="Ex: previdência, aposentadoria, INSS, reforma"
                value={newTopicKeywords}
                onChange={(e) => setNewTopicKeywords(e.target.value)}
                style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.bodyText }}
              />
              <p className="text-xs" style={{ color: theme.mutedText }}>
                Separe múltiplas palavras-chave com vírgulas
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveTopic} style={{ backgroundColor: theme.accentText }} className="text-white">
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTopicName(''); setNewTopicKeywords('') }}
                style={{ color: theme.bodyText }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Active Topics List */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.brightText }}>
          <Hash className="h-4 w-4" />
          Meus Tópicos ({topics.length})
        </h3>

        {topics.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: theme.mutedText }} />
            <p style={{ color: theme.mutedText }}>Nenhum tópico adicionado. Selecione sugestões acima ou crie um personalizado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map(topic => (
              <div key={topic.id} className="p-4 rounded-lg border transition-all" style={{
                backgroundColor: topic.isActive ? theme.filterBg : 'transparent',
                borderColor: topic.isActive ? theme.cardHoverBorder : theme.cardBorder,
                opacity: topic.isActive ? 1 : 0.6,
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium" style={{ color: theme.brightText }}>{topic.name}</h4>
                    {topic.isActive ? (
                      <Badge style={{ backgroundColor: theme.accentMuted, color: theme.accentText }} className="text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" style={{ borderColor: theme.mutedText, color: theme.mutedText }} className="text-[10px]">Pausado</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={topic.isActive} onCheckedChange={() => toggleTopic(topic.id)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteTopic(topic.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topic.keywords.map((kw, ki) => (
                    <span key={ki} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: theme.accentMuted, color: theme.accentText }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Settings() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [politicians, setPoliticians] = useState<Politician[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPolitician, setEditingPolitician] = useState<Politician | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Theme
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  })
  const theme = THEMES[themeKey]

  // Check authentication
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }
      setUserId(session.user.id)
    }
    getUser()
  }, [navigate])

  // Load data
  useEffect(() => {
    if (!userId) return

    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch politicians
        const { data: politiciansData } = await supabase
          .from('politicians')
          .select('*')
          .order('created_at', { ascending: false })

        setPoliticians(politiciansData || [])

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        setSettings(settingsData)

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single()

        setSubscription(subscriptionData)
      } catch (error: any) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleDeletePolitician = async (id: string) => {
    try {
      const { error } = await supabase
        .from('politicians')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPoliticians(politicians.filter(p => p.id !== id))
      toast.success('Político removido')
    } catch (error: any) {
      toast.error('Erro ao remover', { description: error.message })
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('politicians')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      setPoliticians(
        politicians.map(p =>
          p.id === id ? { ...p, is_active: isActive } : p
        )
      )
      toast.success(isActive ? 'Monitoramento ativado' : 'Monitoramento pausado')
    } catch (error: any) {
      toast.error('Erro ao atualizar', { description: error.message })
    }
  }

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      if (!userId) throw new Error('User not found')

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...newSettings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSettings(prev =>
        prev
          ? { ...prev, ...newSettings }
          : ({
              user_id: userId,
              ...newSettings,
            } as UserSettings)
      )
    } catch (error: any) {
      throw error
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div
        className="flex-1 md:pl-16 min-h-screen p-4"
        style={{ background: theme.bgGradient }}
      >
        <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              style={{ color: theme.bodyText }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: theme.brightText }}>
                <SettingsIcon className="h-8 w-8" />
                Configurações
              </h1>
              <p style={{ color: theme.bodyText }} className="mt-1">
                Gerencie seus políticos, notificações e assinatura
              </p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: theme.filterBg }}>
              <Palette className="h-4 w-4" style={{ color: theme.accentText }} />
              {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => localStorage.setItem('dashboard-theme', key) || setThemeKey(key)}
                  className={`w-6 h-6 rounded-full transition-all ${THEMES[key].dot} ${
                    themeKey === key ? 'ring-2 ring-white ring-offset-2' : 'hover:scale-110'
                  }`}
                  title={THEMES[key].label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="politicos" className="space-y-6">
          <TabsList
            className="grid w-full grid-cols-4"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            }}
          >
            <TabsTrigger value="politicos" style={{ color: theme.bodyText }}>
              <User className="h-4 w-4 mr-2" />
              Meus Políticos
            </TabsTrigger>
            <TabsTrigger value="notificacoes" style={{ color: theme.bodyText }}>
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="assinatura" style={{ color: theme.bodyText }}>
              <CreditCard className="h-4 w-4 mr-2" />
              Assinatura
            </TabsTrigger>
            <TabsTrigger value="topicos" style={{ color: theme.bodyText }}>
              <Hash className="h-4 w-4 mr-2" />
              Tópicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="politicos">
            <TabMeusPoliticos
              politicians={politicians}
              loading={loading}
              onEdit={setEditingPolitician}
              onDelete={handleDeletePolitician}
              onToggleActive={handleToggleActive}
              theme={theme}
            />
          </TabsContent>

          <TabsContent value="notificacoes">
            <TabNotificacoes
              settings={settings}
              loading={loading}
              onSave={handleSaveSettings}
              theme={theme}
            />
          </TabsContent>

          <TabsContent value="assinatura">
            <TabAssinatura
              subscription={subscription}
              politiciansCount={politicians.length}
              loading={loading}
              theme={theme}
            />
          </TabsContent>

          <TabsContent value="topicos">
            <TabTopicos
              theme={theme}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog (placeholder for future enhancement) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Político</DialogTitle>
          </DialogHeader>
          <p style={{ color: theme.bodyText }}>
            Recurso de edição em construção. Use a página de adicionar para atualizar os dados.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowEditDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
