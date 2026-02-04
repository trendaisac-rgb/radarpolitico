/**
 * RadarPolítico - Cadastro de Político
 * Formulário para adicionar político ao monitoramento
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { useCreatePolitician } from '@/hooks/usePoliticians'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const PARTIDOS = [
  'MDB', 'PT', 'PSDB', 'PP', 'PDT', 'PTB', 'DEM', 'PL', 'PSB',
  'REPUBLICANOS', 'PSC', 'PCdoB', 'PSD', 'CIDADANIA', 'PV',
  'AVANTE', 'PATRIOTA', 'PODEMOS', 'NOVO', 'REDE', 'PSOL', 'UNIÃO'
]

export default function AddPolitician() {
  const navigate = useNavigate()
  const createPolitician = useCreatePolitician()

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    party: '',
    position: '',
    state: '',
    city: '',
    whatsapp: '',
    email: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Nome é obrigatório')
      return
    }

    setIsSubmitting(true)

    try {
      // Pega o usuário atual (ou cria um temporário para demo)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Para demo, vamos criar sem user_id por enquanto
        // Em produção, redirecionar para login
        toast.error('Você precisa estar logado para cadastrar políticos')
        return
      }

      await createPolitician.mutateAsync({
        user_id: user.id,
        name: formData.name,
        nickname: formData.nickname || null,
        party: formData.party || null,
        position: formData.position || null,
        state: formData.state || null,
        city: formData.city || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        is_active: true,
        notify_whatsapp: true,
        notify_email: true
      })

      toast.success('Político cadastrado com sucesso!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      toast.error('Erro ao cadastrar político')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Político
            </CardTitle>
            <CardDescription>
              Adicione um político para iniciar o monitoramento de mídia
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados básicos */}
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
                  <p className="text-xs text-muted-foreground">
                    Como é conhecido na mídia
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party">Partido</Label>
                  <Select
                    value={formData.party}
                    onValueChange={(value) => handleChange('party', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o partido" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTIDOS.map(partido => (
                        <SelectItem key={partido} value={partido}>
                          {partido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo Atual</Label>
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
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleChange('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(estado => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
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

              {/* Contatos para notificação */}
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Contatos para Notificação</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="Ex: 11999999999"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Para envio de relatórios diários
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ex: contato@exemplo.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Político
                    </>
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
