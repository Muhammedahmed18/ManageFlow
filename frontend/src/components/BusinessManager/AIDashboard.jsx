import React, { useState, useEffect, useCallback } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Activity, Target, AlertCircle, CheckCircle, 
    Loader2, RefreshCw, Zap, Brain, BarChart3, Clock, AlertTriangle, 
    DollarSign, Users, Package, Shield, Eye,
    AlertOctagon, UserCheck, UserX, UserPlus, UserMinus
} from 'lucide-react';
import api from '../../services/authService';

const AIDashboard = ({ businessId, colors }) => {
    const [activeTab, setActiveTab] = useState('forecast');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // AI Data States
    const [mlForecast, setMlForecast] = useState(null);
    const [anomalyDetection, setAnomalyDetection] = useState(null);
    
    // Theme colors
    const themeColors = {
        primary: colors?.primary || '#3B82F6',
        secondary: colors?.secondary || '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
    };

    // Fetch ML Forecast
    const fetchMLForecast = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/management/predictions/${businessId}/ml-forecast/`);
            setMlForecast(response.data.ml_forecast);
            setError(null);
        } catch (err) {
            console.error('Error fetching ML forecast:', err);
            setError('Failed to load ML forecast');
        } finally {
            setLoading(false);
        }
    }, [businessId]);



    // Fetch Anomaly Detection
    const fetchAnomalyDetection = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/management/predictions/${businessId}/anomaly-detection/`);
            setAnomalyDetection(response.data.anomalies);
            setError(null);
        } catch (err) {
            console.error('Error fetching anomaly detection:', err);
            setError('Failed to load anomaly detection');
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    // Load data based on active tab
    useEffect(() => {
        if (activeTab === 'forecast' && !mlForecast) {
            fetchMLForecast();
        } else if (activeTab === 'anomalies' && !anomalyDetection) {
            fetchAnomalyDetection();
        }
    }, [activeTab, mlForecast, anomalyDetection, fetchMLForecast, fetchAnomalyDetection]);

    // Refresh current tab
    const handleRefresh = () => {
        if (activeTab === 'forecast') {
            setMlForecast(null);
            fetchMLForecast();
        } else if (activeTab === 'anomalies') {
            setAnomalyDetection(null);
            fetchAnomalyDetection();
        }
    };

    // Helper functions
    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return themeColors.danger;
            case 'medium': return themeColors.warning;
            case 'low': return themeColors.info;
            default: return themeColors.secondary;
        }
    };



    const getAnomalyIcon = (anomalyType) => {
        switch (anomalyType) {
            case 'High Value Order': return <DollarSign size={16} className="text-green-600" />;
            case 'Unusual Time': return <Clock size={16} className="text-blue-600" />;
            case 'New Customer': return <UserPlus size={16} className="text-purple-600" />;
            default: return <AlertTriangle size={16} className="text-orange-600" />;
        }
    };

    // Render ML Forecast Tab
    const renderMLForecast = () => {
        if (!mlForecast) return null;
        
        // Handle empty forecast data
        if (!mlForecast.forecast || mlForecast.forecast.length === 0) {
            return (
                <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Forecast Data Available</h3>
                    <p className="text-gray-600 mb-4">{mlForecast.message || 'Insufficient sales data to generate forecast'}</p>
                    <p className="text-sm text-gray-500">Add paid invoices to enable ML-powered sales forecasting</p>
                </div>
            );
        }

        const forecastData = mlForecast.forecast || [];
        const modelPerformance = mlForecast.model_performance || {};

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-blue-600" />
                            ML Sales Forecast
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {mlForecast.message} • Confidence: {mlForecast.confidence}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Best Model</p>
                        <p className="font-semibold text-blue-600">{mlForecast.best_model}</p>
                    </div>
                </div>

                {/* Model Performance */}
                {Object.keys(modelPerformance).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3">Model Performance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(modelPerformance).map(([model, metrics]) => (
                                <div key={model} className="bg-white rounded-lg p-3 border">
                                    <p className="font-medium text-sm">{model}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-600">R²: {metrics.r2}</p>
                                        <p className="text-xs text-gray-600">MAE: {metrics.mae}</p>
                                        <p className="text-xs text-gray-600">MSE: {metrics.mse}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Compact Forecast Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600 mb-1">Total Forecast</p>
                                <p className="text-lg font-bold text-blue-900">
                                    ${forecastData.reduce((sum, item) => sum + item.predicted_sales, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-600">Next 3 months</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-green-600 mb-1">Average Monthly</p>
                                <p className="text-lg font-bold text-green-900">
                                    ${(forecastData.reduce((sum, item) => sum + item.predicted_sales, 0) / 3).toLocaleString()}
                                </p>
                                <p className="text-xs text-green-600">Predicted revenue</p>
                            </div>
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600 mb-1">Confidence</p>
                                <p className="text-lg font-bold text-purple-900">
                                    {Math.round(forecastData.reduce((sum, item) => sum + item.confidence, 0) / 3)}%
                                </p>
                                <p className="text-xs text-purple-600">Average confidence</p>
                            </div>
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Target className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Forecast Chart */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Sales Forecast Trend</h4>
                            <p className="text-xs text-gray-600">Predicted revenue growth over the next 3 months</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                            <span className="text-xs text-gray-600">Predicted Sales</span>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData}>
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#6b7280" 
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="#6b7280" 
                                    fontSize={12}
                                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Predicted Sales']}
                                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="predicted_sales" 
                                    stroke="#3B82F6" 
                                    strokeWidth={3}
                                    fill="url(#salesGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ultra Compact Forecast Details */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h4 className="font-medium text-gray-900 flex items-center text-xs">
                            <BarChart3 className="w-3 h-3 mr-1 text-blue-600" />
                            Monthly Forecast Breakdown
                        </h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Month
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Sales
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Growth
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Conf.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forecastData.map((item, index) => {
                                    const prevValue = index > 0 ? forecastData[index - 1].predicted_sales : 0;
                                    const growth = prevValue > 0 ? ((item.predicted_sales - prevValue) / prevValue * 100) : 0;
                                    
                                    return (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center mr-1">
                                                        <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-900">{item.month}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                <span className="text-xs font-bold text-gray-900">
                                                    ${item.predicted_sales.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {index > 0 ? (
                                                    <div className="flex items-center">
                                                        {growth > 0 ? (
                                                            <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                                                        ) : (
                                                            <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                                                        )}
                                                        <span className={`text-xs font-medium ${
                                                            growth > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 bg-gray-200 rounded-full h-1 mr-1">
                                                        <div 
                                                            className="bg-gradient-to-r from-green-400 to-green-600 h-1 rounded-full transition-all duration-300"
                                                            style={{ width: `${item.confidence}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-900">
                                                        {item.confidence}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };



    // Render Anomaly Detection Tab
    const renderAnomalyDetection = () => {
        if (!anomalyDetection) return null;
        
        // Handle empty anomaly data
        if (!anomalyDetection.anomalies || anomalyDetection.anomalies.length === 0) {
            return (
                <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Anomalies Detected</h3>
                    <p className="text-gray-600 mb-4">{anomalyDetection.message || 'No anomalies found in recent orders'}</p>
                    <p className="text-sm text-gray-500">This is good! Your invoice patterns appear normal</p>
                </div>
            );
        }

        const anomalies = anomalyDetection.anomalies || [];
        const stats = anomalyDetection.statistics || {};

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-red-600" />
                            Anomaly Detection
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {anomalyDetection.message} • {anomalyDetection.detection_method}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Anomaly Rate</p>
                        <p className="font-semibold text-red-600">{stats.anomaly_percentage}%</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                         <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                         <div className="flex items-center">
                             <Package className="w-8 h-8 text-blue-600" />
                             <div className="ml-3">
                                 <p className="text-sm font-medium text-gray-900">Invoices Analyzed</p>
                                 <p className="text-2xl font-bold text-blue-600">{stats.total_invoices_analyzed}</p>
                             </div>
                         </div>
                     </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                        <div className="flex items-center">
                            <AlertOctagon className="w-8 h-8 text-red-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Anomalies Found</p>
                                <p className="text-2xl font-bold text-red-600">{stats.total_anomalies}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                        <div className="flex items-center">
                            <AlertTriangle className="w-8 h-8 text-orange-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Anomaly Rate</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.anomaly_percentage}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                        <div className="flex items-center">
                            <Eye className="w-8 h-8 text-purple-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Detection Method</p>
                                <p className="text-sm font-bold text-purple-600">Isolation Forest</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Anomaly Types Chart */}
                {stats.anomaly_types && Object.keys(stats.anomaly_types).length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h4 className="font-medium mb-4">Anomaly Types Distribution</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Object.entries(stats.anomaly_types).map(([type, count]) => ({ type, count }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="type" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={themeColors.danger} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Anomalies List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="font-medium">Detected Anomalies</h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {anomalies.map((anomaly, index) => (
                            <div key={index} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        {getAnomalyIcon(anomaly.anomaly_type)}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h5 className="font-medium text-gray-900">{anomaly.anomaly_type}</h5>
                                                <span 
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${getSeverityColor(anomaly.severity)}20`,
                                                        color: getSeverityColor(anomaly.severity)
                                                    }}
                                                >
                                                    {anomaly.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                                                                                         <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                 <span>Customer: {anomaly.customer_name}</span>
                                                 <span>Amount: ${anomaly.amount?.toLocaleString()}</span>
                                                 <span>Invoice ID: {anomaly.invoice_id}</span>
                                                 <span>Score: {anomaly.anomaly_score}</span>
                                             </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        {new Date(anomaly.order_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex justify-between items-center px-6">
                            <nav className="flex space-x-8">
                                {[
                                    { id: 'forecast', label: 'ML Forecast', icon: Brain },
                                    { id: 'anomalies', label: 'Anomaly Detection', icon: Shield }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                                                activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                            
                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh {activeTab === 'forecast' ? 'Forecast' : 'Anomalies'}
                            </button>
                        </div>
                    </div>

                                    {/* Tab Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                            <span className="text-gray-600">Loading AI insights...</span>
                        </div>
                    ) : (
                        <div>
                            {activeTab === 'forecast' && renderMLForecast()}
                            {activeTab === 'anomalies' && renderAnomalyDetection()}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default AIDashboard;
