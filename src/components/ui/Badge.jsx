import './Badge.css';

/** Badge Sugu. tone : primary | secondary | accent | neutral */
export default function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`sugu-badge sugu-badge--${tone} ${className}`}>{children}</span>;
}
