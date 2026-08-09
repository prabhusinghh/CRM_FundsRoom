export function FormField({ label, error, required, children }) {
  return (
    <div className="mb-4">
      <label className="label">
        {label}
        {required && <span className="text-signal"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-signal">{error}</p>}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`input ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`input ${props.className || ''}`} rows={props.rows || 3} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`input ${props.className || ''}`}>
      {children}
    </select>
  );
}
