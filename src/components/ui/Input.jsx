import './Input.css';

/** Champ de formulaire Sugu avec libellé et message d'erreur optionnels. */
export default function Input({ label, error, id, as = 'input', ...props }) {
  const Tag = as;
  return (
    <div className="sugu-field">
      {label && (
        <label className="sugu-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <Tag id={id} className={`sugu-field__input ${error ? 'sugu-field__input--error' : ''}`} {...props} />
      {error && <p className="sugu-field__error">{error}</p>}
    </div>
  );
}
