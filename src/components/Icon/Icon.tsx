import type { SVGProps } from 'react';
import styles from './Icon.module.css';

export type IconName = 'check' | 'retry' | 'star' | 'hint' | 'arrow' | 'back' | 'lock';

const paths: Record<IconName, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  retry: 'M19 12a7 7 0 1 1-2.05-4.95M19 4.5V8h-3.5',
  star: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
};

const filled: ReadonlySet<IconName> = new Set(['star']);

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Sichtbarer Zustand braucht Text: Ohne label ist das Icon rein dekorativ. */
  label?: string;
}

export function Icon({ name, label, className, ...rest }: IconProps) {
  const isFilled = filled.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={[styles.icon, isFilled ? styles.filled : styles.stroked, className]
        .filter(Boolean)
        .join(' ')}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      data-icon={name}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
