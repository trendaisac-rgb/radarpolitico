import { Newspaper, Zap, Eye } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const problems = [
  {
    icon: Newspaper,
    title: "Milhares de notícias por dia",
    description:
      "Com centenas de veículos publicando 24h por dia, é impossível acompanhar tudo manualmente sem uma equipe gigante.",
  },
  {
    icon: Zap,
    title: "Crises viralizam em minutos",
    description:
      "Quando você descobre uma notícia negativa, ela já foi compartilhada milhares de vezes. A resposta chega tarde demais.",
  },
  {
    icon: Eye,
    title: "Adversários estão monitorando você",
    description:
      "Campanhas profissionais já usam ferramentas de monitoramento. Não fique para trás na corrida eleitoral.",
  },
];

export function Problem() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Monitorar manualmente é impossível
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A cada dia, milhares de notícias são publicadas sobre política. 
            Como garantir que você não perde nada importante?
          </p>
        </div>

        <div
          className={`grid md:grid-cols-3 gap-8 stagger-children ${
            isVisible ? "visible" : ""
          }`}
        >
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-danger/10 flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-danger" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
