import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ onSendMessage, sending, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !sending && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      {/* Message Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled || sending}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
          style={{ 
            minHeight: '44px',
            maxHeight: '120px'
          }}
          rows={1}
        />
      </div>
      
      {/* Send Button */}
      <motion.button
        type="submit"
        disabled={!message.trim() || sending || disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-12 h-12 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        style={{ 
          backgroundColor: message.trim() && !sending && !disabled ? '#3B82F6' : '#E5E7EB',
          color: message.trim() && !sending && !disabled ? 'white' : '#9CA3AF'
        }}
      >
        {sending ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Send size={20} />
        )}
      </motion.button>
    </form>
  );
};

export default ChatInput;

