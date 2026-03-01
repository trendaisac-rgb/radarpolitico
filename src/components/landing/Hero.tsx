import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, TrendingUp, Shield } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { ELECTION_DATE, getWhatsAppUrl } from "@/lib/constants";
export function Hero() {
  const countdown = useCountdown(ELECTION_DATE);

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div
          className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Monitoramento inteligente para eleições 2026
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
              Saiba o que a mídia fala do seu candidato{" "}
              <span className="text-accent">antes do adversário</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Monitoramento inteligente de mídia com IA. Receba relatórios diários 
              com análise de sentimento, alertas de crise e recomendações estratégicas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg shadow-accent/25"
              >
                <a href="/login">
                  Testar Grátis por 7 Dias
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
              >
                <a href="#como-funciona">
                  Ver como funciona
                </a>
              </Button>
            </div>

            {/* Countdown Timer */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Tempo até as eleições de 2026:
              </p>
              <div className="flex gap-4">
                {[
                  { value: countdown.days, label: "Dias" },
                  { value: countdown.hours, label: "Horas" },
                  { value: countdown.minutes, label: "Min" },
                  { value: countdown.seconds, label: "Seg" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-primary text-primary-foreground px-4 py-3 rounded-lg text-center min-w-[70px]"
                  >
                    <div className="text-2xl font-bold tabular-nums">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs opacity-80">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Mock Report */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              {/* Phone mockup */}
              <div className="bg-card rounded-3xl shadow-2xl p-4 border border-border">
                <div className="bg-secondary rounded-2xl p-4 space-y-4">
                  {/* Report header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Radar Político</div>
                      <div className="text-xs text-muted-foreground">Relatório Diário</div>
                    </div>
                  </div>

                  {/* Report content */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                      🏛️ MONITOR POLÍTICO - 19/01/2026
                    </div>
                    
                    <div className="bg-card rounded-lg p-3 space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Político:</span>{" "}
                        <span className="font-medium">João Silva (PARTIDO)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sentimento:</span>
                        <span className="inline-flex items-center gap-1 text-success font-medium text-sm">
                          🟢 POSITIVO
                        </span>
                        <span className="text-sm text-muted-foreground">| Score: +7/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Alerta:</span>
                        <span className="inline-flex items-center gap-1 text-success font-medium text-sm">
                          🟢 VERDE
                        </span>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-2">📰 Top notícias:</div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex gap-2">
                          <span className="text-success">↑</span>
                          <span className="text-foreground/80">Candidato lidera pesquisa na região</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground/80">Debate sobre propostas econômicas</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-success">↑</span>
                          <span className="text-foreground/80">Apoio de lideranças locais cresce</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -right-4 top-20 bg-card rounded-lg shadow-xl p-3 border border-border animate-pulse-subtle">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium">Novo relatório disponível</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
