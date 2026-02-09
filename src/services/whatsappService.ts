/**
 * RadarPolítico - Serviço de WhatsApp
 * Envio de relatórios diários via WhatsApp Business API
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

// Meta WhatsApp Business API (recomendado)
// Cadastre em: https://business.facebook.com/
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const WHATSAPP_PHONE_NUMBER_ID = '' // ID do número de telefone na Meta
const WHATSAPP_ACCESS_TOKEN = '' // Token de acesso da Meta

// Alternativa: Twilio (mais fácil para começar)
// Cadastre em: https://www.twilio.com/
const TWILIO_ACCOUNT_SID = ''
const TWILIO_AUTH_TOKEN = ''
const TWILIO_WHATSAPP_FROM = '' // Ex: whatsapp:+14155238886

// Alternativa: Evolution API (self-hosted, gratuito)
// https://github.com/EvolutionAPI/evolution-api
const EVOLUTION_API_URL = ''
const EVOLUTION_API_KEY = ''
const EVOLUTION_INSTANCE = ''

// ============================================
// INTERFACES
// ============================================

export interface WhatsAppMessage {
  to: string // Número no formato: 5511999999999
  message: string
}

export interface DailyReportWhatsApp {
  politicianName: string
  party?: string
  date: string
  time: string
  score: number
  alertLevel: 'VERDE' | 'AMARELO' | 'VERMELHO'
  alertMessage: string
  summary: string
  topNews: Array<{
    title: string
    source: string
    sentiment: 'positivo' | 'negativo' | 'neutro'
  }>
  recommendations: string[]
  networkStats: {
    midia: number
    youtube: number
    twitter: number
    instagram: number
    tiktok: number
  }
}

// ============================================
// FORMATADOR DE MENSAGEM
// ============================================

export function formatDailyReportForWhatsApp(report: DailyReportWhatsApp): string {
  const scoreEmoji = report.score >= 7 ? '🟢' : report.score >= 4 ? '🟡' : '🔴'
  const alertEmoji = {
    'VERDE': '🟢',
    'AMARELO': '🟡',
    'VERMELHO': '🔴'
  }[report.alertLevel]

  const sentimentEmoji = (s: string) =>
    s === 'positivo' ? '✅' : s === 'negativo' ? '❌' : '⚪'

  let message = `🏛️ *RADAR POLÍTICO*
📅 ${report.date} | ⏰ ${report.time}
━━━━━━━━━━━━━━━━━━━━━

👤 *${report.politicianName}*${report.party ? ` (${report.party})` : ''}

📊 *SCORE:* ${scoreEmoji} *${report.score}/10*
🚨 *ALERTA:* ${alertEmoji} *${report.alertLevel}*
_${report.alertMessage}_

━━━━━━━━━━━━━━━━━━━━━

📝 *RESUMO EXECUTIVO*

${report.summary}

━━━━━━━━━━━━━━━━━━━━━

📰 *TOP 3 NOTÍCIAS*

`

  report.topNews.slice(0, 3).forEach((news, i) => {
    message += `${i + 1}. ${sentimentEmoji(news.sentiment)} ${news.title}
   📰 ${news.source}

`
  })

  message += `━━━━━━━━━━━━━━━━━━━━━

📊 *MENÇÕES POR REDE*

📰 Mídia: ${report.networkStats.midia}
▶️ YouTube: ${report.networkStats.youtube}
🐦 Twitter: ${report.networkStats.twitter}
📸 Instagram: ${report.networkStats.instagram}
🎵 TikTok: ${report.networkStats.tiktok}

━━━━━━━━━━━━━━━━━━━━━

💡 *RECOMENDAÇÕES*

`

  report.recommendations.slice(0, 3).forEach((rec, i) => {
    message += `${i + 1}. ${rec}\n`
  })

  message += `
━━━━━━━━━━━━━━━━━━━━━
_📱 Radar Político - Monitoramento 360°_`

  return message
}

// ============================================
// ENVIO VIA META WHATSAPP BUSINESS API
// ============================================

export async function sendViaMetaWhatsApp(to: string, message: string): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn('⚠️ Meta WhatsApp não configurado')
    return false
  }

  try {
    // Formata número (remove caracteres especiais)
    const formattedNumber = to.replace(/\D/g, '')

    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedNumber,
          type: 'text',
          text: { body: message }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Meta WhatsApp error:', error)
      return false
    }

    console.log(`✅ WhatsApp enviado para ${formattedNumber}`)
    return true
  } catch (error) {
    console.error('Erro ao enviar WhatsApp (Meta):', error)
    return false
  }
}

// ============================================
// ENVIO VIA TWILIO
// ============================================

export async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.warn('⚠️ Twilio não configurado')
    return false
  }

  try {
    const formattedNumber = `whatsapp:+${to.replace(/\D/g, '')}`

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: formattedNumber,
          Body: message
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Twilio error:', error)
      return false
    }

    console.log(`✅ WhatsApp enviado via Twilio para ${to}`)
    return true
  } catch (error) {
    console.error('Erro ao enviar WhatsApp (Twilio):', error)
    return false
  }
}

// ============================================
// ENVIO VIA EVOLUTION API (Self-hosted)
// ============================================

export async function sendViaEvolutionAPI(to: string, message: string): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.warn('⚠️ Evolution API não configurada')
    return false
  }

  try {
    const formattedNumber = to.replace(/\D/g, '')

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: message
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Evolution API error:', error)
      return false
    }

    console.log(`✅ WhatsApp enviado via Evolution API para ${to}`)
    return true
  } catch (error) {
    console.error('Erro ao enviar WhatsApp (Evolution):', error)
    return false
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE ENVIO
// ============================================

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  // Tenta em ordem de preferência
  if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
    return sendViaMetaWhatsApp(to, message)
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return sendViaTwilio(to, message)
  }

  if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
    return sendViaEvolutionAPI(to, message)
  }

  console.warn('⚠️ Nenhum provedor de WhatsApp configurado')
  console.log('📱 Mensagem que seria enviada:')
  console.log(message)
  return false
}

// ============================================
// VERIFICAR CONFIGURAÇÃO
// ============================================

export function isWhatsAppConfigured(): boolean {
  return !!(
    (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) ||
    (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) ||
    (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE)
  )
}

export function getWhatsAppProvider(): string {
  if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) return 'Meta WhatsApp Business'
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) return 'Twilio'
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY) return 'Evolution API'
  return 'Não configurado'
}

// ============================================
// AGENDAR ENVIO DIÁRIO (Para uso com cron/scheduler)
// ============================================

export interface ScheduledReport {
  politicianId: number
  whatsappNumber: string
  sendTime: string // Formato: "08:00"
  enabled: boolean
}

// Simula agendamento (em produção, usar cron job ou cloud scheduler)
export function scheduleDaily8AMReport(
  reports: ScheduledReport[],
  generateReportFn: (politicianId: number) => Promise<DailyReportWhatsApp>
): void {
  // Calcula ms até as 8h
  const now = new Date()
  const target = new Date()
  target.setHours(8, 0, 0, 0)

  if (now > target) {
    target.setDate(target.getDate() + 1)
  }

  const msUntil8AM = target.getTime() - now.getTime()

  console.log(`⏰ Próximo envio agendado para: ${target.toLocaleString('pt-BR')}`)

  setTimeout(async () => {
    console.log('📬 Iniciando envio de relatórios das 8h...')

    for (const report of reports.filter(r => r.enabled)) {
      try {
        const reportData = await generateReportFn(report.politicianId)
        const message = formatDailyReportForWhatsApp(reportData)
        await sendWhatsAppMessage(report.whatsappNumber, message)
      } catch (error) {
        console.error(`Erro ao enviar relatório para ${report.whatsappNumber}:`, error)
      }
    }

    // Reagenda para o próximo dia
    scheduleDaily8AMReport(reports, generateReportFn)
  }, msUntil8AM)
}
