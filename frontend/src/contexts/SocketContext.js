import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to socket when component mounts
    socketService.connect();
    setSocket(socketService);

    // Update connection status
    const updateConnectionStatus = () => {
      setIsConnected(socketService.isConnected());
    };

    socketService.on('connect', updateConnectionStatus);
    socketService.on('disconnect', updateConnectionStatus);

    updateConnectionStatus();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    joinRoom: socketService.joinRoom.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    emit: socketService.emit.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
