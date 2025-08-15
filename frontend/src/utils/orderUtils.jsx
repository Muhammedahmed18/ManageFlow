import { Clock, Package, Check, Truck, AlertCircle } from 'lucide-react';

export const getStatusBadge = (status) => {
  const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center";
  
  switch (status) {
    case 'pending':
      return {
        element: (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <Clock size={16} className="mr-2" />
            Pending
          </span>
        ),
        color: 'bg-yellow-50 border-yellow-200 text-yellow-600'
      };
    case 'in_production':
      return {
        element: (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <Package size={16} className="mr-2" />
            In Production
          </span>
        ),
        color: 'bg-blue-50 border-blue-200 text-blue-600'
      };
    case 'shipped':
      return {
        element: (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <Truck size={16} className="mr-2" />
            Shipped (Pending Confirmation)
          </span>
        ),
        color: 'bg-purple-50 border-purple-200 text-purple-600'
      };
    case 'completed':
      return {
        element: (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <Check size={16} className="mr-2" />
            Delivered
          </span>
        ),
        color: 'bg-green-50 border-green-200 text-green-600'
      };
    default:
      return {
        element: (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            <AlertCircle size={16} className="mr-2" />
            {status}
          </span>
        ),
        color: 'bg-gray-50 border-gray-200 text-gray-600'
      };
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const filterOrders = (orders, searchTerm, statusFilter) => {
  return orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.data?.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.data?.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
};

