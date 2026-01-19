// Configurações do Radar Político
export const WHATSAPP_NUMBER = "5511999999999"; // Substitua pelo número real
export const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Quero saber mais sobre o Radar Político para monitoramento de campanhas."
);

export const getWhatsAppUrl = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// Data das eleições 2026 - Primeiro turno: 4 de outubro de 2026
export const ELECTION_DATE = new Date("2026-10-04T08:00:00-03:00");

// Email de contato
export const CONTACT_EMAIL = "contato@radarpolitico.com.br";
