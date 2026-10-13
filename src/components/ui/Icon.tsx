/**
 * Iconos de interfaz para islas React.
 *
 * Existe aparte de `Icon.astro` porque un componente Astro no se puede invocar
 * desde React: React lo trata como una función y Astro lanza
 * `InvalidComponentArgs`. Ambos consumen el mismo registro de paths
 * (`config/icons.ts`), así que el trazo nunca se desincroniza.
 */
import { ICON_PATHS, isFilledIcon, type IconName } from '../../config/icons';

export interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  const filled = isFilledIcon(name);

  return (
    <svg
      className={['h-5 w-5', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
