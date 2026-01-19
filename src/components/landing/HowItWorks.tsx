import { Database, Brain, Bell, FileText, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  {
    icon: Database,
    number: "01",
    title: "Coleta",
    description:
      "Monitoramos G1, Folha, UOL, Google News e +50 fontes automaticamente, 24 horas por dia.",
  },
  {
    icon: Brain,
    number: "02",
    title: "Análise",
    description:
      "Nossa IA analisa sentimento, contexto e relevância de cada menção ao seu candidato.",
  },
  {
    icon: Bell,
    number: "03",
    title: "Alerta",
    description:
      "Crises detectadas geram alertas imediatos direto no seu WhatsApp, sem atrasos.",
  },
  {
    icon: FileText,
    number: "04",
    title: "Relatório",
    description:
      "Receba resumo executivo diário às 8h com insights e recomendações estratégicas.",
  },
];

export function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Inteligência Artificial trabalhando 24h para sua campanha
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um processo automatizado que transforma milhares de notícias em 
            informação acionável para sua estratégia.
          </p>
        </div>

        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 -translate-y-1/2" />

          <div
            className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children ${
              isVisible ? "visible" : ""
            }`}
          >
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                    {step.number}
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps - hidden on last item and mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                    <ArrowRight className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
