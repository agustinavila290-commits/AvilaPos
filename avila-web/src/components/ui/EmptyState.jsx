/**
 * Empty state reutilizable.
 *
 * Props:
 *   icon     — emoji o SVG JSX
 *   title    — título
 *   message  — descripción
 *   actions  — array de { label, onClick, primary? }
 *   dark     — boolean: tema oscuro
 */
export default function EmptyState({ icon, title, message, actions = [], dark = false }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center ${dark ? 'text-white' : ''}`}>
      {/* Ícono con halo */}
      <div className={`relative mb-6 ${dark ? '' : ''}`}>
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${dark ? 'bg-brand-blue' : 'bg-brand-blue'}`} />
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-4xl
                         ${dark ? 'bg-plate border border-white/10' : 'bg-brand-bg border border-brand-border'}`}>
          {icon || '🔍'}
        </div>
      </div>

      <h3 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-brand-text'}`}>
        {title || 'Sin resultados'}
      </h3>
      {message && (
        <p className={`text-sm mb-6 max-w-xs ${dark ? 'text-gray-400' : 'text-brand-muted'}`}>
          {message}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, i) => (
            action.href ? (
              <a
                key={i}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className={action.primary ? 'btn-primary' : 'btn-secondary'}
              >
                {action.label}
              </a>
            ) : (
              <button
                key={i}
                onClick={action.onClick}
                className={action.primary ? 'btn-primary' : (dark ? 'btn-ghost' : 'btn-secondary')}
              >
                {action.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}
