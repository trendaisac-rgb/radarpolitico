import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getWhatsAppUrl } from "@/lib/constants";

export function CTAFinal() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Eleições 2026 já começaram.
            <br />
            <span className="text-accent">E você?</span>
          </h2>

          <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Configure seu monitoramento em menos de 5 minutos e 
            comece a receber insights sobre sua campanha amanhã.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-xl shadow-accent/30"
            >
              <a href="/login">
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/60">
            Sem compromisso. 7 dias de teste. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}
