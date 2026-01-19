import { Radar, Mail, MessageCircle } from "lucide-react";
import { getWhatsAppUrl, CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div>
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Radar className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary-foreground">
                Radar Político
              </span>
            </a>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Monitoramento inteligente de mídia para campanhas eleitorais. 
              Tecnologia de IA a serviço da democracia brasileira.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#como-funciona"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Como Funciona
                </a>
              </li>
              <li>
                <a
                  href="#funcionalidades"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="#planos"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Planos e Preços
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Termos de Uso
              </a>
              <span>|</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Política de Privacidade
              </a>
            </div>

            <p className="text-sm text-primary-foreground/60">
              Feito com ❤️ para a democracia brasileira
            </p>
          </div>

          <p className="text-center text-xs text-primary-foreground/40 mt-6">
            © {currentYear} Radar Político. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
