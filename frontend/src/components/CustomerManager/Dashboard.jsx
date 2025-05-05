import React from 'react';
import { ShoppingBag, CreditCard, BarChart3, Activity, TrendingUp, Package, DollarSign, Users, Calendar } from 'lucide-react';

const Dashboard = ({ products = [] }) => {
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      
      {/* Main Stats Row - Now 3 cards arranged responsively */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600 tracking-wide">Products</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Products</h2>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">{products.length}</p>
            <span className="ml-2 text-xs text-slate-500">items</span>
          </div>
        </div>
        
        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <ShoppingBag className="text-emerald-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 tracking-wide">Orders</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Orders</h2>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">Not finalized</p>
          </div>
        </div>
        
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-600 tracking-wide">Revenue</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Revenue</h2>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">Not finalized</p>
          </div>
        </div>
      </div>

      {/* Performance Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2 transition-all duration-300 hover:shadow-md border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-800 tracking-tight">Performance Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Monthly metrics visualization</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 font-inter tracking-wide">Weekly</button>
              <button className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 font-inter tracking-wide">Monthly</button>
              <button className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 font-inter tracking-wide">Yearly</button>
            </div>
          </div>
          <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <div className="text-center">
              <Activity className="text-slate-400 mx-auto mb-2" size={24} />
              <p className="text-slate-500 font-medium">Not finalized</p>
              <p className="text-xs text-slate-400 mt-1 font-light">Performance data will appear here</p>
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 tracking-tight">Recent Orders</h2>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium tracking-wide">View All</button>
          </div>
          
          <div className="space-y-4">
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
              <ShoppingBag className="mx-auto text-slate-300 mb-2" size={24} />
              <p className="text-sm text-slate-500 font-medium">Not finalized</p>
              <p className="text-xs text-slate-400 mt-1 font-light">Order data will appear here</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 tracking-wide">Next delivery</p>
                <div className="flex items-center mt-1">
                  <Calendar size={14} className="text-slate-500 mr-1" />
                  <p className="text-sm font-medium">Not finalized</p>
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 tracking-wide">Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;