import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-out rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-500 text-white shadow-primary hover:bg-primary-600 hover:scale-105 active:scale-95',
    secondary: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:scale-105 active:scale-95',
    accent: 'bg-primary-600 text-white shadow-medium hover:bg-primary-700 hover:scale-105 active:scale-95',
    success: 'bg-success-500 text-white shadow-medium hover:bg-success-600 hover:scale-105 active:scale-95',
    warning: 'bg-warning-500 text-white shadow-medium hover:bg-warning-600 hover:scale-105 active:scale-95',
    danger: 'bg-error-500 text-white shadow-medium hover:bg-error-600 hover:scale-105 active:scale-95',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 rounded-xl'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;

    return (
      <span className={`material-icons-round transition-transform duration-300 hover:scale-110 ${
        position === 'left' ? 'mr-2' : 'ml-2'
      } ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-xl'}`}>
        {icon}
      </span>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center">
          <div className="loading-spinner w-5 h-5 mr-2"></div>
          Loading...
        </div>
      );
    }

    return (
      <>
        {renderIcon('left')}
        <span className="relative z-10">{children}</span>
        {renderIcon('right')}
      </>
    );
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center">
        {renderContent()}
      </div>
    </button>
  );
};
