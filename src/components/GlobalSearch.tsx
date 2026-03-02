import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight, LayoutDashboard, Users, Bell, Gavel, PieChart, ShieldAlert, Settings, Code2, UserPlus, FlaskConical } from 'lucide-react'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const themeColors: Record<ThemeKey, { bg: string; border: string; text: string; muted: string; active: string }> = {
  azul: { bg: 'hsl(215,25%,12%)', border: 'hsl(215,25%,22%)', text: 'hsl(210,40%,98%)', muted: 'hsl(215,15%,50%)', active: 'hsl(210,40%,20%)' },
  verde: { bg: 'hsl(155,25%,12%)', border: 'hsl(155,25%,22%)', text: 'hsl(150,40%,98%)', muted: 'hsl(155,15%,50%)', active: 'hsl(152,40%,20%)' },
  vermelho: { bg: 'hsl(0,20%,12%)', border: 'hsl(0,20%,22%)', text: 'hsl(0,30%,98%)', muted: 'hsl(0,12%,50%)', active: 'hsl(0,40%,20%)' },
  amarelo: { bg: 'hsl(40,20%,12%)', border: 'hsl(40,20%,22%)', text: 'hsl(40,30%,98%)', muted: 'hsl(40,12%,50%)', active: 'hsl(43,50%,20%)' },
  roxo: { bg: 'hsl(270,20%,12%)', border: 'hsl(270,20%,22%)', text: 'hsl(270,30%,98%)', muted: 'hsl(270,12%,50%)', active: 'hsl(263,40%,20%)' },
  teal: { bg: 'hsl(175,25%,12%)', border: 'hsl(175,25%,22%)', text: 'hsl(175,30%,98%)', muted: 'hsl(175,15%,50%)', active: 'hsl(175,40%,20%)' },
}

const searchItems = [
  { path: '/dashboard', label: 'Dashboard Principal', description: 'Score, menções, análise de sentimento', icon: LayoutDashboard, keywords: 'dashboard home inicio principal score' },
  { path: '/competitors', label: 'Competidores', description: 'Análise comparativa entre políticos', icon: Users, keywords: 'comparar adversário oponente rival' },
  { path: '/alerts', label: 'Alertas', description: 'Configurar notificações e gatilhos', icon: Bell, keywords: 'notificação aviso urgente alerta' },
  { path: '/legislativo', label: 'Legislativo', description: 'Votações, proposições, Câmara e Senado', icon: Gavel, keywords: 'votação câmara senado proposição lei' },
  { path: '/demographics', label: 'Demografia', description: 'Idade, gênero, classe social, regiões', icon: PieChart, keywords: 'idade genero classe social regiao perfil' },
  { path: '/message-test', label: 'Teste de Mensagem', description: 'Simular reação a mensagens antes de publicar', icon: FlaskConical, keywords: 'simular testar mensagem post publicação' },
  { path: '/hate-speech', label: 'Discurso de Ódio', description: 'Monitorar ataques e denúncias', icon: ShieldAlert, keywords: 'odio ataque ofensa racismo denúncia' },
  { path: '/team', label: 'Equipe', description: 'Gerenciar membros e permissões', icon: UserPlus, keywords: 'equipe time membro convite permissão' },
  { path: '/settings', label: 'Configurações', description: 'Políticos, notificações, assinatura, temas', icon: Settings, keywords: 'configurar tema notificação assinatura plano' },
  { path: '/api-docs', label: 'API Docs', description: 'Documentação da API REST', icon: Code2, keywords: 'api documentação endpoint rest webhook' },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const themeKey = (localStorage.getItem('dashboard-theme') as ThemeKey) || 'azul'
  const t = themeColors[themeKey]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const filtered = query.trim()
    ? searchItems.filter(item =>
        (item.label + ' ' + item.description + ' ' + item.keywords)
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : searchItems

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
          <Search className="h-5 w-5 flex-shrink-0" style={{ color: t.muted }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar seções, funcionalidades..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: t.text }}
          />
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: t.active, color: t.muted }}>ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: t.muted }}>
              Nenhum resultado encontrado
            </p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: i === selectedIndex ? t.active : 'transparent',
                    color: t.text
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: t.muted }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs truncate" style={{ color: t.muted }}>{item.description}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: t.muted }} />
                </button>
              )
            })
          )}
        </div>
        <div className="px-4 py-2 flex items-center gap-4 text-[10px]" style={{ borderTop: `1px solid ${t.border}`, color: t.muted }}>
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc fechar</span>
        </div>
      </div>
    </div>
  )
}
