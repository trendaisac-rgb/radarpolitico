import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3, Users, Bell, Settings, Gavel, PieChart,
  MessageSquare, ShieldAlert, Code2, UserPlus, ChevronLeft, ChevronRight,
  LayoutDashboard, Menu, X, FlaskConical, BookOpen
} from 'lucide-react'

type ThemeKey = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'teal'

const themeStyles: Record<ThemeKey, { bg: string; border: string; text: string; muted: string; active: string; hover: string }> = {
  azul: { bg: 'hsl(215,25%,10%)', border: 'hsl(215,25%,18%)', text: 'hsl(210,40%,98%)', muted: 'hsl(215,15%,50%)', active: 'hsl(210,40%,20%)', hover: 'hsl(215,25%,15%)' },
  verde: { bg: 'hsl(155,25%,10%)', border: 'hsl(155,25%,18%)', text: 'hsl(150,40%,98%)', muted: 'hsl(155,15%,50%)', active: 'hsl(152,40%,20%)', hover: 'hsl(155,25%,15%)' },
  vermelho: { bg: 'hsl(0,20%,10%)', border: 'hsl(0,20%,18%)', text: 'hsl(0,30%,98%)', muted: 'hsl(0,12%,50%)', active: 'hsl(0,40%,20%)', hover: 'hsl(0,20%,15%)' },
  amarelo: { bg: 'hsl(40,20%,10%)', border: 'hsl(40,20%,18%)', text: 'hsl(40,30%,98%)', muted: 'hsl(40,12%,50%)', active: 'hsl(43,50%,20%)', hover: 'hsl(40,20%,15%)' },
  roxo: { bg: 'hsl(270,20%,10%)', border: 'hsl(270,20%,18%)', text: 'hsl(270,30%,98%)', muted: 'hsl(270,12%,50%)', active: 'hsl(263,40%,20%)', hover: 'hsl(270,20%,15%)' },
  teal: { bg: 'hsl(175,25%,10%)', border: 'hsl(175,25%,18%)', text: 'hsl(175,30%,98%)', muted: 'hsl(175,15%,50%)', active: 'hsl(175,40%,20%)', hover: 'hsl(175,25%,15%)' },
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Principal' },
  { path: '/competitors', label: 'Competidores', icon: Users, group: 'Principal' },
  { path: '/alerts', label: 'Alertas', icon: Bell, group: 'Principal' },
  { path: '/legislativo', label: 'Legislativo', icon: Gavel, group: 'Análise' },
  { path: '/demographics', label: 'Demografia', icon: PieChart, group: 'Análise' },
  { path: '/message-test', label: 'Teste de Mensagem', icon: FlaskConical, group: 'Análise' },
  { path: '/hate-speech', label: 'Discurso de Ódio', icon: ShieldAlert, group: 'Proteção' },
  { path: '/team', label: 'Equipe', icon: UserPlus, group: 'Gestão' },
  { path: '/settings', label: 'Configurações', icon: Settings, group: 'Gestão' },
  { path: '/api-docs', label: 'API Docs', icon: Code2, group: 'Gestão' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const stored = localStorage.getItem('dashboard-theme') as ThemeKey
    return stored && themeStyles[stored] ? stored : 'azul'
  })
  const t = themeStyles[themeKey]

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  // Listen for theme changes from other components
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('dashboard-theme') as ThemeKey
      if (stored && stored !== themeKey && themeStyles[stored]) {
        setThemeKey(stored)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [themeKey])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const groups = [...new Set(navItems.map(i => i.group))]

  const renderNav = (isMobile: boolean) => (
    <nav className="flex-1 overflow-y-auto py-4">
      {groups.map(group => (
        <div key={group} className="mb-4">
          {!collapsed && (
            <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>
              {group}
            </p>
          )}
          {navItems.filter(i => i.group === group).map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${collapsed && !isMobile ? 'justify-center' : ''}`}
                style={{
                  backgroundColor: isActive ? t.active : 'transparent',
                  color: isActive ? t.text : t.muted,
                  borderLeft: isActive ? `3px solid ${t.text}` : '3px solid transparent',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {(!collapsed || isMobile) && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-[60] p-2 rounded-lg md:hidden"
        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] md:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-64 h-full flex flex-col"
            style={{ backgroundColor: t.bg, borderRight: `1px solid ${t.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <span className="font-bold text-sm" style={{ color: t.text }}>RadarPolítico</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ color: t.muted }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
        style={{ backgroundColor: t.bg, borderRight: `1px solid ${t.border}` }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <span className="font-bold text-sm" style={{ color: t.text }}>RadarPolítico</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded transition-colors"
            style={{ color: t.muted }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {renderNav(false)}
        {!collapsed && (
          <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-[10px]" style={{ color: t.muted }}>
              <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: t.active }}>⌘K</kbd> buscar
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
