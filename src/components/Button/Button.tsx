import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tip';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Dekoratives Icon vor dem Text; der Text bleibt das Label. */
  icon?: IconName | undefined;
  fullWidth?: boolean;
  /** Nur das Icon zeigen; der Text bleibt als zugänglicher Name erhalten. */
  iconOnly?: boolean;
}

export function Button({
  variant = 'primary',
  icon,
  fullWidth = false,
  iconOnly = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, iconOnly && styles.iconOnly, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} data-variant={variant} {...rest}>
      {icon && <Icon name={icon} />}
      <span className={iconOnly ? 'visually-hidden' : undefined}>{children}</span>
    </button>
  );
}
