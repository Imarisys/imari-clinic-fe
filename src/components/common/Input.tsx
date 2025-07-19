import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  error?: string;
  success?: boolean;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  iconPosition = 'left',
  error,
  success,
  helperText,
  variant = 'default',
  className = '',
  disabled,
  ...props
}) => {
  const baseInputClasses = 'w-full transition-all duration-300 focus:outline-none';

  const variantClasses = {
    default: 'input-modern',
    filled: 'bg-gradient-to-r from-neutral-100 to-neutral-50 border-0 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-purple-400/50',
    outlined: 'bg-transparent border-2 border-neutral-200 rounded-xl px-4 py-3 focus:border-purple-400 hover:border-purple-300'
  };

  const getInputStateClasses = () => {
    if (error) return 'border-accent-400 focus:ring-accent-400/50 focus:border-accent-400';
    if (success) return 'border-success-400 focus:ring-success-400/50 focus:border-success-400';
    return '';
  };

  const getIconColor = () => {
    if (error) return 'text-accent-500';
    if (success) return 'text-success-500';
    return 'text-neutral-500';
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;

    return (
      <div className={`absolute top-1/2 transform -translate-y-1/2 ${
        position === 'left' ? 'left-3' : 'right-3'
      } transition-colors duration-300`}>
        <span className={`material-icons-round ${getIconColor()} text-xl`}>
          {icon}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          {label}
          {props.required && <span className="text-accent-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group">
        {renderIcon('left')}

        <input
          className={`
            ${baseInputClasses}
            ${variantClasses[variant]}
            ${getInputStateClasses()}
            ${icon && iconPosition === 'left' ? 'pl-12' : 'pl-4'}
            ${icon && iconPosition === 'right' ? 'pr-12' : 'pr-4'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />

        {renderIcon('right')}

        {/* Focus indicator */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-focus-within:border-gradient opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      {/* Helper text, error, or success message */}
      {(error || success || helperText) && (
        <div className="flex items-center space-x-2 mt-2">
          {error && (
            <>
              <span className="material-icons-round text-accent-500 text-sm">error</span>
              <p className="text-sm text-accent-600 font-medium">{error}</p>
            </>
          )}
          {success && !error && (
            <>
              <span className="material-icons-round text-success-500 text-sm">check_circle</span>
              <p className="text-sm text-success-600 font-medium">Looks good!</p>
            </>
          )}
          {helperText && !error && !success && (
            <p className="text-sm text-neutral-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};
