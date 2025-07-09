interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-[--neutral-text-primary] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-[--neutral-text-secondary] text-lg">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full px-4 py-2 ${icon ? 'pl-10' : ''}
            rounded-lg border border-gray-300
            focus:outline-none focus:ring-2 focus:ring-[--primary-blue] focus:border-transparent
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
