export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
