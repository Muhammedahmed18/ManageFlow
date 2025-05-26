import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, 
  Calendar, Package, Check, Clock, Truck
} from 'lucide-react';

const OrderManagement = ({ 
  orders, 
  colors 
}) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'in_production': return <Package size={16} className="text-blue-500" />;
      case 'shipped': return <Truck size={16} className="text-orange-500" />;
      case 'completed': return <Check size={16} className="text-green-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Order Management</h2>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="p-6 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2 font-medium">Order #{order.id}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    {new Date(order.created_at).toLocaleDateString()}
                    {expandedOrder === order.id ? (
                      <ChevronUp size={16} className="ml-2" />
                    ) : (
                      <ChevronDown size={16} className="ml-2" />
                    )}
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(order.data).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm font-medium text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                          <p className="text-gray-800">{value || '-'}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;