import React from 'react';
import { bindStyle } from '../../util/classnames.js';
import styles from './button.module.scss';

const cx = bindStyle(styles);

export enum ButtonTheme {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

export enum ButtonSize {
  Large = 'Large',
  Medium = 'Medium',
  Small = 'Small',
}

export interface ButtonGradient {
  from: string;
  to: string;
}

interface ButtonProps<T> {
  value?: T;
  className?: string;
  text?: string;
  disabled?: boolean;
  size?: ButtonSize;
  imageSrc?: string;
  theme?: ButtonTheme;
  gradient?: ButtonGradient;
  color?: string;
  style?: any;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, value?: T) => void;
}

function getGradientStyle(gradient?: ButtonGradient) {
  return gradient
    ? {
        background: `linear-gradient(134.14deg, ${gradient.from} 18.37%, ${gradient.to} 82.04%)`,
      }
    : undefined;
}

function getTextStyle(color?: string) {
  return color
    ? {
        color,
      }
    : undefined;
}

export function Button<T>(props: ButtonProps<T>) {
  const {
    disabled,
    value,
    className,
    text,
    gradient,
    size,
    color,
    imageSrc,
    theme = ButtonTheme.Primary,
    onClick,
    style
  } = props;

  return (
    <div
      className={cx(
        styles.button,
        disabled && styles.disabled,
        theme === ButtonTheme.Primary && styles.primary,
        theme === ButtonTheme.Secondary && styles.secondary,
        size === ButtonSize.Large && styles.large,
        size === ButtonSize.Medium && styles.medium,
        size === ButtonSize.Small && styles.small,
        className,
      )}
      style={style ? Object.assign(style, getGradientStyle(gradient)) : getGradientStyle(gradient)}
      onClick={event => {
        if (!disabled) onClick?.(event, value);
      }}
    >
      <div className={styles.text} style={getTextStyle(color)}>
        {text}
        {imageSrc && <img src={imageSrc} alt="" className={styles.image} />}
      </div>
    </div>
  );
}
