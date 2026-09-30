/**
 * Configuración de la Gift Card — la compra se coordina por WhatsApp
 * (mismo número que el resto del sitio, ver CartDrawer/Footer/ProductCard).
 */

const GIFT_CARD_WHATSAPP_NUMBER = '5493492287864'
const GIFT_CARD_WHATSAPP_MESSAGE = 'Hola, quiero regalar una Gift Card, ¿me ayudás?'

export const GIFT_CARD_URL = `https://wa.me/${GIFT_CARD_WHATSAPP_NUMBER}?text=${encodeURIComponent(GIFT_CARD_WHATSAPP_MESSAGE)}`

export const GIFT_CARD_COPY = {
  eyebrow: 'Un regalo con historia',
  title: 'Regalá una Gift Card',
  body: 'Para esa persona que todavía no sabe qué pieza quiere en su casa. Vos ponés el monto, el resto lo elige quien la recibe.',
  cta: 'Escribinos por WhatsApp',
  dismiss: 'Ahora no',
}
