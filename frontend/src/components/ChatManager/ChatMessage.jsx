import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, CheckCheck, Send } from 'lucide-react';
import { colors } from '../../constants/theme';

const ChatMessage = ({ message, isOwnMessage, showSender, showDate }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatusIcon = () => {
    if (!isOwnMessage) return null;
    
    // Use proper backend status instead of time-based logic
    if (message.is_read) {
      return <CheckCheck size={12} style={{ color: '#10B981' }} />; // Green for read
    } else {
      return <Check size={12} style={{ color: colors.textSecondary }} />; // Single check for sent
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender Name */}
        {showSender && !isOwnMessage && (
          <div className="mb-1 ml-2">
            <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              {message.sender_name}
            </span>
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm relative ${
            isOwnMessage 
              ? 'rounded-br-md text-white' 
              : 'rounded-bl-md bg-white border border-gray-200'
          }`}
          style={{
            color: isOwnMessage ? 'white' : colors.textPrimary,
            backgroundColor: isOwnMessage ? colors.primary : 'transparent',
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.message}
          </p>
          
          {/* Message Status and Time */}
          <div className={`flex items-center justify-between mt-2 ${
            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <div className="flex items-center space-x-1">
              {getMessageStatusIcon()}
              <span className="text-xs opacity-70">
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Date Separator */}
        {showDate && (
          <div className="text-center my-4">
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {formatDate(message.created_at)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;

