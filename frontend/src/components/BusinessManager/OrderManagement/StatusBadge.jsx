import React from 'react';
import { getStatusBadge } from '../../../utils/orderUtils.jsx';

const StatusBadge = ({ status, className = "" }) => {
  const { element } = getStatusBadge(status);
  
  return (
    <div className={className}>
      {element}
    </div>
  );
};

export default StatusBadge;

