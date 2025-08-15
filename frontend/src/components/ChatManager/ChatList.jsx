import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Search, Filter, X, Clock, User, 
  Building, Mail, MapPin, ChevronRight, Loader2, RefreshCw 
} from 'lucide-react';
import api from '../../services/authService';

const ChatList = forwardRef(({ onSelectChat, selectedChatId, onNewChat }, ref) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchChatRooms = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await api.get('/management/chat-rooms/');
      setChatRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Expose fetchChatRooms function to parent component
  useImperativeHandle(ref, () => ({
    fetchChatRooms
  }));

  const handleManualRefresh = () => {
    fetchChatRooms(true);
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const filteredChatRooms = chatRooms.filter(chatRoom => {
    const matchesSearch = 
      chatRoom.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chatRoom.manufacturer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chatRoom.request_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Messages
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewChat}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
            >
              <MessageCircle size={16} />
              <span>New Chat</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 text-gray-600"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                showFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg border border-gray-200 bg-gray-50"
          >
            <p className="text-sm text-gray-600">
              Filter options coming soon...
            </p>
          </motion.div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChatRooms.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-700">
              No chats found
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start a conversation by approving a manufacturer request'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChatRooms.map((chatRoom) => (
              <motion.div
                key={chatRoom.id}
                whileHover={{ backgroundColor: '#F9FAFB' }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedChatId === chatRoom.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => onSelectChat(chatRoom)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm truncate text-gray-900">
                        {chatRoom.request_title || 'Chat'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {chatRoom.unread_count > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full text-white bg-blue-500">
                            {chatRoom.unread_count}
                          </span>
                        )}
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-1">
                        <User size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {chatRoom.customer_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {chatRoom.manufacturer_name}
                        </span>
                      </div>
                    </div>

                    {/* Last Message */}
                    {chatRoom.last_message && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate flex-1 text-gray-600">
                          <span className="font-medium text-gray-900">
                            {chatRoom.last_message.sender_name}:
                          </span>{' '}
                          {chatRoom.last_message.message}
                        </p>
                        <div className="flex items-center space-x-1 ml-2">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTime(chatRoom.last_message.created_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatList;
