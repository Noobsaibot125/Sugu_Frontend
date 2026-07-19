import './Button.css';

/**
 * Bouton Sugu.
 * variant : primary | secondary | outline | ghost | danger | accent | inverse
 * size    : sm | md | lg
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  as: Tag = 'button',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'sugu-btn',
    `sugu-btn--${variant}`,
    `sugu-btn--${size}`,
    fullWidth ? 'sugu-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
