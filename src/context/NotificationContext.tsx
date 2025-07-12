import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, NotificationType } from '../components/common/Notification';

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationState {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    setTimeout(() => {
      setNotification(null);
    }, 300); // Delay to allow for animation
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};
