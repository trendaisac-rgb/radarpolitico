import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getWhatsAppUrl } from "@/lib/constants";

const plans = [
  {
    name: "Básico",
    price: "297",
    description: "Para candidatos que estão começando",
    features: [
      "1 político monitorado",
      "Relatório diário no WhatsApp",
      "Análise de sentimento",
      "Alertas de crise",
      "Suporte por email",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Profissional",
    price: "597",
    description: "Para campanhas competitivas",
    features: [
      "Tudo do Básico +",
      "1 político + 2 adversários",
      "Relatório 2x ao dia (8h e 18h)",
      "Análise comparativa",
      "Suporte prioritário WhatsApp",
      "Histórico de 30 dias",
    ],
    cta: "Escolher Pro",
    popular: true,
  },
  {
    name: "Assessoria",
    price: "997",
    description: "Para assessorias e partidos",
    features: [
      "Tudo do Profissional +",
      "Até 5 políticos monitorados",
      "Alertas em tempo real",
      "Relatório semanal detalhado",
      "Reunião mensal de estratégia",
      "Acesso a API (em breve)",
    ],
    cta: "Falar com Consultor",
    popular: false,
  },
];

export function Pricing() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="planos" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Planos para cada tipo de campanha
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para suas necessidades. 
            Todos incluem configuração gratuita e suporte para começar.
          </p>
        </div>

        <div
          className={`grid md:grid-cols-3 gap-8 max-w-5xl mx-auto stagger-children ${
            isVisible ? "visible" : ""
          }`}
        >
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-2xl p-8 shadow-lg border transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-accent shadow-xl scale-105 md:scale-110"
                  : "border-border hover:shadow-xl"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${
                  plan.popular
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25"
                    : "bg-primary hover:bg-primary/90"
                }`}
                size="lg"
              >
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem 7 dias de teste. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
