import './Avatar.css';

/** Avatar : image si `src`, sinon initiales sur fond terracotta. size en px. */
export default function Avatar({ src, nom = '', size = 40 }) {
  const initiales = nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0].toUpperCase())
    .join('');

  const style = { width: size, height: size, fontSize: size * 0.38 };

  return src ? (
    <img className="sugu-avatar" src={src} alt={nom} style={style} />
  ) : (
    <span className="sugu-avatar sugu-avatar--initiales" style={style}>
      {initiales || '?'}
    </span>
  );
}
