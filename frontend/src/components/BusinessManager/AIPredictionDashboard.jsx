import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle, CheckCircle, Loader2, RefreshCw, Zap, Brain, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/authService';
import toast from 'react-hot-toast';

const AIPredictionDashboard = ({ businessId, colors }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataStale, setDataStale] = useState(false);

  const defaultColors = {
    primary: "#1C2E4A",
    secondary: "#52677D",
    accent: "#0F1A2B",
    background: "#0F1A2B",
    backgroundAlt: "#1C2E4A",
    textDark: "#1A202C",
    textMedium: "#4A5568",
    error: "#E53E3E",
    warning: "#F59E0B",
    success: "#38A169",
    border: "#52677D",
    hover: "#2D3748"
  };

  const themeColors = colors || defaultColors;

  // Data validation function
  const validatePredictionData = (data) => {
    return data && 
           typeof data.overall_confidence === 'number' &&
           Array.isArray(data.product_analysis) &&
           data.sales_forecast &&
           data.total_products > 0 &&
           data.overall_confidence >= 0 &&
           data.overall_confidence <= 100;
  };

  // Enhanced fetchPredictionData with cache busting and validation
  const fetchPredictionData = useCallback(async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      const response = await api.get(`/management/predictions/${businessId}/dashboard/${timestamp}`);
      
      // Validate response data
      if (validatePredictionData(response.data)) {
        setPredictionData(response.data);
        setLastUpdated(new Date());
        setDataStale(false);
        console.log('Prediction data loaded successfully:', response.data);
      } else {
        throw new Error('Invalid prediction data received from server');
      }
    } catch (error) {
      console.error('Error fetching prediction data:', error);
      toast.error('Failed to load prediction data. Please try again.');
      setDataStale(true);
    } finally {
      setRefreshing(false);
    }
  }, [businessId]);

  // Generate new prediction
  const generatePrediction = useCallback(async () => {
    try {
      setGenerating(true);
      toast.loading('Generating AI prediction...', { id: 'prediction' });
      
      await api.post(`/management/predictions/${businessId}/generate/`);
      
      // Fetch fresh data after generation
      await fetchPredictionData(true);
      
      toast.success('AI Prediction generated successfully!', { id: 'prediction' });
    } catch (error) {
      console.error('Error generating prediction:', error);
      toast.error('Error generating prediction. Please try again.', { id: 'prediction' });
    } finally {
      setGenerating(false);
    }
  }, [businessId, fetchPredictionData]);

  // Check if data is stale (older than 1 hour)
  const checkDataStaleness = useCallback(() => {
    if (lastUpdated) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setDataStale(lastUpdated < oneHourAgo);
    }
  }, [lastUpdated]);

  // Check data staleness periodically (reduced frequency to prevent excessive checks)
  useEffect(() => {
    checkDataStaleness();
    const interval = setInterval(checkDataStaleness, 15 * 60 * 1000); // Changed from 5 minutes to 15 minutes
    return () => clearInterval(interval);
  }, [checkDataStaleness]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return themeColors.success;
    if (confidence >= 40) return themeColors.warning;
    return themeColors.error;
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 70) return <CheckCircle size={20} color={themeColors.success} />;
    if (confidence >= 40) return <AlertCircle size={20} color={themeColors.warning} />;
    return <AlertCircle size={20} color={themeColors.error} />;
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 70) return 'High Confidence';
    if (confidence >= 40) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // Welcome state when no prediction data exists
  if (!predictionData) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Brain className="mx-auto text-gray-400 mb-6" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Prediction Dashboard</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Generate AI-powered predictions to analyze your business performance, 
              forecast sales trends, and get insights into product confidence levels.
            </p>
            <button
              onClick={generatePrediction}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg flex items-center space-x-3 mx-auto text-lg font-medium transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Prediction...</span>
                </>
              ) : (
                <>
                  <Zap size={20} />
                  <span>Generate First Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-gray-500" />
                <p className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
                {dataStale && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertTriangle size={14} />
                    <span className="text-xs">Data may be stale</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchPredictionData(true)}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={generatePrediction}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Zap size={16} />
              <span>{generating ? 'Generating...' : 'Generate New Prediction'}</span>
            </button>
          </div>
        </div>

        {/* Overall Confidence */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Overall Business Confidence
          </h3>
          <div className="flex items-center space-x-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                {getConfidenceIcon(predictionData.overall_confidence)}
                <div>
                  <span className="text-3xl font-bold" style={{ color: getConfidenceColor(predictionData.overall_confidence) }}>
                    {predictionData.overall_confidence}%
                  </span>
                  <p className="text-sm text-gray-600">{getConfidenceLabel(predictionData.overall_confidence)}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${predictionData.overall_confidence}%`,
                    backgroundColor: getConfidenceColor(predictionData.overall_confidence)
                  }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{predictionData.total_products}</p>
              <p className="text-sm text-gray-600">Analyzed</p>
            </div>
          </div>
        </div>

        {/* Product Confidence Analysis */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Product Confidence Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictionData.product_analysis.map((product) => (
              <div
                key={product.product_id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-white"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{product.product_name}</h4>
                    <p className="text-sm text-gray-600">{product.order_count} orders</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-lg font-semibold"
                      style={{ color: getConfidenceColor(product.confidence) }}
                    >
                      {product.confidence}%
                    </span>
                    {getConfidenceIcon(product.confidence)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${product.confidence}%`,
                      backgroundColor: getConfidenceColor(product.confidence)
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {getConfidenceLabel(product.confidence)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Forecast */}
        {predictionData.sales_forecast.forecast && predictionData.sales_forecast.forecast.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Sales Forecast (Next 3 Months)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData.sales_forecast.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Predicted Sales']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted_sales"
                    stroke="#1C2E4A"
                    strokeWidth={3}
                    name="Predicted Sales"
                    dot={{ fill: '#1C2E4A', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#1C2E4A', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Forecast Confidence: {predictionData.sales_forecast.confidence}%
              </p>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.product_name}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                    <span 
                      className="text-xl font-bold"
                      style={{ color: getConfidenceColor(selectedProduct.confidence) }}
                    >
                      {selectedProduct.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedProduct.confidence}%`,
                        backgroundColor: getConfidenceColor(selectedProduct.confidence)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Order Count</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.order_count}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Quantity Consistency</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.quantity_consistency}/30</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Time Pattern Score</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.time_pattern_score}/20</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Data Recency</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.data_recency_score}/10</p>
                  </div>
                </div>

                {selectedProduct.recommendations && selectedProduct.recommendations.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {selectedProduct.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="mt-6 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPredictionDashboard;
