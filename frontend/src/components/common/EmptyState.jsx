export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-light py-16 px-6 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
          <Icon size={22} className="text-slate" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
