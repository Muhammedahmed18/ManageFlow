import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, User, Building, MessageCircle, ChevronDown, ChevronUp,
  Clock, Loader2, Factory
} from 'lucide-react';
import api from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [creatingChat, setCreatingChat] = useState(null);
  
  const isManufacturer = currentUser?.role === 'manufacturer';
  const isCustomer = currentUser?.role === 'customer';

  const fetchApprovedData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      let dataKey = '';
      
      if (isManufacturer) {
        endpoint = '/management/manufacturer/approved-customers/';
        dataKey = 'customers';
      } else if (isCustomer) {
        endpoint = '/management/customer/approved-manufacturers/';
        dataKey = 'manufacturers';
      } else {
        throw new Error('Invalid user role');
      }
      
      const response = await api.get(endpoint);
      setData(response.data[dataKey] || []);
    } catch (error) {
      console.error('Failed to fetch approved data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApprovedData();
    }
  }, [isOpen]);

  const handleCreateChat = async (item, request) => {
    try {
      setCreatingChat(request.id);
      
      let response;
      
      if (request.type === 'business_relationship') {
        // Create chat for business relationship
        response = await api.get(`/management/chat-rooms/get_or_create_for_business/?business_id=${request.id}`);
      } else {
        // Create chat for contact request
        response = await api.get(`/management/chat-rooms/get_or_create_for_request/?request_id=${request.id}`);
      }
      
      // Call parent callback with the new chat room
      if (onChatCreated) {
        onChatCreated(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setCreatingChat(null);
    }
  };

  const toggleItemExpansion = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isManufacturer ? item.business_name : item.company_name)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle size={20} className="text-blue-600" />
              </div>
                                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
                            <p className="text-sm text-gray-500">
                              {isManufacturer ? 'Select a customer to start chatting' : 'Select a manufacturer to start chatting'}
                            </p>
                          </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                            type="text"
                            placeholder={isManufacturer ? "Search customers..." : "Search manufacturers..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                <span className="ml-3 text-gray-600">Loading customers...</span>
              </div>
                                    ) : filteredData.length === 0 ? (
                          <div className="text-center py-8">
                            {isManufacturer ? (
                              <User size={48} className="mx-auto mb-4 text-gray-400" />
                            ) : (
                              <Factory size={48} className="mx-auto mb-4 text-gray-400" />
                            )}
                            <h3 className="text-lg font-medium mb-2 text-gray-700">
                              {isManufacturer ? 'No customers found' : 'No manufacturers found'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? 'Try adjusting your search terms' : 
                                (isManufacturer ? 'No customers found. You need to either have approved contact requests or be joined to their businesses.' : 'No manufacturers found. You need to either have approved contact requests or be joined to their businesses.')}
                            </p>
                          </div>
            ) : (
                                        <div className="space-y-4">
                            {filteredData.map((item) => (
                              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                {/* Item Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                      {isManufacturer ? (
                                        <User size={20} className="text-gray-600" />
                                      ) : (
                                        <Factory size={20} className="text-gray-600" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        {isManufacturer ? (
                                          <>
                                            <Building size={12} />
                                            <span>{item.business_name}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Building size={12} />
                                            <span>{item.company_name}</span>
                                            <span className="mx-1">•</span>
                                            <span>{item.location}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => toggleItemExpansion(item.id)}
                                    className="p-1 rounded hover:bg-gray-100"
                                  >
                                    {expandedItems.has(item.id) ? (
                                      <ChevronUp size={16} className="text-gray-500" />
                                    ) : (
                                      <ChevronDown size={16} className="text-gray-500" />
                                    )}
                                  </button>
                                </div>

                                                    {/* Requests Preview */}
                                <div className="space-y-2">
                                  {item.approved_requests.slice(0, 3).map((request) => (
                                    <div
                                      key={request.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                      onClick={() => handleCreateChat(item, request)}
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <p className="text-sm font-medium text-gray-900">
                                            {request.title}
                                          </p>
                                          {request.type === 'business_relationship' && (
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                              Business
                                            </span>
                                          )}
                                          {request.type === 'contact_request' && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                              Request
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                          <Clock size={12} />
                                          <span>{formatDate(request.created_at)}</span>
                                          {request.chat_exists && (
                                            <span className="text-blue-600 font-medium">(Chat exists)</span>
                                          )}
                                        </div>
                                      </div>
                                      {creatingChat === request.id ? (
                                        <Loader2 className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                                      ) : (
                                        <MessageCircle size={16} className="text-blue-500" />
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* View All Button */}
                                  {item.total_requests > 3 && (
                                    <button
                                      onClick={() => toggleItemExpansion(item.id)}
                                      className="w-full text-center py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      View all {item.total_requests} requests
                                    </button>
                                  )}
                                </div>

                                                    {/* Expanded Requests */}
                                {expandedItems.has(item.id) && item.total_requests > 3 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 space-y-2"
                                  >
                                    {item.approved_requests.slice(3).map((request) => (
                                      <div
                                        key={request.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                        onClick={() => handleCreateChat(item, request)}
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900">
                                              {request.title}
                                            </p>
                                            {request.type === 'business_relationship' && (
                                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                Business
                                              </span>
                                            )}
                                            {request.type === 'contact_request' && (
                                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                Request
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                            <Clock size={12} />
                                            <span>{formatDate(request.created_at)}</span>
                                            {request.chat_exists && (
                                              <span className="text-blue-600 font-medium">(Chat exists)</span>
                                            )}
                                          </div>
                                        </div>
                                        {creatingChat === request.id ? (
                                          <Loader2 className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                                        ) : (
                                          <MessageCircle size={16} className="text-blue-500" />
                                        )}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
