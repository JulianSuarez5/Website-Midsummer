/**
 * Menú móvil.
 *
 * Es la única isla de React en el encabezado, porque necesita estado real
 * (abierto/cerrado), bloqueo de scroll, cierre con Escape y gestión de foco.
 * Reimplementarlo con `<details>` obligaría a aceptar compromisos ilegibles de
 * accesibilidad.
 *
 * Accesibilidad implementada a propósito, no por accidente:
 *   - `<button>` real con `aria-expanded` y `aria-controls`.
 *   - Diálogo con `role="dialog"`, foco atrapado y devuelto al botón.
 *   - Cierre con Escape y al navegar.
 *   - El scroll del documento se bloquea mientras el menú está abierto.
 */
import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.tsx';
import type { NavItem } from '../../config/nav.config';
import { t } from '../../lib/i18n';

interface Props {
  items: readonly NavItem[];
  currentPath: string;
  contactHref: string;
}

function isCurrent(href: string, currentPath: string): boolean {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

export default function MobileNav({ items, currentPath, contactHref }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Bloquea el scroll del documento mientras el panel está abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      // Trampa de foco: el tabulador no debe salirse del diálogo abierto.
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="menu-movil"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-neutral-100"
      >
        <span className="sr-only">{open ? t.common.closeMenu : t.common.openMenu}</span>
        <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t.common.openMenu}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-neutral-900/40"
          />

          <div
            ref={panelRef}
            id="menu-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto border-b border-border bg-surface px-5 pb-8 pt-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Midsummer Colombia
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-neutral-100"
              >
                <span className="sr-only">{t.common.closeMenu}</span>
                <Icon name="close" className="h-6 w-6" />
              </button>
            </div>

            <nav aria-label={t.common.mainNavigation} className="mt-4">
              <ul className="flex flex-col">
                {items.map((item) => {
                  const current = isCurrent(item.href, currentPath);
                  return (
                    <li
                      key={item.href}
                      className="border-b border-border last:border-0"
                    >
                      <a
                        href={item.href}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-14 items-center text-base font-medium no-underline ${
                          current ? 'text-accent' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <a
              href={contactHref}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent px-5 py-3 font-semibold text-accent-contrast no-underline"
            >
              {t.actions.contact}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
