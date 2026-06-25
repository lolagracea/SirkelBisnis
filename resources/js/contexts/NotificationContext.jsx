import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: 'AI Insight Baru', 
      message: 'Stok singkong diperkirakan habis dalam 6 hari. Disarankan restock.', 
      time: '10 menit lalu', 
      read: false,
      type: 'ai'
    },
    { 
      id: 2, 
      title: 'Patungan Berhasil', 
      message: 'Patungan Tepung Tapioka mencapai target dan siap dikirim!', 
      time: '2 jam lalu', 
      read: false,
      type: 'patungan'
    },
    { 
      id: 3, 
      title: 'Supplier Terverifikasi', 
      message: 'CV Tani Sejahtera kini berstatus Elite Supplier.', 
      time: '1 hari lalu', 
      read: true,
      type: 'system'
    }
  ]);

  const addNotification = (title, message, type = 'system') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'Baru saja',
      read: false,
      type
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
