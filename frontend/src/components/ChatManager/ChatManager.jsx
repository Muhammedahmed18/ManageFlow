import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import NewChatModal from './NewChatModal';
import api from '../../services/authService';

const ChatManager = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatListRef = useRef(null);

  // Handle URL parameters and localStorage for opening specific chat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    
    if (chatId && !selectedChat) {
      handleOpenSpecificChat(chatId);
    }
    
    // Check for chat room from localStorage (from ContactRequests)
    const openChatRoom = localStorage.getItem('openChatRoom');
    if (openChatRoom && !selectedChat) {
      try {
        const chatRoom = JSON.parse(openChatRoom);
        setSelectedChat(chatRoom);
        localStorage.removeItem('openChatRoom');
      } catch (error) {
        console.error('Error parsing chat room from localStorage:', error);
        localStorage.removeItem('openChatRoom');
      }
    }
  }, []);

  const handleOpenSpecificChat = async (chatId) => {
    try {
      setLoading(true);
      const response = await api.get(`/management/chat-rooms/${chatId}/`);
      setSelectedChat(response.data);
      
      // Clear the URL parameter
      const url = new URL(window.location);
      url.searchParams.delete('chatId');
      window.history.replaceState({}, '', url);
    } catch (error) {
      console.error('Error fetching chat room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chatRoom) => {
    setSelectedChat(chatRoom);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const handleChatDeleted = (chatId) => {
    // Remove the deleted chat from selected chat
    if (selectedChat && selectedChat.id === chatId) {
      setSelectedChat(null);
    }
    
    // Refresh the chat list to remove the deleted chat
    if (chatListRef.current && chatListRef.current.fetchChatRooms) {
      chatListRef.current.fetchChatRooms();
    }
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleChatCreated = (chatRoom) => {
    setSelectedChat(chatRoom);
    setShowNewChatModal(false);
    
    // Refresh the chat list to show the new chat
    if (chatListRef.current && chatListRef.current.fetchChatRooms) {
      chatListRef.current.fetchChatRooms();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {selectedChat ? (
          <motion.div
            key="chat-room"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ChatRoom 
              chatRoom={selectedChat} 
              onBack={handleBackToList}
              onChatDeleted={handleChatDeleted}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ChatList 
              ref={chatListRef}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.id}
              onNewChat={handleNewChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default ChatManager;

