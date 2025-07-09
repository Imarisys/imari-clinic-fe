import { useState, useCallback } from 'react';
import { NotificationType } from '../components/common/Notification';

interface NotificationState {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string
  ) => {
    const id = Date.now().toString();
    setNotification({
      id,
      type,
      title,
      message,
      isVisible: true,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
    // Remove notification after animation
    setTimeout(() => setNotification(null), 300);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
