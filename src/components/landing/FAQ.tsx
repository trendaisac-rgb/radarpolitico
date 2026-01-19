import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const faqs = [
  {
    question: "Como funciona a análise de sentimento?",
    answer:
      "Nossa IA analisa o texto de cada notícia identificando palavras, contexto e tom geral. Cada menção recebe uma classificação (positiva, neutra ou negativa) e um score de -10 a +10. Usamos modelos de linguagem treinados especificamente para o contexto político brasileiro.",
  },
  {
    question: "Quais fontes são monitoradas?",
    answer:
      "Monitoramos os principais portais de notícias do Brasil: G1, Folha de S.Paulo, UOL, Estadão, O Globo, além de Google News e portais regionais relevantes. São mais de 50 fontes verificadas diariamente.",
  },
  {
    question: "Em quanto tempo recebo alertas de crise?",
    answer:
      "Alertas de crise são enviados em até 5 minutos após a detecção de uma notícia negativa com alto potencial de viralização. Você recebe uma notificação direta no WhatsApp com o resumo da situação e recomendações imediatas.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Todos os nossos planos são mensais sem fidelidade. Você pode cancelar a qualquer momento pelo WhatsApp ou email, e não será cobrado no mês seguinte. Oferecemos também 7 dias de teste para você conhecer o serviço.",
  },
  {
    question: "Funciona para eleições municipais?",
    answer:
      "Sim! O Radar Político funciona para eleições em todos os níveis: municipal, estadual e federal. Monitoramos notícias de portais nacionais e regionais, garantindo cobertura para candidatos de qualquer cidade do Brasil.",
  },
  {
    question: "Como é feita a configuração inicial?",
    answer:
      "A configuração é simples e rápida. Após a contratação, você nos informa o nome do candidato e palavras-chave relacionadas. Em até 24 horas, seu monitoramento estará ativo e você começará a receber os relatórios diários.",
  },
];

export function FAQ() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="faq" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Radar Político.
          </p>
        </div>

        <div
          className={`max-w-3xl mx-auto transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
