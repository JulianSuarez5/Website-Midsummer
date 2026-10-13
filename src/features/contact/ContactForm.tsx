/**
 * Formulario de contacto.
 *
 * Estado actual: PROTOTIPO. Valida en el cliente, muestra estados y no envía
 * a ninguna parte. La entrega real se implementa en la etapa 5 y DEBE
 * revalidar en el servidor: la validación del navegador es una ayuda de UX,
 * nunca una medida de seguridad.
 *
 * Accesibilidad:
 *   - Cada campo tiene `<label>` real, no `placeholder` como sustituto.
 *   - Los errores se asocian con `aria-describedby` y el campo recibe
 *     `aria-invalid`.
 *   - El mensaje de resultado se anuncia con `role="status"`.
 *   - El envío se puede cancelar y el botón se deshabilita mientras está en
 *     curso, para evitar mensajes duplicados.
 */
import { useId, useState, type SubmitEvent } from 'react';
import { CONTACT_ERRORS, HONEYPOT_FIELD, contactSchema } from './schema';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Errors = Partial<Record<string, string>>;

const fieldClass =
  'w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-base ' +
  'placeholder:text-neutral-400 transition-colors focus:border-accent ' +
  'aria-[invalid=true]:border-danger';

interface FieldProps {
  id: string;
  name: string;
  label: string;
  error?: string;
  optional?: boolean;
  type?: string;
  autoComplete?: string;
  as?: 'input' | 'textarea';
}

function Field({
  id,
  name,
  label,
  error,
  optional,
  type = 'text',
  autoComplete,
  as = 'input',
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-muted-foreground">(opcional)</span>
        )}
      </label>

      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : hintId}
          className={`${fieldClass} mt-1.5 resize-y`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : hintId}
          className={`${fieldClass} mt-1.5`}
        />
      )}

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        <span id={hintId} className="sr-only">
          {optional ? 'Campo opcional' : 'Campo obligatorio'}
        </span>
      )}
    </div>
  );
}

export default function ContactForm() {
  const uid = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === 'submitting') return;

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, unknown>;

    const parsed = contactSchema.safeParse(data);

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        next[key] ??= CONTACT_ERRORS[issue.message] ?? 'Revisa este campo.';
      }
      setErrors(next);
      setStatus('idle');
      return;
    }

    setErrors({});
    setStatus('submitting');

    // PROTOTIPO: aquí se conectaría el endpoint real.
    // El servidor DEBE validar de nuevo con el mismo `contactSchema`.
    await new Promise((resolve) => setTimeout(resolve, 600));

    form.reset();
    setStatus('success');
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          name="name"
          label="Nombre"
          autoComplete="name"
          error={errors.name}
        />
        <Field
          id={`${uid}-company`}
          name="company"
          label="Empresa"
          autoComplete="organization"
          optional
          error={errors.company}
        />
        <Field
          id={`${uid}-email`}
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          error={errors.email}
        />
        <Field
          id={`${uid}-phone`}
          name="phone"
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          optional
          error={errors.phone}
        />
      </div>

      <Field
        id={`${uid}-subject`}
        name="subject"
        label="Asunto"
        optional
        error={errors.subject}
      />

      <Field
        id={`${uid}-message`}
        name="message"
        label="Mensaje"
        as="textarea"
        error={errors.message}
      />

      {/*
        Campo trampa contra robots. Oculto a la vista, visible para un
        lector de pantalla solo si se usa `sr-only` en lugar de `hidden`.
        Si un robot lo rellena, el envío se descarta sin llegar al servidor.
      */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={`${uid}-website`}>Sitio web</label>
        <input
          id={`${uid}-website`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            name="consent"
            type="checkbox"
            required
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong accent-[var(--color-accent)]"
            aria-invalid={errors.consent ? 'true' : undefined}
            aria-describedby={errors.consent ? `${uid}-consent-error` : undefined}
          />
          <span>
            He leído y acepto el{' '}
            <a href="/privacidad/" className="text-accent underline">
              aviso de privacidad
            </a>{' '}
            y el tratamiento de mis datos personales.
          </span>
        </label>

        {errors.consent && (
          <p id={`${uid}-consent-error`} className="mt-1.5 text-sm text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
        </button>

        <p role="status" aria-live="polite" className="text-sm">
          {status === 'success' && (
            <span className="text-success">
              Gracias. Tu mensaje fue enviado y te responderemos pronto.
            </span>
          )}
          {status === 'error' && (
            <span className="text-danger">
              No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
