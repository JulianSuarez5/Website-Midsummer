/**
 * Esquema de validación del formulario de contacto.
 *
 * Una sola definición de campos y reglas, usada por el formulario y por
 * cualquier validación de servidor posterior. Si se agrega un campo, se
 * agrega aquí y en el componente: no en dos lugares distintos.
 *
 * `esListaBlanca`: un esquema con estas reglas rechaza campos que el
 * navegador no debería estar enviando. Es la base para descartar intentos de
 * inyección en el backend.
 */

import { z } from 'zod';

/** Campos que el navegador nunca debe enviar. */
export const HONEYPOT_FIELD = 'website_url';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'requiredName').max(120, 'requiredName'),

  company: z.string().trim().max(160, 'requiredName').optional().or(z.literal('')),

  email: z
    .string()
    .trim()
    .min(1, { error: 'requiredEmail' })
    .max(160, { error: 'invalidEmail' })
    .pipe(z.email({ error: 'invalidEmail' })),

  phone: z.string().trim().max(40, 'requiredName').optional().or(z.literal('')),

  subject: z.string().trim().max(160, 'requiredName').optional().or(z.literal('')),

  message: z.string().trim().min(10, 'requiredMessage').max(4000, 'requiredMessage'),

  consent: z.literal(true, {
    error: 'requiredConsent',
  }),

  /** Campo trampa. Debe llegar vacío. */
  [HONEYPOT_FIELD]: z.string().max(0).optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Traduce las claves de error del esquema a mensajes de la interfaz. */
export const CONTACT_ERRORS: Record<string, string> = {
  requiredName: 'Escribe tu nombre.',
  requiredEmail: 'Escribe tu correo electrónico.',
  invalidEmail: 'El correo electrónico no tiene un formato válido.',
  requiredMessage: 'Escribe un mensaje de al menos 10 caracteres.',
  requiredConsent: 'Debes aceptar el aviso de privacidad para continuar.',
};
