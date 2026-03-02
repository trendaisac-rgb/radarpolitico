/**
 * RadarPolítico - Página de Login
 * Autenticação com Supabase (email/senha)
 * Inclui: Login, Cadastro, Esqueci Senha
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Loader2, Mail, Lock, User, ArrowLeft, KeyRound } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  // Verifica se já está logado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/dashboard')
      }
      setCheckingAuth(false)
    }
    checkAuth()

    // Listen for auth state changes (handles email confirmation redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Login com email/senha
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      })

      if (error) {
        // Handle specific error messages in Portuguese
        if (error.message?.includes('Invalid login')) {
          toast.error('Email ou senha incorretos')
        } else if (error.message?.includes('Email not confirmed')) {
          // Try to auto-sign in anyway - if Supabase has autoconfirm disabled
          toast.error('Email não confirmado. Verifique sua caixa de entrada ou tente criar a conta novamente.')
        } else if (error.message?.includes('rate limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos.')
        } else {
          toast.error('Erro ao fazer login. Verifique email e senha.')
        }
        return
      }

      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('Erro ao conectar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Cadastro — com auto-login se o Supabase retornar sessão
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (registerPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerName
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      })

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.')
          setActiveTab('login')
          setLoginEmail(registerEmail)
        } else if (error.message?.includes('rate limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos.')
        } else if (error.message?.includes('password')) {
          toast.error('Senha muito fraca. Use letras, números e caracteres especiais.')
        } else {
          toast.error('Erro ao cadastrar: ' + error.message)
        }
        return
      }

      // If we got a session back, auto-confirm is enabled - go directly to dashboard
      if (data.session) {
        toast.success('Conta criada com sucesso! Bem-vindo!')
        navigate('/onboarding')
        return
      }

      // If we got a user but no session, email confirmation is required
      if (data.user && !data.session) {
        // Check if the user's email is already confirmed (some Supabase configs)
        if (data.user.confirmed_at || data.user.email_confirmed_at) {
          // User is confirmed, try to sign in directly
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: registerEmail,
            password: registerPassword
          })
          if (signInData?.session) {
            toast.success('Conta criada com sucesso!')
            navigate('/onboarding')
            return
          }
        }

        // Email confirmation required - show friendly message
        toast.success(
          'Conta criada! Verifique seu email para ativar. Se não receber, confira o spam.',
          { duration: 8000 }
        )
        // Also try immediate login in case autoconfirm is actually on
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.signInWithPassword({
            email: registerEmail,
            password: registerPassword
          })
          if (retryData?.session) {
            navigate('/onboarding')
          }
        }, 2000)
      }
    } catch (error: any) {
      console.error('Register error:', error)
      toast.error('Erro ao conectar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Esqueci minha senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('Digite seu email')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/login'
      })

      if (error) {
        if (error.message?.includes('rate limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos.')
        } else {
          toast.error('Erro ao enviar email de recuperação')
        }
        return
      }

      toast.success(
        'Email de recuperação enviado! Verifique sua caixa de entrada e spam.',
        { duration: 8000 }
      )
      setShowForgotPassword(false)
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error('Erro ao conectar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading inicial
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Radar Político</h1>
          <p className="text-muted-foreground">Monitoramento de Imagem</p>
        </div>

        {/* Card de Login/Cadastro */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              {showForgotPassword ? 'Recuperar Senha' : 'Acesse sua conta'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword
                ? 'Digite seu email para receber o link de recuperação'
                : 'Entre ou crie uma conta para acessar o dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email cadastrado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para login
                </Button>
              </form>
            ) : (
              // Login / Register Tabs
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="register">Cadastrar</TabsTrigger>
                  </TabsList>

                  {/* Tab de Login */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-10"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          'Entrar'
                        )}
                      </Button>

                      {/* Esqueci minha senha */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true)
                            setForgotEmail(loginEmail)
                          }}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Tab de Cadastro */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Seu nome"
                            className="pl-10"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="pl-10"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          'Criar conta grátis'
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Ao criar uma conta, você concorda com nossos termos de uso
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {/* Link para voltar */}
            {!showForgotPassword && (
              <div className="mt-6 text-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o site
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
