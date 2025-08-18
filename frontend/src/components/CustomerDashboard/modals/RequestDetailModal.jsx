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
  ArrowLeft,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { colors } from '../../../constants/theme';

const RequestDetailModal = ({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  onSendMessage,
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
      onApprove(request.id, 'approved');
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request);
      onClose(); // Close the detail modal when opening rejection modal
    }
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage(request);
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
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                  <ArrowLeft size={24} style={{ color: colors.primary }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                    Received Request
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Request from manufacturer
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

              {/* Manufacturer Information */}
              <div className="p-4 rounded-lg border mb-6" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <h3 className="font-semibold text-lg mb-4" style={{ color: colors.textPrimary }}>
                  Manufacturer Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                      <Building size={16} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{request.manufacturer.name}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Manufacturer</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success + '20' }}>
                      <MapPin size={16} style={{ color: colors.success }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{request.manufacturer.location}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Location</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning + '20' }}>
                      <FileText size={16} style={{ color: colors.warning }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{request.manufacturer.industry}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Industry</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Message */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3" style={{ color: colors.textPrimary }}>
                  Request Message
                </h3>
                <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: colors.accent + '20' }}>
                      <MessageSquare size={16} style={{ color: colors.accent }} />
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap leading-relaxed" style={{ color: colors.textPrimary }}>
                        {request.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-lg border mb-6" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <h3 className="font-semibold text-lg mb-4" style={{ color: colors.textPrimary }}>
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                      <Clock size={16} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{formatDate(request.createdAt)}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Request Received</p>
                    </div>
                  </div>
                  {request.updatedAt && request.updatedAt !== request.createdAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success + '20' }}>
                        <Calendar size={16} style={{ color: colors.success }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{formatDate(request.updatedAt)}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Last Updated</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Response (if any) */}
              {request.customer_response && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3" style={{ color: colors.textPrimary }}>
                    Your Response
                  </h3>
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: colors.success + '20' }}>
                        <Reply size={16} style={{ color: colors.success }} />
                      </div>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap leading-relaxed" style={{ color: colors.textPrimary }}>
                          {request.customer_response}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              {request.status === 'pending' ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium border"
                  style={{ 
                    borderColor: request.status === 'approved' ? colors.success : colors.error,
                    color: request.status === 'approved' ? colors.success : colors.error,
                    backgroundColor: request.status === 'approved' ? colors.success + '10' : colors.error + '10'
                  }}
                >
                  {request.status === 'approved' ? <Check size={16} /> : <XIcon size={16} />}
                  <span className="capitalize">{request.status}</span>
                </div>
              )}

              <button
                onClick={handleSendMessage}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: colors.primary }}
                disabled={isProcessing}
              >
                <MessageCircle size={16} />
                <span>Send Message</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestDetailModal;
