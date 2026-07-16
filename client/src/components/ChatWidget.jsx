import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useChat } from '../contexts/ChatContext';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import api from '../services/api';

const ChatWidget = () => {
  const { user } = useAuth();
  const { isWidgetOpen, toggleWidget, activeChatUser, setActiveChatUser, socket } = useChat();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const unreadTotal = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  useEffect(() => {
    if (!user) return;
    if (isWidgetOpen && !activeChatUser) {
      loadConversations();
    }
  }, [isWidgetOpen, activeChatUser, user]);

  useEffect(() => {
    if (activeChatUser && isWidgetOpen) {
      loadMessages(activeChatUser._id);
    }
  }, [activeChatUser, isWidgetOpen]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        if (activeChatUser && (msg.sender._id === activeChatUser._id || msg.receiver._id === activeChatUser._id || msg.sender === activeChatUser._id || msg.receiver === activeChatUser._id)) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        } else {
          loadConversations();
        }
      };

      socket.on('newMessage', handleNewMessage);
      return () => {
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [socket, activeChatUser]);

  const loadConversations = async () => {
    setLoadingConv(true);
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const loadMessages = async (userId) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !activeChatUser) return;

    setSending(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('content', newMessage.trim());
      if (selectedImage) formData.append('image', selectedImage);

      const res = await api.post(`/messages/${activeChatUser._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewMessage('');
      setSelectedImage(null);
      setImagePreview('');
      setMessages((prev) => [...prev, res.data]);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isWidgetOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              {activeChatUser && (
                <button onClick={() => setActiveChatUser(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {activeChatUser && (
                <Avatar className="h-8 w-8 border border-white/25 shadow-sm shrink-0 bg-white">
                  {activeChatUser.avatar ? (
                    <img src={activeChatUser.avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-bold">
                      {activeChatUser.role === 'Admin' ? 'S' : `${activeChatUser.firstName?.[0] || ''}${activeChatUser.lastName?.[0] || ''}`}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              <h3 className="font-semibold text-lg">
                {activeChatUser 
                  ? (activeChatUser.role === 'Admin' ? 'Support' : `${activeChatUser.firstName} ${activeChatUser.lastName}`) 
                  : 'Messages'}
              </h3>
            </div>
            <button onClick={toggleWidget} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
            {!activeChatUser ? (
              /* Conversations List */
              <div className="p-2 space-y-1 h-full">
                {loadingConv ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                    <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                    <p>No conversations yet.</p>
                    <p className="text-xs mt-1">
                      {user.role === 'Customer' 
                        ? 'Book a caretaker to start chatting!' 
                        : 'Customers will message you here.'}
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => setActiveChatUser(conv.partner)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl transition-colors text-left relative"
                    >
                      <Avatar className="h-12 w-12 border border-gray-200 shadow-sm">
                        {conv.partner.avatar ? (
                          <img src={conv.partner.avatar} alt="Avatar" className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-teal-100 text-teal-700">
                            {conv.partner.role === 'Admin' ? 'S' : `${conv.partner.firstName?.[0] || ''}${conv.partner.lastName?.[0] || ''}`}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-teal-700' : 'text-gray-900'}`}>
                            {conv.partner.role === 'Admin' ? 'Support' : `${conv.partner.firstName} ${conv.partner.lastName}`}
                          </p>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                          {conv.latestMessage.imageUrl ? '📷 Image' : conv.latestMessage.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="h-3 w-3 bg-red-500 rounded-full shrink-0"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Active Chat Area */
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender._id === user.id || msg.sender === user.id;
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isMe 
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-br-sm shadow-sm' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            {msg.imageUrl && (
                              <img src={msg.imageUrl} alt="Attachment" className="rounded-lg mb-2 max-h-48 object-contain" />
                            )}
                            {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-3 border-t border-gray-200">
                  {imagePreview && (
                    <div className="relative inline-block mb-2">
                      <img src={imagePreview} alt="Preview" className="h-20 rounded-md border border-gray-200 shadow-sm" />
                      <button
                        onClick={() => { setSelectedImage(null); setImagePreview(''); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors mb-0.5"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 max-h-32 min-h-[40px] resize-none rounded-xl border border-gray-300 p-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-gray-50"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={sending || (!newMessage.trim() && !selectedImage)}
                      className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-teal-600 hover:bg-teal-700 shadow-md mb-0.5"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleWidget}
        className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full p-4 shadow-xl transform transition-transform hover:scale-105 flex items-center justify-center relative"
      >
        {isWidgetOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isWidgetOpen && unreadTotal > 0 && (
          <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
