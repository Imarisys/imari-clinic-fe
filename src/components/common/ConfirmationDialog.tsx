import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'help';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-error-500';
      case 'warning':
        return 'text-warning-500';
      case 'info':
        return 'text-primary-500';
      default:
        return 'text-neutral-500';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full bg-${variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'primary'}-100 flex items-center justify-center`}>
            <span className={`material-icons-round text-3xl ${getIconColor()}`}>
              {getIcon()}
            </span>
          </div>
        </div>

        <p className="text-neutral-600 mb-8 text-lg">{message}</p>

        <div className="flex space-x-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant={getButtonVariant()}
            fullWidth
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
