import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Clock, Package, Truck } from 'lucide-react';
import { getStatusBadge } from '../../../utils/orderUtils.jsx';
import StatusBadge from './StatusBadge';

const StatusDropdown = ({ order, isOpen, onOpen, onChange }) => {
  // All hooks must be called at the top level, before any conditional returns
  const buttonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);

  // Calculate position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        onOpen(); // toggles closed
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onOpen]);

  // If order is shipped, delivered, or completed, show static badge instead of dropdown
  if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
    const { color } = getStatusBadge(order.status);
    
    return (
      <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${color}`}>
        <StatusBadge status={order.status} />
        <span className="text-xs font-medium">(Unchangeable)</span>
      </div>
    );
  }

  // Dropdown menu - only show valid status options
  const dropdownMenu = isOpen ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg animate-dropdown-fade"
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        minWidth: dropdownPos.width,
        width: 192 // 12rem
      }}
    >
      <button onClick={() => onChange('pending')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
        <Clock className="text-yellow-500" size={16} /> Pending
      </button>
      <button onClick={() => onChange('in_production')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
        <Package className="text-blue-500" size={16} /> In Production
      </button>
      <button onClick={() => onChange('shipped')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
        <Truck className="text-purple-500" size={16} /> Shipped
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all focus:outline-none ${isOpen ? 'ring-2 ring-blue-400' : ''}`}
      >
        <StatusBadge status={order.status} />
        <ChevronDown className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>
      {dropdownMenu}
    </>
  );
};

export default StatusDropdown;

