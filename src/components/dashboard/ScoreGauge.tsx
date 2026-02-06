/**
 * RadarPolítico - Score Gauge Profissional
 * Indicador visual de score com design clean e corrigido
 */

interface ScoreGaugeProps {
  score: number
  previousScore?: number
  size?: number
  label?: string
}

export function ScoreGauge({ score, previousScore, size = 180, label = 'Score de Imagem' }: ScoreGaugeProps) {
  // Garante que o score está entre 0 e 100
  const normalizedScore = Math.max(0, Math.min(100, score))
  const diff = previousScore !== undefined ? score - previousScore : 0

  // Calcula a cor e status baseado no score
  const getScoreInfo = (s: number) => {
    if (s >= 70) return { color: '#22c55e', label: 'Excelente', bgLight: '#dcfce7' }
    if (s >= 50) return { color: '#eab308', label: 'Bom', bgLight: '#fef9c3' }
    if (s >= 30) return { color: '#f97316', label: 'Atenção', bgLight: '#ffedd5' }
    return { color: '#ef4444', label: 'Crítico', bgLight: '#fee2e2' }
  }

  const info = getScoreInfo(normalizedScore)

  // Configurações do arco
  const strokeWidth = 14
  const padding = 20
  const radius = (size - strokeWidth - padding) / 2
  const centerX = size / 2
  const centerY = size / 2 + 10

  // O arco vai de 180° a 0° (semicírculo superior)
  const startAngle = 180
  const endAngle = 0
  const angleRange = startAngle - endAngle // 180 graus

  // Calcula o ângulo do ponteiro baseado no score
  const pointerAngle = startAngle - (normalizedScore / 100) * angleRange
  const pointerAngleRad = (pointerAngle * Math.PI) / 180
  const pointerLength = radius - 10
  const pointerX = centerX + pointerLength * Math.cos(pointerAngleRad)
  const pointerY = centerY + pointerLength * Math.sin(pointerAngleRad)

  // Função para criar o path do arco
  const createArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg * Math.PI) / 180
    const endRad = (endDeg * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    const sweep = endDeg < startDeg ? 0 : 1

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`
  }

  // Calcula o ângulo de progresso
  const progressAngle = startAngle - (normalizedScore / 100) * angleRange

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium text-muted-foreground mb-3">{label}</p>

      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + 30}
          viewBox={`0 0 ${size} ${size / 2 + 30}`}
        >
          {/* Gradiente */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Arco de fundo */}
          <path
            d={createArc(180, 0)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Arco de progresso */}
          <path
            d={createArc(180, progressAngle)}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              transition: 'all 0.8s ease-out'
            }}
          />

          {/* Ponteiro */}
          <line
            x1={centerX}
            y1={centerY}
            x2={pointerX}
            y2={pointerY}
            stroke="#374151"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: 'all 0.8s ease-out' }}
          />

          {/* Centro do ponteiro */}
          <circle cx={centerX} cy={centerY} r={10} fill="#374151" />
          <circle cx={centerX} cy={centerY} r={5} fill="white" />

          {/* Labels */}
          <text
            x={padding / 2 + strokeWidth / 2}
            y={centerY + 20}
            textAnchor="start"
            fontSize={11}
            fill="#9ca3af"
          >
            0
          </text>
          <text
            x={centerX}
            y={centerY - radius - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
          >
            50
          </text>
          <text
            x={size - padding / 2 - strokeWidth / 2}
            y={centerY + 20}
            textAnchor="end"
            fontSize={11}
            fill="#9ca3af"
          >
            100
          </text>
        </svg>

        {/* Score e label central */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 text-center"
          style={{ bottom: 0 }}
        >
          <div
            className="text-5xl font-bold tracking-tight"
            style={{ color: info.color }}
          >
            {normalizedScore}
          </div>
          <div
            className="text-xs font-semibold px-3 py-1 rounded-full mt-1 inline-block"
            style={{ backgroundColor: info.bgLight, color: info.color }}
          >
            {info.label}
          </div>
        </div>
      </div>

      {/* Variação */}
      {previousScore !== undefined && diff !== 0 && (
        <div className={`text-sm mt-2 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {diff > 0 ? '↑' : '↓'} {Math.abs(diff)} pts vs ontem
        </div>
      )}
    </div>
  )
}

export default ScoreGauge
