import {
  BarChart3,
  AlertTriangle,
  Newspaper,
  Smartphone,
  Target,
  Lightbulb,
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: BarChart3,
    title: "Análise de Sentimento",
    description:
      "Cada notícia é classificada como positiva, neutra ou negativa com score de -10 a +10.",
  },
  {
    icon: AlertTriangle,
    title: "Alerta de Crise",
    description:
      "Sistema semáforo (verde/amarelo/vermelho) com notificação instantânea no WhatsApp.",
  },
  {
    icon: Newspaper,
    title: "Cobertura Ampla",
    description:
      "G1, Folha, UOL, Google News e portais regionais. Nenhuma notícia passa despercebida.",
  },
  {
    icon: Smartphone,
    title: "Relatório no WhatsApp",
    description:
      "Receba o resumo diário direto no seu celular, sem precisar acessar nenhum sistema.",
  },
  {
    icon: Target,
    title: "Monitoramento de Adversários",
    description:
      "Saiba o que a mídia fala dos seus concorrentes e compare o desempenho. (Plano Pro)",
  },
  {
    icon: Lightbulb,
    title: "Recomendações de IA",
    description:
      "Sugestões de ação e comunicação para sua assessoria baseadas nos dados coletados.",
  },
];

export function Features() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="funcionalidades" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Tudo que você precisa para monitorar sua campanha
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais de monitoramento de mídia, 
            simplificadas para uso no dia a dia da campanha.
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children ${
            isVisible ? "visible" : ""
          }`}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
