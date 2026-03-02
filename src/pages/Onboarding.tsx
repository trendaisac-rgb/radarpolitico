/**
 * RadarPolítico - Onboarding Wizard
 * Setup interativo persona-based para novos usuários
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  ArrowRight, ArrowLeft, Check, Loader2, User, Bell,
  Briefcase, MapPin, Shield, Sparkles, Rocket, ChevronRight
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo!', icon: Sparkles },
  { id: 'profile', title: 'Seu Perfil', icon: User },
  { id: 'politician', title: 'Político', icon: Briefcase },
  { id: 'alerts', title: 'Alertas', icon: Bell },
  { id: 'done', title: 'Pronto!', icon: Rocket },
]

const CARGO_OPTIONS = [
  { value: 'vereador', label: 'Vereador(a)' },
  { value: 'prefeito', label: 'Prefeito(a)' },
  { value: 'deputado_estadual', label: 'Deputado(a) Estadual' },
  { value: 'deputado_federal', label: 'Deputado(a) Federal' },
  { value: 'senador', label: 'Senador(a)' },
  { value: 'governador', label: 'Governador(a)' },
  { value: 'assessor', label: 'Assessor(a) / Consultor(a)' },
  { value: 'jornalista', label: 'Jornalista / Analista' },
  { value: 'lideranca', label: 'Liderança Partidária' },
]

const PERSONA_TYPES = [
  { id: 'novato', label: 'Primeiro Mandato', desc: 'Nunca usei ferramentas de monitoramento', icon: '🌱', recommended: ['simple_view', 'whatsapp', 'daily_report'] },
  { id: 'experiente', label: 'Mandato Atual', desc: 'Já monitoro minha presença digital', icon: '⭐', recommended: ['pro_view', 'alerts', 'competitor'] },
  { id: 'assessor', label: 'Assessoria / Consultoria', desc: 'Gerencio a imagem de político(s)', icon: '🎯', recommended: ['pro_view', 'team', 'legislativo'] },
  { id: 'analista', label: 'Análise / Jornalismo', desc: 'Preciso de dados e tendências', icon: '📊', recommended: ['pro_view', 'demographics', 'api'] },
]

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form data
  const [persona, setPersona] = useState('')
  const [cargo, setCargo] = useState('')
  const [politicianName, setPoliticianName] = useState('')
  const [party, setParty] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [keywords, setKeywords] = useState('')
  const [alertEmail, setAlertEmail] = useState(true)
  const [alertWhatsapp, setAlertWhatsapp] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUserId(session.user.id)
    }
    check()
  }, [navigate])

  const handleFinish = async () => {
    if (!userId || !politicianName.trim()) {
      toast.error('Preencha o nome do político')
      return
    }
    setLoading(true)
    try {
      // Create politician
      const kws = keywords.split(',').map(k => k.trim()).filter(k => k)
      const { error: polError } = await supabase.from('politicians').insert({
        user_id: userId,
        name: politicianName.trim(),
        party: party || null,
        state: state || null,
        city: city || null,
        position: cargo || null,
        keywords: kws.length > 0 ? kws : [politicianName.trim()],
        is_active: true,
      })
      if (polError) throw polError

      // Save settings
      await supabase.from('user_settings').upsert({
        user_id: userId,
        receive_email: alertEmail,
        receive_whatsapp: alertWhatsapp,
        whatsapp_number: whatsappNumber || null,
        notification_hour: 9,
        timezone: 'America/Sao_Paulo',
        updated_at: new Date().toISOString(),
      })

      // Mark onboarding complete
      localStorage.setItem('onboarding-complete', 'true')
      localStorage.setItem('user-persona', persona)

      // Set view mode based on persona
      const selectedPersona = PERSONA_TYPES.find(p => p.id === persona)
      if (selectedPersona?.recommended.includes('simple_view')) {
        localStorage.setItem('view-mode', 'simple')
      } else {
        localStorage.setItem('view-mode', 'pro')
      }

      toast.success('Tudo pronto! Redirecionando para o dashboard...')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const canAdvance = () => {
    if (step === 1 && !persona) return false
    if (step === 2 && !politicianName.trim()) return false
    return true
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, hsl(215,30%,8%) 0%, hsl(220,35%,12%) 50%, hsl(210,25%,10%) 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? 'bg-[hsl(152,55%,50%)] text-white' :
                    i === step ? 'bg-[hsl(210,40%,60%)] text-white ring-4 ring-[hsl(210,40%,20%)]' :
                    'bg-[hsl(215,25%,20%)] text-[hsl(215,15%,50%)]'
                  }`}>
                    {i < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-12 sm:w-20 h-1 mx-1 rounded" style={{
                      backgroundColor: i < step ? 'hsl(152,55%,50%)' : 'hsl(215,25%,20%)'
                    }} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'hsl(215,15%,50%)' }}>
            {STEPS.map(s => <span key={s.id}>{s.title}</span>)}
          </div>
        </div>

        <Card style={{ backgroundColor: 'hsl(215,25%,12%)', borderColor: 'hsl(215,25%,20%)' }}>
          <CardContent className="p-8">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="text-6xl">🏛️</div>
                <h1 className="text-3xl font-bold" style={{ color: 'hsl(210,40%,98%)' }}>
                  Bem-vindo ao RadarPolítico
                </h1>
                <p className="text-lg max-w-md mx-auto" style={{ color: 'hsl(215,15%,65%)' }}>
                  Vamos configurar seu monitoramento em menos de 2 minutos. Você vai ter visibilidade total da sua presença digital.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto pt-4">
                  {[
                    { emoji: '📊', label: 'Sentimento' },
                    { emoji: '🚨', label: 'Alertas' },
                    { emoji: '🧠', label: 'IA Análise' },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'hsl(215,25%,15%)' }}>
                      <div className="text-2xl mb-1">{f.emoji}</div>
                      <div className="text-xs" style={{ color: 'hsl(215,15%,65%)' }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Profile / Persona */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(210,40%,98%)' }}>
                    Qual é o seu perfil?
                  </h2>
                  <p style={{ color: 'hsl(215,15%,65%)' }}>
                    Isso nos ajuda a configurar a melhor experiência para você
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PERSONA_TYPES.map(p => (
                    <button key={p.id} onClick={() => setPersona(p.id)}
                      className="p-5 rounded-xl border-2 text-left transition-all"
                      style={{
                        backgroundColor: persona === p.id ? 'hsl(210,40%,15%)' : 'hsl(215,25%,15%)',
                        borderColor: persona === p.id ? 'hsl(210,40%,60%)' : 'hsl(215,25%,25%)',
                      }}>
                      <div className="text-3xl mb-2">{p.icon}</div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: 'hsl(210,40%,98%)' }}>{p.label}</h3>
                      <p className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Politician Setup */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(210,40%,98%)' }}>
                    {persona === 'assessor' ? 'Quem você monitora?' : persona === 'analista' ? 'Qual político acompanhar?' : 'Seus dados'}
                  </h2>
                  <p style={{ color: 'hsl(215,15%,65%)' }}>
                    Cadastre o primeiro político para monitoramento
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: 'hsl(215,15%,65%)' }}>Nome Completo *</Label>
                    <Input value={politicianName} onChange={e => setPoliticianName(e.target.value)}
                      placeholder="Ex: João Silva" className="mt-1"
                      style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(210,40%,98%)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label style={{ color: 'hsl(215,15%,65%)' }}>Cargo</Label>
                      <Select value={cargo} onValueChange={setCargo}>
                        <SelectTrigger className="mt-1" style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(215,15%,65%)' }}>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {CARGO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: 'hsl(215,15%,65%)' }}>Partido</Label>
                      <Input value={party} onChange={e => setParty(e.target.value)}
                        placeholder="Ex: PT, MDB..." className="mt-1"
                        style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(210,40%,98%)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label style={{ color: 'hsl(215,15%,65%)' }}>Estado</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="mt-1" style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(215,15%,65%)' }}>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: 'hsl(215,15%,65%)' }}>Cidade</Label>
                      <Input value={city} onChange={e => setCity(e.target.value)}
                        placeholder="Ex: São Paulo" className="mt-1"
                        style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(210,40%,98%)' }} />
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: 'hsl(215,15%,65%)' }}>Termos adicionais de busca (opcional)</Label>
                    <Input value={keywords} onChange={e => setKeywords(e.target.value)}
                      placeholder="Ex: reforma, educação, saúde (separados por vírgula)" className="mt-1"
                      style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(210,40%,98%)' }} />
                    <p className="text-xs mt-1" style={{ color: 'hsl(215,15%,40%)' }}>Monitoramos automaticamente o nome completo</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Alerts Config */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(210,40%,98%)' }}>
                    Como quer receber alertas?
                  </h2>
                  <p style={{ color: 'hsl(215,15%,65%)' }}>
                    Configure suas notificações de crise e relatórios
                  </p>
                </div>
                <div className="space-y-4">
                  <button onClick={() => setAlertEmail(!alertEmail)}
                    className="w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: alertEmail ? 'hsl(210,40%,15%)' : 'hsl(215,25%,15%)',
                      borderColor: alertEmail ? 'hsl(210,40%,60%)' : 'hsl(215,25%,25%)',
                    }}>
                    <div className="text-3xl">📧</div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: 'hsl(210,40%,98%)' }}>Email</h3>
                      <p className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>Relatório diário às 9h no seu email</p>
                    </div>
                    {alertEmail && <Check className="h-6 w-6 text-[hsl(152,55%,50%)]" />}
                  </button>

                  <button onClick={() => setAlertWhatsapp(!alertWhatsapp)}
                    className="w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: alertWhatsapp ? 'hsl(152,30%,15%)' : 'hsl(215,25%,15%)',
                      borderColor: alertWhatsapp ? 'hsl(152,55%,50%)' : 'hsl(215,25%,25%)',
                    }}>
                    <div className="text-3xl">💬</div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: 'hsl(210,40%,98%)' }}>WhatsApp</h3>
                      <p className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>Alertas de crise em tempo real no WhatsApp</p>
                    </div>
                    {alertWhatsapp && <Check className="h-6 w-6 text-[hsl(152,55%,50%)]" />}
                  </button>

                  {alertWhatsapp && (
                    <div className="pl-16">
                      <Label style={{ color: 'hsl(215,15%,65%)' }}>Número WhatsApp</Label>
                      <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
                        placeholder="5511999999999" className="mt-1"
                        style={{ backgroundColor: 'hsl(215,25%,15%)', borderColor: 'hsl(215,25%,25%)', color: 'hsl(210,40%,98%)' }} />
                    </div>
                  )}

                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(210,40%,12%)', borderLeft: '3px solid hsl(210,40%,60%)' }}>
                    <p className="text-sm" style={{ color: 'hsl(215,15%,65%)' }}>
                      💡 <strong style={{ color: 'hsl(210,40%,98%)' }}>Dica:</strong> Recomendamos ativar pelo menos um canal de alerta para não perder crises importantes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="text-7xl">🎉</div>
                <h2 className="text-3xl font-bold" style={{ color: 'hsl(210,40%,98%)' }}>
                  Tudo configurado!
                </h2>
                <p className="text-lg" style={{ color: 'hsl(215,15%,65%)' }}>
                  Seu monitoramento de <strong style={{ color: 'hsl(210,40%,60%)' }}>{politicianName || 'político'}</strong> está pronto.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {[
                    { label: 'Monitoramento ativo', icon: '✅' },
                    { label: alertEmail ? 'Email configurado' : 'Email desativado', icon: alertEmail ? '📧' : '❌' },
                    { label: alertWhatsapp ? 'WhatsApp ativo' : 'WhatsApp desativado', icon: alertWhatsapp ? '💬' : '❌' },
                    { label: 'IA de análise pronta', icon: '🧠' },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'hsl(215,25%,15%)' }}>
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-xs" style={{ color: 'hsl(215,15%,65%)' }}>{f.label}</div>
                    </div>
                  ))}
                </div>
                {persona && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(152,30%,12%)', border: '1px solid hsl(152,55%,30%)' }}>
                    <p className="text-sm" style={{ color: 'hsl(152,55%,70%)' }}>
                      🎯 Configuramos a vista <strong>{persona === 'novato' ? 'Simplificada' : 'Profissional'}</strong> baseado no seu perfil. Você pode mudar depois no Dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'hsl(215,25%,20%)' }}>
              <Button variant="ghost" onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0} style={{ color: 'hsl(215,15%,65%)' }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {step < 4 ? (
                <Button onClick={() => canAdvance() && setStep(step + 1)}
                  disabled={!canAdvance()}
                  className="text-white px-8"
                  style={{ backgroundColor: canAdvance() ? 'hsl(210,40%,60%)' : 'hsl(215,25%,25%)' }}>
                  {step === 0 ? 'Começar' : 'Próximo'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={loading}
                  className="text-white px-8"
                  style={{ backgroundColor: 'hsl(152,55%,45%)' }}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  Ir para o Dashboard
                </Button>
              )}
            </div>

            {/* Skip */}
            {step < 4 && step > 0 && (
              <div className="text-center mt-4">
                <button onClick={() => { localStorage.setItem('onboarding-complete', 'true'); navigate('/dashboard') }}
                  className="text-xs underline" style={{ color: 'hsl(215,15%,40%)' }}>
                  Pular configuração
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
