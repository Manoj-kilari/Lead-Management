import React from 'react';

const StatCard = ({ title, value, icon, change, changeType, color = 'primary', trend }) => {
  const colorClasses = {
    primary: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
  };

  const bgGradientClasses = {
    primary: 'from-blue-50 to-indigo-50',
    success: 'from-green-50 to-emerald-50',
    warning: 'from-amber-50 to-orange-50',
    danger: 'from-red-50 to-pink-50',
    purple: 'from-purple-50 to-indigo-50',
    pink: 'from-pink-50 to-rose-50',
  };

  return (
    <div className={`card-gradient hover-lift animate-fade-in bg-gradient-to-br ${bgGradientClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex-shrink-0 bg-gradient-to-r ${colorClasses[color]} rounded-xl p-3 shadow-lg animate-pulse-slow`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          <div>
            <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</dt>
            <dd className="flex items-baseline mt-1">
              <div className="text-3xl font-bold gradient-text">{value}</div>
              {change && (
                <div
                  className={`ml-3 flex items-baseline text-sm font-bold ${
                    changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <span className="mr-1">
                    {changeType === 'increase' ? 'up' : 'down'}
                  </span>
                  <span>{change}</span>
                </div>
              )}
            </dd>
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-4 rounded-full ${
                  i < trend ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gray-200'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {change && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">vs last period</span>
            <span className={`font-semibold ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? '+' : ''}{change}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
