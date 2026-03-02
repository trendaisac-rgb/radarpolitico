/**
 * RadarPolítico - Gerenciamento de Equipe
 * Acesso multi-usuário com papéis (dono, admin, visualizador)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  AlertDialogTitle,
  AlertDialogFooter
} from '@/components/ui/alert-dialog'
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Crown,
  Trash2,
  Mail,
  ArrowLeft,
  Loader2,
  Palette,
  Copy,
  Check,
  Send
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// ============================================
// THEME COLORS (shared)
// ============================================

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const THEMES: Record<ThemeKey, {
  label: string; dot: string; bg: string; bgGradient: string; headerBg: string;
  headerBorder: string; cardBg: string; cardBorder: string; cardHoverBorder: string;
  accentText: string; accentMuted: string; filterBg: string; filterActive: string;
  mutedText: string; brightText: string; bodyText: string;
  chartGrid: string; tooltipBg: string; tooltipBorder: string;
}> = {
  azul: { label: 'Azul', dot: 'bg-[hsl(210,60%,45%)]', bg: 'hsl(215,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)', headerBg: 'hsl(215,25%,11%)', headerBorder: 'hsl(215,25%,18%)', cardBg: 'hsl(215,25%,12%)', cardBorder: 'hsl(215,25%,20%)', cardHoverBorder: 'hsl(215,25%,30%)', accentText: 'hsl(210,40%,60%)', accentMuted: 'hsl(210,40%,20%)', filterBg: 'hsl(215,25%,15%)', filterActive: 'hsl(215,25%,25%)', mutedText: 'hsl(215,15%,50%)', brightText: 'hsl(210,40%,98%)', bodyText: 'hsl(215,15%,65%)', chartGrid: 'hsl(215,25%,20%)', tooltipBg: 'hsl(215,25%,15%)', tooltipBorder: 'hsl(215,25%,25%)' },
  verde: { label: 'Verde', dot: 'bg-[hsl(152,55%,42%)]', bg: 'hsl(155,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(155,30%,8%) 0%, hsl(160,35%,12%) 50%, hsl(150,25%,10%) 100%)', headerBg: 'hsl(155,25%,11%)', headerBorder: 'hsl(155,25%,18%)', cardBg: 'hsl(155,25%,12%)', cardBorder: 'hsl(155,25%,20%)', cardHoverBorder: 'hsl(155,25%,30%)', accentText: 'hsl(152,45%,55%)', accentMuted: 'hsl(152,40%,20%)', filterBg: 'hsl(155,25%,15%)', filterActive: 'hsl(155,25%,25%)', mutedText: 'hsl(155,15%,50%)', brightText: 'hsl(150,40%,98%)', bodyText: 'hsl(155,15%,65%)', chartGrid: 'hsl(155,25%,20%)', tooltipBg: 'hsl(155,25%,15%)', tooltipBorder: 'hsl(155,25%,25%)' },
  vermelho: { label: 'Vermelho', dot: 'bg-[hsl(0,70%,50%)]', bg: 'hsl(0,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(0,30%,8%) 0%, hsl(5,35%,12%) 50%, hsl(355,25%,10%) 100%)', headerBg: 'hsl(0,25%,11%)', headerBorder: 'hsl(0,25%,18%)', cardBg: 'hsl(0,25%,12%)', cardBorder: 'hsl(0,25%,20%)', cardHoverBorder: 'hsl(0,25%,30%)', accentText: 'hsl(0,70%,55%)', accentMuted: 'hsl(0,40%,20%)', filterBg: 'hsl(0,25%,15%)', filterActive: 'hsl(0,25%,25%)', mutedText: 'hsl(0,15%,50%)', brightText: 'hsl(0,40%,98%)', bodyText: 'hsl(0,15%,65%)', chartGrid: 'hsl(0,25%,20%)', tooltipBg: 'hsl(0,25%,15%)', tooltipBorder: 'hsl(0,25%,25%)' },
  amarelo: { label: 'Amarelo', dot: 'bg-[hsl(45,95%,55%)]', bg: 'hsl(45,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(45,30%,8%) 0%, hsl(50,35%,12%) 50%, hsl(40,25%,10%) 100%)', headerBg: 'hsl(45,25%,11%)', headerBorder: 'hsl(45,25%,18%)', cardBg: 'hsl(45,25%,12%)', cardBorder: 'hsl(45,25%,20%)', cardHoverBorder: 'hsl(45,25%,30%)', accentText: 'hsl(45,95%,50%)', accentMuted: 'hsl(45,40%,20%)', filterBg: 'hsl(45,25%,15%)', filterActive: 'hsl(45,25%,25%)', mutedText: 'hsl(45,15%,50%)', brightText: 'hsl(45,40%,98%)', bodyText: 'hsl(45,15%,65%)', chartGrid: 'hsl(45,25%,20%)', tooltipBg: 'hsl(45,25%,15%)', tooltipBorder: 'hsl(45,25%,25%)' },
  roxo: { label: 'Roxo', dot: 'bg-[hsl(270,60%,50%)]', bg: 'hsl(270,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(270,30%,8%) 0%, hsl(275,35%,12%) 50%, hsl(265,25%,10%) 100%)', headerBg: 'hsl(270,25%,11%)', headerBorder: 'hsl(270,25%,18%)', cardBg: 'hsl(270,25%,12%)', cardBorder: 'hsl(270,25%,20%)', cardHoverBorder: 'hsl(270,25%,30%)', accentText: 'hsl(270,60%,55%)', accentMuted: 'hsl(270,40%,20%)', filterBg: 'hsl(270,25%,15%)', filterActive: 'hsl(270,25%,25%)', mutedText: 'hsl(270,15%,50%)', brightText: 'hsl(270,40%,98%)', bodyText: 'hsl(270,15%,65%)', chartGrid: 'hsl(270,25%,20%)', tooltipBg: 'hsl(270,25%,15%)', tooltipBorder: 'hsl(270,25%,25%)' },
  teal: { label: 'Teal', dot: 'bg-[hsl(180,60%,45%)]', bg: 'hsl(180,25%,9%)', bgGradient: 'linear-gradient(135deg, hsl(180,30%,8%) 0%, hsl(185,35%,12%) 50%, hsl(175,25%,10%) 100%)', headerBg: 'hsl(180,25%,11%)', headerBorder: 'hsl(180,25%,18%)', cardBg: 'hsl(180,25%,12%)', cardBorder: 'hsl(180,25%,20%)', cardHoverBorder: 'hsl(180,25%,30%)', accentText: 'hsl(180,50%,55%)', accentMuted: 'hsl(180,40%,20%)', filterBg: 'hsl(180,25%,15%)', filterActive: 'hsl(180,25%,25%)', mutedText: 'hsl(180,15%,50%)', brightText: 'hsl(180,40%,98%)', bodyText: 'hsl(180,15%,65%)', chartGrid: 'hsl(180,25%,20%)', tooltipBg: 'hsl(180,25%,15%)', tooltipBorder: 'hsl(180,25%,25%)' },
}

// ============================================
// TYPES
// ============================================

type TeamRole = 'owner' | 'admin' | 'viewer'

interface TeamMember {
  id: string
  email: string
  name: string
  role: TeamRole
  status: 'active' | 'pending'
  addedAt: string
  lastAccess?: string
}

const ROLE_CONFIG: Record<TeamRole, { label: string; description: string; icon: any; color: string }> = {
  owner: { label: 'Proprietário', description: 'Acesso total + gestão da conta', icon: Crown, color: 'hsl(43,96%,56%)' },
  admin: { label: 'Administrador', description: 'Editar políticos + ver todos os dados', icon: Shield, color: 'hsl(210,40%,60%)' },
  viewer: { label: 'Visualizador', description: 'Apenas visualizar dados e relatórios', icon: Eye, color: 'hsl(152,45%,55%)' },
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Team() {
  const navigate = useNavigate()
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  })
  const t = THEMES[themeKey]

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer')
  const [inviting, setInviting] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Team members from localStorage (in production, from DB)
  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('team-members')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)

      // Add current user as owner if empty
      if (members.length === 0) {
        const ownerMember: TeamMember = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'Proprietário',
          role: 'owner',
          status: 'active',
          addedAt: new Date().toISOString(),
          lastAccess: new Date().toISOString(),
        }
        setMembers([ownerMember])
        localStorage.setItem('team-members', JSON.stringify([ownerMember]))
      }
      setLoading(false)
    }
    checkAuth()
  }, [navigate])

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Digite um email válido')
      return
    }
    if (members.find(m => m.email === inviteEmail.trim())) {
      toast.error('Este email já faz parte da equipe')
      return
    }

    setInviting(true)
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail.trim(),
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'pending',
        addedAt: new Date().toISOString(),
      }
      const updated = [...members, newMember]
      setMembers(updated)
      localStorage.setItem('team-members', JSON.stringify(updated))
      setInviteEmail('')
      setInviteRole('viewer')
      setShowInviteDialog(false)
      setInviting(false)
      toast.success(`Convite enviado para ${newMember.email}`)
    }, 1500)
  }

  const handleRemove = (id: string) => {
    const member = members.find(m => m.id === id)
    if (member?.role === 'owner') {
      toast.error('Não é possível remover o proprietário')
      return
    }
    const updated = members.filter(m => m.id !== id)
    setMembers(updated)
    localStorage.setItem('team-members', JSON.stringify(updated))
    setRemoveId(null)
    toast.success('Membro removido da equipe')
  }

  const handleRoleChange = (id: string, newRole: TeamRole) => {
    const member = members.find(m => m.id === id)
    if (member?.role === 'owner') {
      toast.error('Não é possível alterar o papel do proprietário')
      return
    }
    const updated = members.map(m => m.id === id ? { ...m, role: newRole } : m)
    setMembers(updated)
    localStorage.setItem('team-members', JSON.stringify(updated))
    toast.success('Papel atualizado')
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/login?invite=team`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast.success('Link copiado!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgGradient }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: t.accentText }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ background: t.bgGradient }}>
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: t.bodyText }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: t.brightText }}>
                <Users className="h-8 w-8" />
                Equipe
              </h1>
              <p style={{ color: t.bodyText }} className="mt-1">
                Gerencie o acesso da sua assessoria ao monitoramento
              </p>
            </div>
          </div>

          <Button onClick={() => setShowInviteDialog(true)} style={{ backgroundColor: t.accentText }} className="text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold" style={{ color: t.brightText }}>{members.length}</p>
              <p className="text-sm mt-1" style={{ color: t.mutedText }}>Total Membros</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold" style={{ color: t.brightText }}>
                {members.filter(m => m.status === 'active').length}
              </p>
              <p className="text-sm mt-1" style={{ color: t.mutedText }}>Ativos</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold" style={{ color: 'hsl(43,96%,56%)' }}>
                {members.filter(m => m.status === 'pending').length}
              </p>
              <p className="text-sm mt-1" style={{ color: t.mutedText }}>Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite Link */}
        <Card className="mb-6" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: t.brightText }}>
              <Mail className="h-4 w-4" />
              Link de Convite
            </h3>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/login?invite=team`}
                style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}
              />
              <Button variant="outline" onClick={copyInviteLink}
                style={{ borderColor: t.cardBorder, color: t.bodyText }}>
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs mt-2" style={{ color: t.mutedText }}>
              Compartilhe este link para convidar membros com papel de Visualizador
            </p>
          </CardContent>
        </Card>

        {/* Roles Explanation */}
        <Card className="mb-6" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4" style={{ color: t.brightText }}>Papéis Disponíveis</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div key={key} className="p-4 rounded-lg border" style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" style={{ color: config.color }} />
                      <span className="font-medium" style={{ color: t.brightText }}>{config.label}</span>
                    </div>
                    <p className="text-xs" style={{ color: t.mutedText }}>{config.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: t.brightText }}>
              <Users className="h-4 w-4" />
              Membros da Equipe ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map(member => {
                const roleConfig = ROLE_CONFIG[member.role]
                const RoleIcon = roleConfig.icon
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border transition-all"
                    style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: t.accentMuted, color: t.accentText }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: t.brightText }}>{member.name}</span>
                          {member.status === 'pending' && (
                            <Badge variant="outline" style={{ borderColor: 'hsl(43,96%,56%)', color: 'hsl(43,96%,56%)' }}
                              className="text-[10px]">Pendente</Badge>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: t.mutedText }}>{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" style={{ color: roleConfig.color }} />
                        {member.role === 'owner' ? (
                          <span className="text-sm font-medium" style={{ color: roleConfig.color }}>{roleConfig.label}</span>
                        ) : (
                          <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val as TeamRole)}>
                            <SelectTrigger className="w-36 h-8 text-xs"
                              style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, color: t.bodyText }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {member.role !== 'owner' && (
                        <Button variant="ghost" size="sm" onClick={() => setRemoveId(member.id)}
                          className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <DialogHeader>
            <DialogTitle style={{ color: t.brightText }}>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label style={{ color: t.bodyText }}>Email</Label>
              <Input
                placeholder="assessor@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: t.bodyText }}>Papel</Label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as TeamRole)}>
                <SelectTrigger style={{ backgroundColor: t.filterBg, borderColor: t.cardBorder, color: t.bodyText }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador - Editar + visualizar</SelectItem>
                  <SelectItem value="viewer">Visualizador - Apenas visualizar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)} style={{ color: t.bodyText }}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={inviting} style={{ backgroundColor: t.accentText }} className="text-white">
              {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={removeId !== null} onOpenChange={(open) => !open && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Este membro perderá acesso ao monitoramento. Você pode convidá-lo novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeId && handleRemove(removeId)} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
