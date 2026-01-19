import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function ReportExample() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Veja como é um relatório
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Informações claras e objetivas, direto no seu WhatsApp toda manhã.
          </p>
        </div>

        <div
          className={`max-w-2xl mx-auto transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Report Card */}
          <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <span className="text-xl">🏛️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-foreground">
                      RADAR POLÍTICO
                    </h3>
                    <p className="text-sm text-primary-foreground/80">
                      Relatório Diário - 19/01/2026
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-primary-foreground/60">Gerado às</div>
                  <div className="text-sm font-medium text-primary-foreground">08:00</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Candidate Info */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <div className="text-sm text-muted-foreground">Monitorando</div>
                  <div className="text-xl font-bold text-foreground">
                    João Silva
                  </div>
                  <div className="text-sm text-muted-foreground">PARTIDO - Governador SP</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Menções hoje</div>
                  <div className="text-3xl font-bold text-primary">47</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Sentiment */}
                <div className="bg-success/10 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Sentimento Geral</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🟢</span>
                    <span className="text-xl font-bold text-success">POSITIVO</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: "85%" }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">+7/10</span>
                  </div>
                </div>

                {/* Crisis Alert */}
                <div className="bg-success/10 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Alerta de Crise</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🟢</span>
                    <span className="text-xl font-bold text-success">VERDE</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Nenhuma crise detectada
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-secondary rounded-xl p-4">
                <div className="text-sm font-medium text-foreground mb-2">📋 Resumo Executivo</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dia positivo para o candidato. Destaque para a cobertura da proposta de 
                  infraestrutura apresentada ontem, com repercussão favorável em 4 dos 5 
                  principais portais. Recomendação: amplificar a pauta nas redes sociais.
                </p>
              </div>

              {/* Top News */}
              <div>
                <div className="text-sm font-medium text-foreground mb-3">📰 Top 3 Notícias do Dia</div>
                <div className="space-y-3">
                  {[
                    {
                      sentiment: "positive",
                      title: "Candidato lidera pesquisa de intenção de voto na região metropolitana",
                      source: "G1",
                    },
                    {
                      sentiment: "neutral",
                      title: "Debate econômico: candidatos apresentam propostas para geração de emprego",
                      source: "Folha",
                    },
                    {
                      sentiment: "positive",
                      title: "Apoio de lideranças locais ao candidato cresce 15% em uma semana",
                      source: "UOL",
                    },
                  ].map((news, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="mt-0.5">
                        {news.sentiment === "positive" ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : news.sentiment === "negative" ? (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                          {news.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{news.source}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      Recomendação da IA
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aproveite o momento positivo para publicar conteúdo sobre a proposta de 
                      infraestrutura. O engajamento tende a ser 40% maior nas próximas 24h.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
