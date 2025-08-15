import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText, Users, Calendar, BarChart3, RefreshCw, Loader2, ChevronDown, PieChart, Activity, Target, Zap, Brain, AlertTriangle, CheckCircle, Info, ArrowUpRight, ArrowDownRight, Clock, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { formatCurrency, formatPercentage, calculateProfitMargin } from '../../../utils/salesUtils';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const RevenueDashboard = ({ businessId, revenueSummary, onRefresh, colors }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showAITrends, setShowAITrends] = useState(false); // Start with false - manual generation
  
  // AI Trend Data States
  const [trendData, setTrendData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Manual Generation States
  const [insightsGenerated, setInsightsGenerated] = useState(false); // Track if insights were generated
  const [generatingInsights, setGeneratingInsights] = useState(false); // Loading state for generation
  
  // Dynamic AI Insights States
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [autoPlayInsights, setAutoPlayInsights] = useState(true);
  const [autoPlayRecommendations, setAutoPlayRecommendations] = useState(true);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  // Manual generation function
  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      // Use new real analysis endpoint
      const response = await api.post(`/management/customer/generate-real-insights/${businessId}/`);
      
      const data = response.data;
      
      // Set all the analyzed data
      setTrendData(data.analysis_summary);
      setForecastData(data.forecast);
      setInsightsData({
        insights: data.insights,
        recommendations: data.recommendations,
        risk_alerts: data.risk_alerts,
        opportunities: data.opportunities
      });
      
      setInsightsGenerated(true);
      setShowAITrends(true);
      setShowCharts(false);
      
      // Show success message with analysis summary
      const summary = data.analysis_summary;
      toast.success(`AI Analysis Complete! Analyzed ${summary.total_orders} orders, $${summary.total_revenue} revenue, ${summary.customer_count} customers.`);
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights. Please try again.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Fetch AI Trend Data (kept for compatibility)
  const fetchTrendData = useCallback(async () => {
    try {
      setAiLoading(true);
      const response = await api.get(`/management/customer/revenue-trends/${businessId}/?period=${selectedPeriod}`);
      setTrendData(response.data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      toast.error('Failed to load trend data');
    } finally {
      setAiLoading(false);
    }
  }, [businessId, selectedPeriod]);

  const fetchForecastData = useCallback(async () => {
    try {
      const response = await api.get(`/management/customer/revenue-forecast/${businessId}/?months=6`);
      setForecastData(response.data);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Failed to load forecast data');
    }
  }, [businessId]);

  const fetchInsightsData = useCallback(async () => {
    try {
      const response = await api.get(`/management/customer/revenue-insights/${businessId}/`);
      setInsightsData(response.data);
    } catch (error) {
      console.error('Error fetching insights data:', error);
      toast.error('Failed to load insights data');
    }
  }, [businessId]);

  // Auto-play insights rotation (reduced frequency to prevent excessive updates)
  useEffect(() => {
    if (!autoPlayInsights || !insightsData?.insights) return;
    
    const interval = setInterval(() => {
      setCurrentInsightIndex(prev => 
        prev < (insightsData.insights.length - 1) ? prev + 1 : 0
      );
    }, 10000); // Changed from 5 seconds to 10 seconds

    return () => clearInterval(interval);
  }, [autoPlayInsights, insightsData?.insights]);

  // Auto-play recommendations rotation (reduced frequency to prevent excessive updates)
  useEffect(() => {
    if (!autoPlayRecommendations || !insightsData?.recommendations) return;
    
    const interval = setInterval(() => {
      setCurrentRecommendationIndex(prev => 
        prev < (insightsData.recommendations.length - 1) ? prev + 1 : 0
      );
    }, 12000); // Changed from 6 seconds to 12 seconds

    return () => clearInterval(interval);
  }, [autoPlayRecommendations, insightsData?.recommendations]);

  if (!revenueSummary) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-8 text-center">
              <BarChart3 className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Revenue Data Available</h3>
              <p className="mt-2 text-gray-500">Start creating invoices to see your revenue analytics</p>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { 
    customer_revenue = 0, 
    manufacturer_costs = 0, 
    net_profit = 0, 
    total_sales = 0, 
    paid_sales = 0, 
    payment_rate = 0,
    revenue_growth = 0,
    profit_growth = 0
  } = revenueSummary;
  
  const profitMargin = calculateProfitMargin(customer_revenue, manufacturer_costs);
  const revenueGrowth = revenue_growth;
  const profitGrowth = profit_growth;

  const getGrowthIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const nextInsight = () => {
    if (insightsData?.insights) {
      setCurrentInsightIndex(prev => 
        prev < (insightsData.insights.length - 1) ? prev + 1 : 0
      );
    }
  };

  const prevInsight = () => {
    if (insightsData?.insights) {
      setCurrentInsightIndex(prev => 
        prev > 0 ? prev - 1 : (insightsData.insights.length - 1)
      );
    }
  };

  const nextRecommendation = () => {
    if (insightsData?.recommendations) {
      setCurrentRecommendationIndex(prev => 
        prev < (insightsData.recommendations.length - 1) ? prev + 1 : 0
      );
    }
  };

  const prevRecommendation = () => {
    if (insightsData?.recommendations) {
      setCurrentRecommendationIndex(prev => 
        prev > 0 ? prev - 1 : (insightsData.recommendations.length - 1)
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="space-y-8">
          {/* Header - Fixed at top with consistent layout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
              {/* Title Section */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Revenue Analytics Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Track your sales performance and generate AI-powered business insights
                </p>
              </div>
              
              {/* Controls Section */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Period Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Period:</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="month">Monthly</option>
                    <option value="quarter">Quarterly</option>
                    <option value="week">Weekly</option>
                  </select>
                </div>
                
                {/* Generate AI Insights Button */}
                <button
                  onClick={generateAIInsights}
                  disabled={generatingInsights}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  {generatingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Insights
                    </>
                  )}
                </button>
                
                {/* Tab buttons - only show after generation */}
                {insightsGenerated && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowCharts(!showCharts);
                        setShowAITrends(false);
                      }}
                      className={`inline-flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        showCharts && !showAITrends 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <PieChart className="w-4 h-4 mr-2" />
                      Analytics
                    </button>
                    <button
                      onClick={() => {
                        setShowAITrends(!showAITrends);
                        setShowCharts(false);
                      }}
                      className={`inline-flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        showAITrends 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Insights
                    </button>
                  </div>
                )}
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards - Enhanced Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center">
                  {getGrowthIcon(revenueGrowth)}
                  <span className={`ml-1 text-xs font-medium ${getGrowthColor(revenueGrowth)}`}>
                    {revenueGrowth > 0 ? '+' : ''}{formatPercentage(revenueGrowth)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(customer_revenue)}</p>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center">
                  {getGrowthIcon(profitGrowth)}
                  <span className={`ml-1 text-xs font-medium ${getGrowthColor(profitGrowth)}`}>
                    {profitGrowth > 0 ? '+' : ''}{formatPercentage(profitGrowth)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Net Profit</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(net_profit)}</p>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="ml-1 text-xs font-medium text-green-600">
                    {formatPercentage(profitMargin)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Profit Margin</p>
                <p className="text-xl font-bold text-gray-900">{formatPercentage(profitMargin)}</p>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Payment Rate */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="ml-1 text-xs font-medium text-gray-600">
                    {total_sales - paid_sales} pending
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Payment Rate</p>
                <p className="text-xl font-bold text-gray-900">{formatPercentage(payment_rate)}</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {paid_sales} of {total_sales} invoices paid
              </div>
            </div>
          </div>

          {/* Empty State - Show when no insights generated */}
          {!insightsGenerated && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Generate AI Insights
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Click the "Generate AI Insights" button above to analyze your business data and get personalized recommendations.
                </p>
                <button
                  onClick={generateAIInsights}
                  disabled={generatingInsights}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  {generatingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Insights
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* AI Insights Section - Only show after generation and when selected */}
            {insightsGenerated && showAITrends && (
              <>
                {/* Analysis Summary Section */}
                {trendData && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Business Analysis Summary
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-600 font-medium mb-1">Orders Analyzed</p>
                          <p className="text-2xl font-bold text-blue-900">{trendData.total_orders}</p>
                          <p className="text-xs text-blue-600 mt-1">Total orders processed</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                          <p className="text-sm text-green-600 font-medium mb-1">Revenue Analyzed</p>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(trendData.total_revenue)}</p>
                          <p className="text-xs text-green-600 mt-1">Total revenue tracked</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium mb-1">Payment Rate</p>
                          <p className="text-2xl font-bold text-purple-900">{trendData.payment_rate}%</p>
                          <p className="text-xs text-purple-600 mt-1">Current payment rate</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                          <p className="text-sm text-orange-600 font-medium mb-1">Performance Score</p>
                          <p className="text-2xl font-bold text-orange-900">{trendData.performance_score}/100</p>
                          <p className="text-xs text-orange-600 mt-1">Overall business health</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Revenue Forecast Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-purple-600" />
                        AI Revenue Forecast
                      </h3>
                      {aiLoading && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading predictions...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {forecastData && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-600 font-medium mb-1">Predicted Growth</p>
                          <p className="text-2xl font-bold text-blue-900">{forecastData.growth_rate}%</p>
                          <p className="text-xs text-blue-600 mt-1">Next 6 months</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <p className="text-sm text-green-600 font-medium mb-1">Confidence Level</p>
                          <p className="text-2xl font-bold text-green-900">{forecastData.confidence_level}%</p>
                          <p className="text-xs text-green-600 mt-1">Prediction accuracy</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 font-medium mb-1">Next Month</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {forecastData.predictions && forecastData.predictions[0] 
                              ? formatCurrency(forecastData.predictions[0].predicted)
                              : formatCurrency(0)
                            }
                          </p>
                          <p className="text-xs text-purple-600 mt-1">Expected revenue</p>
                        </div>
                      </div>
                      
                      {forecastData.predictions && (
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={forecastData.predictions}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="month" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value), 'Predicted Revenue']}
                                labelStyle={{ color: '#374151' }}
                                contentStyle={{ 
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="predicted"
                                fill="rgba(139, 92, 246, 0.1)"
                                stroke="none"
                              />
                              <Line
                                type="monotone"
                                dataKey="predicted"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                name="Predicted Revenue"
                                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Insights Panel - Dynamic and Scrollable */}
                {insightsData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dynamic Insights - Scrollable */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                            AI Business Insights
                          </h3>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setAutoPlayInsights(!autoPlayInsights)}
                              className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                                autoPlayInsights 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {autoPlayInsights ? 'Auto' : 'Manual'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 max-h-80 overflow-y-auto">
                        {insightsData.insights && insightsData.insights.length > 0 ? (
                          <div className="relative">
                            {/* Current Insight */}
                            <div className={`p-6 rounded-xl border transition-all duration-500 ${getInsightColor(insightsData.insights[currentInsightIndex]?.type)}`}>
                              <div className="flex items-start">
                                {getInsightIcon(insightsData.insights[currentInsightIndex]?.type)}
                                <div className="ml-3 flex-1">
                                  <h4 className="font-medium text-gray-900 text-lg">
                                    {insightsData.insights[currentInsightIndex]?.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                    {insightsData.insights[currentInsightIndex]?.description}
                                  </p>
                                  
                                  {/* Data Points */}
                                  {insightsData.insights[currentInsightIndex]?.data_points && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {insightsData.insights[currentInsightIndex].data_points.map((point, idx) => (
                                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full border text-gray-600">
                                          {point.replace('_', ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                                      Confidence: {insightsData.insights[currentInsightIndex]?.confidence}%
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {currentInsightIndex + 1} of {insightsData.insights.length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between mt-4">
                              <button
                                onClick={prevInsight}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {/* Progress Dots */}
                              <div className="flex space-x-2">
                                {insightsData.insights.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentInsightIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                      index === currentInsightIndex 
                                        ? 'bg-blue-600' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                  />
                                ))}
                              </div>
                              
                              <button
                                onClick={nextInsight}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No AI insights available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Recommendations - Scrollable */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-green-600" />
                            Strategic Recommendations
                          </h3>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setAutoPlayRecommendations(!autoPlayRecommendations)}
                              className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                                autoPlayRecommendations 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {autoPlayRecommendations ? 'Auto' : 'Manual'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 max-h-80 overflow-y-auto">
                        {insightsData.recommendations && insightsData.recommendations.length > 0 ? (
                          <div className="relative">
                            {/* Current Recommendation */}
                            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-500">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <div className={`w-4 h-4 rounded-full mt-1 ${
                                    insightsData.recommendations[currentRecommendationIndex]?.priority === 'High' ? 'bg-red-500' : 
                                    insightsData.recommendations[currentRecommendationIndex]?.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></div>
                                </div>
                                <div className="ml-4 flex-1">
                                  <h4 className="font-medium text-gray-900 text-lg">
                                    {insightsData.recommendations[currentRecommendationIndex]?.action}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                    {insightsData.recommendations[currentRecommendationIndex]?.description}
                                  </p>
                                  
                                  {/* Additional recommendation details */}
                                  <div className="mt-3 space-y-2">
                                    {insightsData.recommendations[currentRecommendationIndex]?.expected_impact && (
                                      <div className="flex items-center text-xs text-gray-600">
                                        <Target className="w-3 h-3 mr-1" />
                                        <span>Expected Impact: {insightsData.recommendations[currentRecommendationIndex].expected_impact}</span>
                                      </div>
                                    )}
                                    {insightsData.recommendations[currentRecommendationIndex]?.implementation_time && (
                                      <div className="flex items-center text-xs text-gray-600">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>Implementation: {insightsData.recommendations[currentRecommendationIndex].implementation_time}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-4">
                                    <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                                      insightsData.recommendations[currentRecommendationIndex]?.priority === 'High' ? 'bg-red-100 text-red-800' : 
                                      insightsData.recommendations[currentRecommendationIndex]?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {insightsData.recommendations[currentRecommendationIndex]?.priority} Priority
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {currentRecommendationIndex + 1} of {insightsData.recommendations.length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between mt-4">
                              <button
                                onClick={prevRecommendation}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {/* Progress Dots */}
                              <div className="flex space-x-2">
                                {insightsData.recommendations.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentRecommendationIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                      index === currentRecommendationIndex 
                                        ? 'bg-green-600' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                  />
                                ))}
                              </div>
                              
                              <button
                                onClick={nextRecommendation}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No recommendations available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Alerts Section - Scrollable */}
                {insightsData?.risk_alerts && insightsData.risk_alerts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Risk Alerts
                      </h3>
                    </div>
                    <div className="p-6 max-h-64 overflow-y-auto">
                      <div className="space-y-4">
                        {insightsData.risk_alerts.map((alert, index) => (
                          <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-start">
                              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                              <div className="ml-3 flex-1">
                                <h4 className="font-medium text-red-900">{alert.message}</h4>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                    Impact: {alert.impact}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Opportunities Section - Scrollable */}
                {insightsData?.opportunities && insightsData.opportunities.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                        Growth Opportunities
                      </h3>
                    </div>
                    <div className="p-6 max-h-64 overflow-y-auto">
                      <div className="space-y-4">
                        {insightsData.opportunities.map((opportunity, index) => (
                          <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-start">
                              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                              <div className="ml-3 flex-1">
                                <h4 className="font-medium text-green-900">{opportunity.title}</h4>
                                <p className="text-sm text-green-700 mt-1">{opportunity.description}</p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                    Potential Growth: {opportunity.potential_growth}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Original Charts Section - Enhanced */}
            {showCharts && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                    Revenue Analytics
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Breakdown */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                        Revenue Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-600">Customer Revenue</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(customer_revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                          <span className="text-sm text-gray-600">Manufacturer Costs</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(manufacturer_costs)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                            <span className="text-sm font-semibold text-gray-900">Net Profit</span>
                            <span className="font-bold text-green-600">{formatCurrency(net_profit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Statistics */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-green-600" />
                        Sales Statistics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-600">Total Sales</span>
                          <span className="font-semibold text-gray-900">{total_sales}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                          <span className="text-sm text-gray-600">Paid Sales</span>
                          <span className="font-semibold text-green-600">{paid_sales}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                          <span className="text-sm text-gray-600">Outstanding</span>
                          <span className="font-semibold text-orange-600">{total_sales - paid_sales}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                            <span className="text-sm font-semibold text-gray-900">Payment Rate</span>
                            <span className="font-bold text-blue-600">{formatPercentage(payment_rate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-purple-600" />
                        Performance Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-600">Avg. Order Value</span>
                          <span className="font-semibold text-gray-900">
                            {total_sales > 0 ? formatCurrency(customer_revenue / total_sales) : formatCurrency(0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                          <span className="text-sm text-gray-600">Profit Margin</span>
                          <span className="font-semibold text-purple-600">{formatPercentage(profitMargin)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                          <span className="text-sm text-gray-600">Revenue Growth</span>
                          <span className={`font-semibold ${getGrowthColor(revenueGrowth)}`}>
                            {revenueGrowth > 0 ? '+' : ''}{formatPercentage(revenueGrowth)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                          <span className="text-sm text-gray-600">Profit Growth</span>
                          <span className={`font-semibold ${getGrowthColor(profitGrowth)}`}>
                            {profitGrowth > 0 ? '+' : ''}{formatPercentage(profitGrowth)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
