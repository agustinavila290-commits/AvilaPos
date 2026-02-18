export default function MetricCard({ title, value, icon, color = 'blue', trend, subtitle }) {
  const colorVariants = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30 hover:shadow-blue-500/40',
      icon: 'bg-blue-100 text-blue-600',
    },
    green: {
      bg: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30 hover:shadow-green-500/40',
      icon: 'bg-green-100 text-green-600',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30 hover:shadow-orange-500/40',
      icon: 'bg-orange-100 text-orange-600',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/30 hover:shadow-red-500/40',
      icon: 'bg-red-100 text-red-600',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/30 hover:shadow-purple-500/40',
      icon: 'bg-purple-100 text-purple-600',
    },
  };

  const variant = colorVariants[color] || colorVariants.blue;

  return (
    <div className={`metric-card ${variant.shadow} animate-scale-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span className={`text-xs font-semibold ${trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${variant.icon} flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0 ml-2`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
