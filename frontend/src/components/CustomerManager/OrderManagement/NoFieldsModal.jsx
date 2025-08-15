import React from 'react';

const NoFieldsModal = ({ isOpen, onClose, onGoToSettings, colors }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 flex flex-col items-center">
          <p className="text-lg font-semibold mb-4 text-center">
            No order fields are configured.<br />
            Please add fields in <span className="font-bold">Settings</span>.
          </p>
          <button
            onClick={onGoToSettings}
            className="px-5 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoFieldsModal;

