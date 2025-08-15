import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, ArrowLeft, User, Building, Clock, 
  Loader2, MessageCircle, Info, RefreshCw, MoreVertical, Trash2
} from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import DeleteChatModal from './DeleteChatModal';

const ChatRoom = ({ chatRoom, onBack, onChatDeleted }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchMessages = async (isRefresh = false) => {
    if (!chatRoom) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await api.get(`/management/chat-rooms/${chatRoom.id}/`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !chatRoom) return;
    
    try {
      setSending(true);
      const response = await api.post(`/management/chat-rooms/${chatRoom.id}/send_message/`, {
        message: messageText
      });
      
      setMessages(prev => [...prev, response.data.message_data]);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!chatRoom) return;
    
    try {
      setDeleting(true);
      await api.post(`/management/chat-rooms/${chatRoom.id}/delete_for_user/`);
      
      // Close modal and notify parent component
      setShowDeleteModal(false);
      setShowMenu(false);
      
      // Call parent callback to handle navigation (chat is now deleted)
      if (onChatDeleted) {
        onChatDeleted(chatRoom.id);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError('Failed to delete chat');
    } finally {
      setDeleting(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Get current user info
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/profile/');
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    
    fetchCurrentUser();
    fetchMessages();
    
    // Set up real-time polling for new messages
    const pollInterval = setInterval(() => {
      fetchMessages(true); // Refresh messages every 3 seconds
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [chatRoom?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Group messages by date and sender
  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at).toDateString();
      const prevMessage = messages[index - 1];
      const prevMessageDate = prevMessage ? new Date(prevMessage.created_at).toDateString() : null;
      
      const isNewDate = messageDate !== prevMessageDate;
      const isNewSender = !prevMessage || prevMessage.sender !== message.sender;
      
      if (isNewDate || isNewSender) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          date: messageDate,
          sender: message.sender,
          messages: [message],
          showDate: isNewDate
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  if (!chatRoom) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2 text-gray-700">
            Select a chat to start messaging
          </h3>
          <p className="text-sm text-gray-500">
            Choose a conversation from the list to begin
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessages(messages);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {chatRoom.customer_name?.charAt(0) || 'C'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {chatRoom.request_title || 'Chat'}
                </h3>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{chatRoom.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building size={12} />
                    <span>{chatRoom.manufacturer_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchMessages(true)}
              disabled={loading || refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''} text-gray-600`} />
            </button>
            
            {/* More Options Menu */}
            <div className="relative menu-container">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical size={16} className="text-gray-600" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete Chat</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">
              {error}
            </p>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-700">
              No messages yet
            </h3>
            <p className="text-sm text-gray-500">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {messageGroups.map((group, groupIndex) => (
                <motion.div
                  key={`${group.date}-${group.sender}-${groupIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {group.messages.map((message, messageIndex) => (
                    <ChatMessage 
                      key={message.id}
                      message={message} 
                      isOwnMessage={message.sender === currentUser?.id}
                      showSender={messageIndex === 0}
                      showDate={group.showDate && messageIndex === 0}
                    />
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <ChatInput 
          onSendMessage={sendMessage} 
          sending={sending}
          disabled={loading || error}
        />
      </div>

      {/* Delete Chat Modal */}
      <DeleteChatModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteChat}
        chatTitle={chatRoom?.request_title || 'this conversation'}
      />
    </div>
  );
};

export default ChatRoom;
