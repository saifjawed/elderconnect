import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');
      const newSocket = io(socketUrl);
      setSocket(newSocket);
      
      newSocket.emit('join', user._id || user.id);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  const openChatWith = (targetUser) => {
    setActiveChatUser(targetUser);
    setIsWidgetOpen(true);
  };

  const closeChat = () => {
    setIsWidgetOpen(false);
  };

  const toggleWidget = () => {
    setIsWidgetOpen((prev) => !prev);
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        activeChatUser,
        isWidgetOpen,
        openChatWith,
        closeChat,
        toggleWidget,
        setActiveChatUser
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};
