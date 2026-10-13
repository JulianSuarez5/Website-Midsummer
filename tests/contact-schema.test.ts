/**
 * Pruebas del esquema del formulario de contacto.
 *
 * El esquema es la frontera de confianza del formulario: lo que no pasa aquí
 * tampoco debería llegar al backend. Se prueban los límites (lo que el
 * navegador no debe poder mandar) y no la redacción de los textos.
 */
import { describe, expect, it } from 'vitest';
import {
  CONTACT_ERRORS,
  HONEYPOT_FIELD,
  contactSchema,
} from '../src/features/contact/schema';

const valid = {
  name: 'Ana Restrepo',
  company: 'Constructora Norte',
  email: 'ana@example.com',
  phone: '+57 300 000 0000',
  subject: 'Proyecto industrial',
  message: 'Quisiéramos información sobre un proyecto en Antioquia.',
  consent: true as const,
};

describe('contactSchema', () => {
  it('acepta un envío válido', () => {
    const result = contactSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it('exige nombre, correo, mensaje y consentimiento', () => {
    const result = contactSchema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;

    const fields = result.error.issues.map((issue) => issue.path[0]);

    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('message');
    expect(fields).toContain('consent');
  });

  it('rechaza un correo que no es un correo', () => {
    const result = contactSchema.safeParse({ ...valid, email: 'ana@@example' });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues[0]?.message).toBe('invalidEmail');
  });

  it('exige consentimiento explícito', () => {
    const result = contactSchema.safeParse({ ...valid, consent: 'sí' });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues[0]?.message).toBe('requiredConsent');
  });

  it('rechaza un mensaje demasiado corto', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'hola' });

    expect(result.success).toBe(false);
  });

  it('descarta un envío con el campo trampa relleno', () => {
    const result = contactSchema.safeParse({
      ...valid,
      [HONEYPOT_FIELD]: 'https://spam.example',
    });

    expect(result.success).toBe(false);
  });

  it('acepta el campo trampa vacío, que es lo normal en un envío humano', () => {
    const result = contactSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: '' });

    expect(result.success).toBe(true);
  });

  it('acepta los campos opcionales vacíos', () => {
    const result = contactSchema.safeParse({
      ...valid,
      company: '',
      phone: '',
      subject: '',
    });

    expect(result.success).toBe(true);
  });

  it('asigna un mensaje de interfaz a cada clave de error del esquema', () => {
    for (const key of Object.keys(CONTACT_ERRORS)) {
      expect(CONTACT_ERRORS[key]).toBeTypeOf('string');
      expect(CONTACT_ERRORS[key].length).toBeGreaterThan(0);
    }
  });
});
