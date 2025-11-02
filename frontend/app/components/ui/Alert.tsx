import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info ,X} from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: <CheckCircle className="text-green-600" size={20} />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: <XCircle className="text-red-600" size={20} />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: <AlertCircle className="text-yellow-600" size={20} />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: <Info className="text-blue-600" size={20} />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-lg p-4 flex items-start gap-3 ${className}`}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${style.text} mb-1`}>{title}</h3>
        )}
        <p className={`text-sm ${style.text}`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.text} hover:opacity-70`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};