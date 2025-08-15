import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Building, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Check, 
  X as XIcon,
  Reply,
  FileText,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { colors } from '../../constants/theme';

const RequestDetailModal = ({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  onRespond,
  isProcessing = false
}) => {
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);

  if (!request) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check size={16} />;
      case 'rejected': return <XIcon size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(request.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request.id);
    }
  };

  const handleSendResponse = () => {
    if (onRespond && responseMessage.trim()) {
      onRespond(request.id, responseMessage);
      setResponseMessage('');
      setShowResponseForm(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                  {request.direction === 'outgoing' ? <ArrowRight size={20} style={{ color: colors.primary }} /> : <ArrowLeft size={20} style={{ color: colors.primary }} />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                    {request.direction === 'outgoing' ? 'Sent Request' : 'Received Request'}
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {request.direction === 'outgoing' ? 'Request sent to customer' : 'Request from customer'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isProcessing}
              >
                <X size={20} style={{ color: colors.textSecondary }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Status Badge */}
              <div className="mb-6">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="capitalize">{request.status}</span>
                </div>
              </div>

              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User size={16} style={{ color: colors.textSecondary }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{request.customer_name}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Customer</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail size={16} style={{ color: colors.textSecondary }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{request.customer_email}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Email</p>
                      </div>
                    </div>
                    {request.customer_location && (
                      <div className="flex items-center space-x-3">
                        <MapPin size={16} style={{ color: colors.textSecondary }} />
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{request.customer_location}</p>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>Location</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                    Business Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building size={16} style={{ color: colors.textSecondary }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{request.business_name}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Business</p>
                      </div>
                    </div>
                    {request.business_slogan && (
                      <div className="flex items-center space-x-3">
                        <FileText size={16} style={{ color: colors.textSecondary }} />
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{request.business_slogan}</p>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>Slogan</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Message */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3" style={{ color: colors.textPrimary }}>
                  Request Message
                </h3>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                  <p className="whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                    {request.message}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Clock size={16} style={{ color: colors.textSecondary }} />
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{formatDate(request.created_at)}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Created</p>
                  </div>
                </div>
                {request.responded_at && (
                  <div className="flex items-center space-x-3">
                    <MessageSquare size={16} style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{formatDate(request.responded_at)}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Responded</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Response (if any) */}
              {request.customer_response && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3" style={{ color: colors.textPrimary }}>
                    Customer Response
                  </h3>
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                    <p className="whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                      {request.customer_response}
                    </p>
                  </div>
                </div>
              )}

              {/* Response Form */}
              {request.status === 'pending' && request.direction === 'incoming' && (
                <div className="mb-6">
                  {!showResponseForm ? (
                    <button
                      onClick={() => setShowResponseForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: colors.primary }}
                      disabled={isProcessing}
                    >
                      <Reply size={16} />
                      <span>Respond to Request</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                        Send Response
                      </h3>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Enter your response message..."
                        className="w-full p-3 border rounded-lg resize-none"
                        rows="4"
                        style={{ borderColor: colors.border }}
                        disabled={isProcessing}
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSendResponse}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
                          style={{ backgroundColor: colors.primary }}
                          disabled={isProcessing || !responseMessage.trim()}
                        >
                          <MessageSquare size={16} />
                          <span>{isProcessing ? 'Sending...' : 'Send Response'}</span>
                        </button>
                        <button
                          onClick={() => setShowResponseForm(false)}
                          className="px-4 py-2 rounded-lg border font-medium"
                          style={{ borderColor: colors.border, color: colors.textSecondary }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {request.status === 'pending' && request.direction === 'incoming' && !showResponseForm && (
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleReject}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border font-medium"
                  style={{ borderColor: colors.error, color: colors.error }}
                  disabled={isProcessing}
                >
                  <XIcon size={16} />
                  <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: colors.success }}
                  disabled={isProcessing}
                >
                  <Check size={16} />
                  <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestDetailModal;
