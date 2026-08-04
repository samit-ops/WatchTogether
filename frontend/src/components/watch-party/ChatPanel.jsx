import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Send } from 'lucide-react';

export function ChatPanel({ socket, roomId, user, chatEnabled = true }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Map());
  const messagesEndRef = useRef(null);
  const typingTimeoutRefs = useRef({});
  const emitStopTypingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleUserTyping = ({ userId, name }) => {
      if (userId === user?.id) return;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, name);
        return newMap;
      });

      if (typingTimeoutRefs.current[userId]) {
        clearTimeout(typingTimeoutRefs.current[userId]);
      }
      
      typingTimeoutRefs.current[userId] = setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }, 3000);
    };

    const handleUserStopTyping = ({ userId }) => {
      if (typingTimeoutRefs.current[userId]) {
        clearTimeout(typingTimeoutRefs.current[userId]);
        delete typingTimeoutRefs.current[userId];
      }
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      Object.values(typingTimeoutRefs.current).forEach(clearTimeout);
      if (emitStopTypingTimeoutRef.current) clearTimeout(emitStopTypingTimeoutRef.current);
    };
  }, [socket, user?.id]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (chatEnabled && socket) {
      socket.emit('typing', { roomId });
      
      if (emitStopTypingTimeoutRef.current) {
        clearTimeout(emitStopTypingTimeoutRef.current);
      }
      emitStopTypingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { roomId });
      }, 2000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatEnabled || !socket) return;

    socket.emit('send-message', { roomId, message: inputValue });
    socket.emit('stop-typing', { roomId });
    if (emitStopTypingTimeoutRef.current) clearTimeout(emitStopTypingTimeoutRef.current);
    setInputValue('');
  };

  const typingNames = Array.from(typingUsers.values());
  const typingText = typingNames.length > 0 
    ? `${typingNames.join(', ')} ${typingNames.length > 1 ? 'are' : 'is'} typing...` 
    : '';

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          if (msg.system) {
            return (
              <div key={msg.id || i} className="text-center text-sm text-muted">
                {msg.text}
              </div>
            );
          }
          
          const isMe = msg.user?.id === user?.id;
          return (
            <div key={msg.id || i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className="text-xs text-muted mb-1">{msg.user?.name}</div>
              <div className={cn(
                "px-3 py-2 rounded-2xl max-w-[80%] text-sm",
                isMe ? "bg-primary text-white" : "bg-background text-text"
              )}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {typingText && (
          <div className="text-xs text-muted italic flex items-center gap-1">
            {typingText}
            <span className="flex space-x-1">
              <span className="animate-bounce delay-75">.</span>
              <span className="animate-bounce delay-150">.</span>
              <span className="animate-bounce delay-300">.</span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border">
        {!chatEnabled ? (
          <div className="text-center text-sm text-muted p-2">Chat disabled by host</div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-primary text-white p-2 rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
