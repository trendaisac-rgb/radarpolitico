/**
 * RadarPolítico - Cadastro de Político
 * Formulário para adicionar político ao monitoramento
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UserPlus, Loader2, Search, Ban, Info } from 'lucide-react'
import { supabase, type PoliticianInsert } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const PARTIDOS = [
  'AVANTE', 'CIDADANIA', 'MDB', 'NOVO', 'PCdoB', 'PDT', 'PL',
  'PODEMOS', 'PP', 'PSB', 'PSD', 'PSDB', 'PSOL', 'PT', 'PV',
  'REDE', 'REPUBLICANOS', 'UNIÃO'
]

export default function AddPolitician() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)

  // Verifica autenticação e pega user_id
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

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    party: '',
    position: '',
    state: '',
    city: '',
    whatsapp: '',
    email: '',
    searchTerms: '', // Termos de busca (separados por vírgula)
    excludeTerms: '' // Termos de exclusão (separados por vírgula)
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setIsSubmitting(true)

    try {
      if (!userId) {
        toast.error('Você precisa estar logado')
        navigate('/login')
        return
      }

      // Processa termos de busca e exclusão
      // Termos normais são incluídos, termos com prefixo "-" são exclusões
      const parseTerms = (text: string): string[] => {
        if (!text.trim()) return []
        return text.split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0)
      }

      const searchTerms = parseTerms(formData.searchTerms)
      const excludeTerms = parseTerms(formData.excludeTerms).map(t => `-${t}`) // Prefixo - para exclusão

      // Combina ambos os arrays no campo keywords
      const allKeywords = [...searchTerms, ...excludeTerms]

      const newPolitician: PoliticianInsert = {
        user_id: userId,
        name: formData.name.trim(),
        nickname: formData.nickname.trim() || null,
        party: formData.party || null,
        position: formData.position.trim() || null,
        state: formData.state || null,
        city: formData.city.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim() || null,
        keywords: allKeywords.length > 0 ? allKeywords : null,
        is_active: true,
        notify_whatsapp: true,
        notify_email: true
      }
      
      const { error } = await supabase
        .from('politicians')
        .insert(newPolitician)

      if (error) throw error

      toast.success('Político cadastrado!', {
        description: `${formData.name} adicionado ao monitoramento`
      })
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error('Erro ao cadastrar', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Político
            </CardTitle>
            <CardDescription>
              Adicione um político para monitorar notícias e menções automaticamente
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido Político</Label>
                  <Input
                    id="nickname"
                    placeholder="Ex: Joãozinho"
                    value={formData.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Partido</Label>
                  <Select value={formData.party} onValueChange={(v) => handleChange('party', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PARTIDOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    placeholder="Ex: Deputado Federal"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.state} onValueChange={(v) => handleChange('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
              </div>

              {/* Termos de Monitoramento - IMPORTANTE para precisão */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Termos de Monitoramento</h3>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Configure termos personalizados para melhorar a precisão do monitoramento.
                      Por padrão, buscamos pelo nome e apelido cadastrados.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchTerms" className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-green-500" />
                      Termos Adicionais de Busca
                    </Label>
                    <Textarea
                      id="searchTerms"
                      placeholder="Ex: Bolsominion, Mito, Capitão (separados por vírgula)"
                      value={formData.searchTerms}
                      onChange={(e) => handleChange('searchTerms', e.target.value)}
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Apelidos, hashtags ou variações do nome que devem ser incluídos na busca
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excludeTerms" className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-500" />
                      Termos de Exclusão
                    </Label>
                    <Textarea
                      id="excludeTerms"
                      placeholder="Ex: futebol, novela, BBB, show, jogador (separados por vírgula)"
                      value={formData.excludeTerms}
                      onChange={(e) => handleChange('excludeTerms', e.target.value)}
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Termos que indicam conteúdo irrelevante (homônimos, esportes, entretenimento)
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Contatos (opcional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="11999999999"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@exemplo.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-2" />Cadastrar</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
