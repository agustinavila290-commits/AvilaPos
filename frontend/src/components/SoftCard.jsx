export default function SoftCard({ title, children, actions, icon, className = '' }) {
  return (
    <div className={`card ${className} animate-fade-in`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {icon && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white text-base sm:text-lg shadow-lg shadow-blue-500/30 flex-shrink-0">
                {icon}
              </div>
            )}
            {title && (
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h2>
            )}
          </div>
          {actions && (
            <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}
