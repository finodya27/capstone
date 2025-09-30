import React from 'react';

const FireAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-600 font-medium">All Clear</p>
          <p className="text-green-500 text-sm">No fire alerts detected</p>
        </div>
      </div>
    );
  }
  
  // Fungsi untuk mendapatkan warna berdasarkan severity
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-red-100',
          icon: 'text-red-200'
        };
      case 'high':
        return {
          bg: 'bg-orange-500',
          border: 'border-orange-600',
          text: 'text-orange-100',
          icon: 'text-orange-200'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-yellow-100',
          icon: 'text-yellow-200'
        };
      default:
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-red-100',
          icon: 'text-red-200'
        };
    }
  };

  // Fungsi untuk format waktu
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Fungsi untuk menghitung waktu sejak alert
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    try {
      const now = new Date();
      const alertTime = new Date(timestamp);
      const diffMs = now - alertTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="p-6">
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-600 font-medium text-lg mb-2">All Clear</p>
            <p className="text-green-500 text-sm">No fire alerts detected - System monitoring normally</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alerts.map((alert, index) => {
            const colors = getSeverityColor(alert.severity);
            const timeAgo = getTimeAgo(alert.timestamp);
            
            return (
              <div 
                key={alert.id || index} 
                className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-4 shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">
                      <svg className={`w-5 h-5 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                    </div>
                    <h3 className={`font-bold text-lg ${colors.text}`}>
                      🔥 Fire Alert
                    </h3>
                  </div>
                  
                  {timeAgo && (
                    <span className={`text-xs ${colors.text} opacity-80 bg-black/20 px-2 py-1 rounded-full whitespace-nowrap`}>
                      {timeAgo}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Severity Badge */}
                  {alert.severity && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-3 py-1 bg-black/20 rounded-full text-xs font-bold uppercase ${colors.text}`}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {alert.severity}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start space-x-2">
                    <svg className={`w-4 h-4 ${colors.icon} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className={`text-sm font-medium ${colors.text} mb-1`}>Location</p>
                      <p className={`text-xs ${colors.text} opacity-90 font-mono`}>
                        {alert.location?.latitude && alert.location?.longitude
                          ? `${alert.location.latitude.toFixed(6)}, ${alert.location.longitude.toFixed(6)}`
                          : 'Unknown location'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-start space-x-2">
                    <svg className={`w-4 h-4 ${colors.icon} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className={`text-sm font-medium ${colors.text} mb-1`}>Detection Time</p>
                      <p className={`text-xs ${colors.text} opacity-90`}>
                        {formatTime(alert.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Additional info if available */}
                  {alert.confidence && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/20">
                      <span className={`text-xs ${colors.text} opacity-80`}>Confidence Level</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-2 bg-black/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white/60 transition-all duration-500"
                            style={{ width: `${Math.min(alert.confidence || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${colors.text}`}>{alert.confidence}%</span>
                      </div>
                    </div>
                  )}

                  {alert.description && (
                    <div className="mt-2 pt-2 border-t border-black/20">
                      <p className={`text-xs ${colors.text} italic opacity-90`}>
                        {alert.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {alerts.length > 6 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium">
            View All {alerts.length} Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default FireAlerts;