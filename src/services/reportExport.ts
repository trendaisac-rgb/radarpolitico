/**
 * RadarPolítico - Serviço de Exportação de Relatórios
 * Gera PDF e compartilha via WhatsApp/Email
 */

export interface ReportData {
  politicianName: string
  party?: string
  cargo?: string
  date: string
  time: string
  totalMentions: number
  sentimentScore: number
  alertLevel: 'verde' | 'amarelo' | 'vermelho'
  alertMessage: string
  summary: string
  topNews: Array<{
    title: string
    source: string
    sentiment: string
    url: string
  }>
  networkMetrics: Array<{
    network: string
    mentions: number
    positive: number
    negative: number
    score: number
  }>
  aiRecommendation: string
}

/**
 * Gera HTML do relatório para exportação
 */
export function generateReportHTML(data: ReportData): string {
  const sentimentLabel = data.sentimentScore >= 7 ? 'POSITIVO' : data.sentimentScore >= 4 ? 'NEUTRO' : 'NEGATIVO'
  const sentimentColor = data.sentimentScore >= 7 ? '#22c55e' : data.sentimentScore >= 4 ? '#eab308' : '#ef4444'

  const alertColors = {
    verde: { bg: '#dcfce7', text: '#166534' },
    amarelo: { bg: '#fef9c3', text: '#854d0e' },
    vermelho: { bg: '#fee2e2', text: '#991b1b' }
  }

  const getSentimentIcon = (s: string) => {
    if (s === 'positivo') return '↑'
    if (s === 'negativo') return '↓'
    return '→'
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório Radar Político - ${data.politicianName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #047857, #065f46); color: white; padding: 20px; }
    .header h1 { font-size: 18px; font-weight: bold; }
    .header p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
    .header-right { text-align: right; font-size: 12px; }
    .section { padding: 16px; border-bottom: 1px solid #e5e7eb; }
    .politician-name { font-size: 20px; font-weight: bold; }
    .politician-info { font-size: 12px; color: #64748b; }
    .mentions-count { font-size: 32px; font-weight: bold; color: #0ea5e9; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .metric-value { font-size: 14px; font-weight: 600; }
    .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; transition: width 0.3s; }
    .summary-box { background: #f1f5f9; padding: 12px; border-radius: 8px; }
    .news-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .news-icon { font-size: 14px; }
    .news-title { font-size: 13px; line-height: 1.4; }
    .news-source { font-size: 11px; color: #64748b; margin-top: 2px; }
    .ai-box { background: #fef3c7; padding: 12px; border-radius: 8px; }
    .ai-title { font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 4px; }
    .ai-text { font-size: 13px; color: #78350f; }
    .network-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .network-card { background: #f8fafc; padding: 8px; border-radius: 6px; text-align: center; }
    .network-name { font-size: 10px; color: #64748b; }
    .network-score { font-size: 18px; font-weight: bold; }
    .footer { padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>🏛️ RADAR POLÍTICO</h1>
          <p>Relatório Diário - ${data.date}</p>
        </div>
        <div class="header-right">
          <div style="font-size: 10px; opacity: 0.8;">Gerado às</div>
          <div style="font-weight: bold;">${data.time}</div>
        </div>
      </div>
    </div>

    <!-- Político Info -->
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="metric-label">Monitorando</div>
          <div class="politician-name">${data.politicianName}</div>
          ${data.party || data.cargo ? `<div class="politician-info">${data.party || ''}${data.cargo ? ` - ${data.cargo}` : ''}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div class="metric-label">Menções hoje</div>
          <div class="mentions-count">${data.totalMentions}</div>
        </div>
      </div>
    </div>

    <!-- Sentimento e Alerta -->
    <div class="section">
      <div class="grid-2">
        <div>
          <div class="metric-label">Sentimento Geral</div>
          <div class="metric-value" style="color: ${sentimentColor};">● ${sentimentLabel}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${data.sentimentScore * 10}%; background: ${sentimentColor};"></div>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">+${data.sentimentScore}/10</div>
        </div>
        <div>
          <div class="metric-label">Alerta de Crise</div>
          <div class="metric-value" style="color: ${alertColors[data.alertLevel].text};">● ${data.alertLevel.toUpperCase()}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${data.alertMessage}</div>
        </div>
      </div>
    </div>

    <!-- Resumo -->
    <div class="section">
      <div class="metric-label" style="margin-bottom: 8px;">📋 Resumo Executivo</div>
      <div class="summary-box">
        <p style="font-size: 13px; line-height: 1.5;">${data.summary}</p>
      </div>
    </div>

    <!-- Top Notícias -->
    <div class="section">
      <div class="metric-label" style="margin-bottom: 8px;">📰 Top 3 Notícias do Dia</div>
      ${data.topNews.slice(0, 3).map(news => `
        <div class="news-item">
          <span class="news-icon">${getSentimentIcon(news.sentiment)}</span>
          <div>
            <div class="news-title">${news.title}</div>
            <div class="news-source">${news.source}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Métricas por Rede -->
    ${data.networkMetrics.length > 0 ? `
    <div class="section">
      <div class="metric-label" style="margin-bottom: 8px;">📊 Score por Rede</div>
      <div class="network-grid">
        ${data.networkMetrics.map(net => `
          <div class="network-card">
            <div class="network-name">${net.network}</div>
            <div class="network-score" style="color: ${net.score >= 60 ? '#22c55e' : net.score >= 40 ? '#eab308' : '#ef4444'};">${net.score}</div>
            <div style="font-size: 10px; color: #64748b;">${net.mentions} menções</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Recomendação IA -->
    <div class="section">
      <div class="ai-box">
        <div class="ai-title">💡 Recomendação da IA</div>
        <div class="ai-text">${data.aiRecommendation}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Gerado por Radar Político em ${data.date} às ${data.time}
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Exporta relatório como PDF usando html2canvas + jsPDF
 * (Requer instalação: npm install html2canvas jspdf)
 */
export async function exportToPDF(data: ReportData): Promise<Blob | null> {
  try {
    // Importação dinâmica para evitar erros se não estiver instalado
    const html2canvas = (await import('html2canvas' as any)).default
    const { jsPDF } = await import('jspdf' as any)

    // Cria elemento temporário com o HTML
    const container = document.createElement('div')
    container.innerHTML = generateReportHTML(data)
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '600px'
    document.body.appendChild(container)

    // Aguarda renderização
    await new Promise(resolve => setTimeout(resolve, 100))

    // Captura como canvas
    const canvas = await html2canvas(container.querySelector('.container') as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false
    })

    // Remove elemento temporário
    document.body.removeChild(container)

    // Cria PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    return pdf.output('blob')
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return null
  }
}

/**
 * Método alternativo: Abre janela de impressão do navegador
 */
export function printReport(data: ReportData): void {
  const html = generateReportHTML(data)

  // Abre nova janela
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir o relatório')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Aguarda carregar e imprime
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Compartilha via WhatsApp
 */
export function shareViaWhatsApp(data: ReportData, phone?: string): void {
  const text = generateWhatsAppMessage(data)
  const encodedText = encodeURIComponent(text)

  const url = phone
    ? `https://wa.me/${phone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`

  window.open(url, '_blank')
}

/**
 * Gera mensagem para WhatsApp
 */
export function generateWhatsAppMessage(data: ReportData): string {
  const sentimentLabel = data.sentimentScore >= 7 ? '🟢 POSITIVO' : data.sentimentScore >= 4 ? '🟡 NEUTRO' : '🔴 NEGATIVO'

  const alertEmoji = {
    verde: '🟢',
    amarelo: '🟡',
    vermelho: '🔴'
  }

  return `
🏛️ *RADAR POLÍTICO*
📅 Relatório Diário - ${data.date}

👤 *${data.politicianName}*
${data.party ? `🏷️ ${data.party}` : ''}

📊 *Menções hoje:* ${data.totalMentions}
💭 *Sentimento:* ${sentimentLabel} (+${data.sentimentScore}/10)
⚠️ *Alerta:* ${alertEmoji[data.alertLevel]} ${data.alertLevel.toUpperCase()}

📋 *Resumo:*
${data.summary}

📰 *Top 3 Notícias:*
${data.topNews.slice(0, 3).map((n, i) => `${i + 1}. ${n.title} (${n.source})`).join('\n')}

💡 *Recomendação:*
${data.aiRecommendation}

---
_Gerado por Radar Político_
  `.trim()
}

/**
 * Compartilha via Email
 */
export function shareViaEmail(data: ReportData, email?: string): void {
  const subject = `Radar Político - Relatório ${data.politicianName} - ${data.date}`
  const body = generateEmailBody(data)

  const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoUrl
}

/**
 * Gera corpo do email
 */
function generateEmailBody(data: ReportData): string {
  const sentimentLabel = data.sentimentScore >= 7 ? 'POSITIVO' : data.sentimentScore >= 4 ? 'NEUTRO' : 'NEGATIVO'

  return `
RADAR POLÍTICO - RELATÓRIO DIÁRIO
Data: ${data.date}
Horário: ${data.time}

POLÍTICO: ${data.politicianName}
${data.party ? `Partido: ${data.party}` : ''}
${data.cargo ? `Cargo: ${data.cargo}` : ''}

MÉTRICAS DO DIA:
- Menções: ${data.totalMentions}
- Sentimento: ${sentimentLabel} (+${data.sentimentScore}/10)
- Alerta de Crise: ${data.alertLevel.toUpperCase()} - ${data.alertMessage}

RESUMO EXECUTIVO:
${data.summary}

TOP 3 NOTÍCIAS:
${data.topNews.slice(0, 3).map((n, i) => `${i + 1}. ${n.title} (${n.source})\n   ${n.url}`).join('\n\n')}

RECOMENDAÇÃO DA IA:
${data.aiRecommendation}

---
Gerado por Radar Político
  `.trim()
}

export default {
  generateReportHTML,
  exportToPDF,
  printReport,
  shareViaWhatsApp,
  shareViaEmail,
  generateWhatsAppMessage
}
