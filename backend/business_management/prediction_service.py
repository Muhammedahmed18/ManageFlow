import numpy as np
import math
import pandas as pd
import hashlib
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from .models import Order, Product, Invoice, PredictionRecord, ProductConfidence
from business.models import Business

# ML imports
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Optional XGBoost import
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("DEBUG: XGBoost not available, using scikit-learn models only")

class AIPredictionService:
    """
    AI Prediction Service for business analytics
    """
    
    def __init__(self, business_id):
        self.business_id = business_id
        self.business = Business.objects.get(id=business_id)
    
    def calculate_product_confidence(self, product):
        """
        Calculate confidence score for individual product
        """
        # Get orders for this product
        orders = Order.objects.filter(
            business=self.business,
            data__product=product.name  # Orders store product name, not product_id
        ).order_by('created_at')
        
        if not orders.exists():
            # Return zero confidence for products with no orders
            print(f"DEBUG: No orders found for product '{product.name}'")
            return {
                'confidence': 0,
                'order_count': 0,
                'quantity_consistency': 0,
                'time_pattern_score': 0,
                'data_recency_score': 0
            }
        else:
            print(f"DEBUG: Found {orders.count()} orders for product '{product.name}', using real confidence")
        
        # Calculate order count score (0-40 points)
        order_count = orders.count()
        order_count_score = min(40, order_count * 4)  # Max 40 points for 10+ orders
        
        # Calculate quantity consistency (0-30 points)
        quantities = []
        for order in orders:
            try:
                # Extract quantity from order data
                order_data = order.data
                if isinstance(order_data, dict):
                    quantity = order_data.get('quantity', 1)
                    quantities.append(int(quantity))
            except:
                quantities.append(1)
        
        if quantities:
            # Use numpy for better performance
            quantity_array = np.array(quantities)
            quantity_mean = np.mean(quantity_array)
            quantity_std = np.std(quantity_array)
            
            if quantity_mean > 0:
                cv = quantity_std / quantity_mean  # Coefficient of variation
                quantity_consistency = max(0, 30 * (1 - cv))  # Lower CV = higher consistency
            else:
                quantity_consistency = 0
        else:
            quantity_consistency = 0
        
        # Calculate time pattern score (0-20 points)
        if order_count >= 2:
            order_dates = [order.created_at for order in orders]
            time_diffs = []
            for i in range(1, len(order_dates)):
                diff = (order_dates[i] - order_dates[i-1]).days
                time_diffs.append(diff)
            
            if time_diffs:
                # Use numpy for better performance
                time_array = np.array(time_diffs)
                time_mean = np.mean(time_array)
                time_std = np.std(time_array)
                
                if time_mean > 0:
                    time_cv = time_std / time_mean
                    time_pattern_score = max(0, 20 * (1 - time_cv))
                else:
                    time_pattern_score = 0
            else:
                time_pattern_score = 0
        else:
            time_pattern_score = 0
        
        # Calculate data recency score (0-10 points)
        latest_order = orders.latest('created_at')
        days_since_last_order = (timezone.now() - latest_order.created_at).days
        data_recency_score = max(0, 10 - (days_since_last_order / 30))  # Decay over 30 days
        
        # Calculate total confidence
        total_confidence = order_count_score + quantity_consistency + time_pattern_score + data_recency_score
        
        return {
            'confidence': round(total_confidence, 1),
            'order_count': order_count,
            'quantity_consistency': round(quantity_consistency, 1),
            'time_pattern_score': round(time_pattern_score, 1),
            'data_recency_score': round(data_recency_score, 1)
        }
    
    def calculate_overall_confidence(self):
        """
        Calculate overall business confidence
        """
        products = Product.objects.filter(business=self.business)
        total_confidence = 0
        total_weight = 0
        
        for product in products:
            confidence_data = self.calculate_product_confidence(product)
            confidence = confidence_data['confidence']
            order_count = confidence_data['order_count']
            
            # Weight by order count (more orders = higher weight)
            weight = max(1, order_count)
            total_confidence += confidence * weight
            total_weight += weight
        
        if total_weight > 0:
            overall_confidence = total_confidence / total_weight
        else:
            overall_confidence = 0
        
        return round(overall_confidence, 1)
    
    def generate_sales_forecast(self):
        """
        Generate sales forecast for next 3 months
        """
        # Get historical sales data
        orders = Order.objects.filter(
            business=self.business,
            status__in=['delivered', 'completed']
        ).order_by('created_at')
        
        # If no real data exists, generate demo data for demonstration
        if not orders.exists():
            print("DEBUG: No real sales data found, using demo forecast")
            return self._generate_demo_forecast()
        else:
            print(f"DEBUG: Found {orders.count()} real orders for sales forecast")
        
        # Group by month
        monthly_sales = {}
        for order in orders:
            month_key = order.created_at.strftime('%Y-%m')
            if month_key not in monthly_sales:
                monthly_sales[month_key] = 0
            
            # Extract amount from order data
            try:
                order_data = order.data
                if isinstance(order_data, dict):
                    amount = order_data.get('amount', 0)
                    monthly_sales[month_key] += float(amount)
            except:
                pass
        
        if len(monthly_sales) < 2:
            return {
                'forecast': [],
                'confidence': 0,
                'message': 'Need at least 2 months of data'
            }
        
        # Calculate trend
        months = sorted(monthly_sales.keys())
        sales_values = [monthly_sales[month] for month in months]
        
        # Use numpy for linear regression
        if len(sales_values) > 1:
            x_values = np.arange(len(sales_values))
            y_values = np.array(sales_values)
            
            # Use numpy polyfit for linear regression
            slope, intercept = np.polyfit(x_values, y_values, 1)
            
            # Generate forecast for next 3 months
            forecast = []
            for i in range(1, 4):
                predicted_value = slope * (len(x_values) + i) + intercept
                forecast.append({
                    'month': f'Month {i}',
                    'predicted_sales': round(max(0, predicted_value), 2),
                    'confidence': self.calculate_overall_confidence()
                })
        else:
            forecast = []
        
        return {
            'forecast': forecast,
            'confidence': self.calculate_overall_confidence(),
            'historical_data': monthly_sales
        }
    
    def get_product_performance_analysis(self):
        """
        Get performance analysis for all products
        """
        products = Product.objects.filter(business=self.business)
        product_analysis = []
        
        for product in products:
            confidence_data = self.calculate_product_confidence(product)
            
            # Get order count for this product
            order_count = Order.objects.filter(
                business=self.business,
                data__product=product.name  # Orders store product name, not product_id
            ).count()
            
            product_analysis.append({
                'product_id': product.id,
                'product_name': product.name,
                'confidence': confidence_data['confidence'],
                'order_count': order_count,
                'quantity_consistency': confidence_data['quantity_consistency'],
                'time_pattern_score': confidence_data['time_pattern_score'],
                'data_recency_score': confidence_data['data_recency_score'],
                'recommendations': self._get_product_recommendations(confidence_data)
            })
        
        return product_analysis
    
    def _get_product_recommendations(self, confidence_data):
        """
        Get recommendations for improving product confidence
        """
        recommendations = []
        
        if confidence_data['order_count'] < 3:
            recommendations.append("Need more orders to increase confidence")
        
        if confidence_data['quantity_consistency'] < 15:
            recommendations.append("Standardize order quantities for better prediction")
        
        if confidence_data['time_pattern_score'] < 10:
            recommendations.append("Establish regular ordering patterns")
        
        if confidence_data['data_recency_score'] < 5:
            recommendations.append("Recent orders needed for accurate predictions")
        
        return recommendations
    


    def generate_ml_sales_forecast(self):
        """
        Generate ML-powered sales forecast using multiple algorithms
        """
        # Get historical sales data from PAID manufacturer invoices (money earned)
        invoices = Invoice.objects.filter(
            business=self.business,
            status='paid',
            invoice_type='manufacturer'
        ).order_by('created_at')
        
        # If no real data exists, return empty forecast
        if not invoices.exists():
            print("DEBUG: No real sales data found")
            return {
                'forecast': [],
                'confidence': 0,
                'historical_data': {},
                'message': 'No sales data available for forecasting'
            }
        
        print(f"DEBUG: Found {invoices.count()} real invoices for ML forecast")
        
        # Prepare data for ML
        sales_data = []
        for invoice in invoices:
            try:
                amount = float(invoice.total_amount or invoice.amount or 0)
                if amount > 0:
                    sales_data.append({
                        'date': invoice.created_at.date(),
                        'amount': amount,
                        'month': invoice.created_at.month,
                        'day_of_week': invoice.created_at.weekday(),
                        'quarter': (invoice.created_at.month - 1) // 3 + 1
                    })
            except:
                continue
        
        if len(sales_data) < 1:
            print("DEBUG: Insufficient data for ML forecast")
            return {
                'forecast': [],
                'confidence': 0,
                'historical_data': {},
                'message': f'Insufficient data for ML forecast (need at least 1 order, found {len(sales_data)})'
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(sales_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Group by date and sum amounts
        daily_sales = df.groupby('date')['amount'].sum().reset_index()
        daily_sales['date'] = pd.to_datetime(daily_sales['date'])
        
        # Create features for ML
        daily_sales['day_of_week'] = daily_sales['date'].dt.dayofweek
        daily_sales['month'] = daily_sales['date'].dt.month
        daily_sales['quarter'] = daily_sales['date'].dt.quarter
        daily_sales['day_of_year'] = daily_sales['date'].dt.dayofyear
        daily_sales['week_of_year'] = daily_sales['date'].dt.isocalendar().week
        
        # For small datasets, use simpler features
        if len(daily_sales) < 7:
            # Simple features for small datasets
            daily_sales['lag_1'] = daily_sales['amount'].shift(1).fillna(0)
            daily_sales['rolling_3'] = daily_sales['amount'].rolling(window=min(3, len(daily_sales)), min_periods=1).mean()
            
            # Use only basic features
            feature_columns = ['day_of_week', 'month', 'quarter', 'day_of_year', 'week_of_year', 'lag_1', 'rolling_3']
        else:
            # Full feature set for larger datasets
            daily_sales['lag_1'] = daily_sales['amount'].shift(1)
            daily_sales['lag_7'] = daily_sales['amount'].shift(7)
            daily_sales['lag_30'] = daily_sales['amount'].shift(30)
            
            # Rolling averages
            daily_sales['rolling_7'] = daily_sales['amount'].rolling(window=7).mean()
            daily_sales['rolling_30'] = daily_sales['amount'].rolling(window=30).mean()
            
            # Remove NaN values for larger datasets
            daily_sales = daily_sales.dropna()
            
            feature_columns = ['day_of_week', 'month', 'quarter', 'day_of_year', 'week_of_year', 
                              'lag_1', 'lag_7', 'lag_30', 'rolling_7', 'rolling_30']
        
        if len(daily_sales) < 1:
            print("DEBUG: Insufficient data after feature engineering")
            return {
                'forecast': [],
                'confidence': 0,
                'historical_data': {},
                'message': f'Insufficient data after feature engineering (need at least 1 day of sales data, found {len(daily_sales)})'
            }
        
        # Prepare features and target
        X = daily_sales[feature_columns]
        y = daily_sales['amount']
        
        # For very small datasets, use all data for training
        if len(X) < 5:
            X_train, X_test = X, X
            y_train, y_test = y, y
        else:
            # Split data (use last 20% for testing)
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train multiple ML models
        models = {
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'Linear Regression': LinearRegression()
        }
        
        # Add XGBoost if available
        if XGBOOST_AVAILABLE:
            models['XGBoost'] = xgb.XGBRegressor(n_estimators=100, random_state=42)
        
        model_results = {}
        best_model = None
        best_score = -float('inf')
        
        for name, model in models.items():
            try:
                # Train model
                model.fit(X_train, y_train)
                
                # Make predictions
                y_pred = model.predict(X_test)
                
                # Calculate metrics
                mae = mean_absolute_error(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                model_results[name] = {
                    'model': model,
                    'mae': mae,
                    'mse': mse,
                    'r2': r2,
                    'predictions': y_pred
                }
                
                # Track best model (handle NaN values)
                if not pd.isna(r2) and r2 > best_score:
                    best_score = r2
                    best_model = name
                    
                print(f"DEBUG: {name} - R²: {r2:.3f}, MAE: {mae:.2f}")
                
            except Exception as e:
                print(f"DEBUG: Error training {name}: {str(e)}")
                continue
        
        if not model_results or best_model is None:
            print("DEBUG: No models trained successfully, creating simple forecast")
            # For small datasets, create a simple forecast based on the single data point
            if len(daily_sales) == 1:
                single_amount = daily_sales['amount'].iloc[0]
                forecast = [
                    {
                        'month': 'Month 1',
                        'predicted_sales': float(round(single_amount * 1.1, 2)),  # 10% growth
                        'confidence': 50.0
                    },
                    {
                        'month': 'Month 2', 
                        'predicted_sales': float(round(single_amount * 1.2, 2)),  # 20% growth
                        'confidence': 40.0
                    },
                    {
                        'month': 'Month 3',
                        'predicted_sales': float(round(single_amount * 1.3, 2)),  # 30% growth
                        'confidence': 30.0
                    }
                ]
                
                return {
                    'forecast': forecast,
                    'confidence': 40.0,
                    'model_performance': {},
                    'best_model': 'Simple Trend',
                    'historical_data': {str(k): float(v) for k, v in daily_sales.groupby(daily_sales['date'].dt.to_period('M'))['amount'].sum().to_dict().items()},
                    'message': f'Simple forecast based on single sale of ${single_amount:.2f} (low confidence due to limited data)'
                }
            else:
                return {
                    'forecast': [],
                    'confidence': 0,
                    'model_performance': {},
                    'best_model': 'None',
                    'historical_data': {},
                    'message': 'Insufficient data to train ML models (need more sales data)'
                }
        
        # Generate future predictions using best model
        best_model_obj = model_results[best_model]['model']
        
        # Create future dates (next 3 months)
        last_date = daily_sales['date'].max()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=90, freq='D')
        
        # Prepare future features
        future_data = []
        for date in future_dates:
            future_data.append({
                'date': date,
                'day_of_week': date.dayofweek,
                'month': date.month,
                'quarter': (date.month - 1) // 3 + 1,
                'day_of_year': date.dayofyear,
                'week_of_year': date.isocalendar()[1]
            })
        
        future_df = pd.DataFrame(future_data)
        
        # Add lag features for future predictions (use last known values)
        if 'lag_1' in feature_columns:
            last_lag_1 = daily_sales['amount'].iloc[-1]
            future_df['lag_1'] = last_lag_1
        
        if 'lag_7' in feature_columns:
            last_lag_7 = daily_sales['amount'].iloc[-7] if len(daily_sales) >= 7 else last_lag_1
            future_df['lag_7'] = last_lag_7
        
        if 'lag_30' in feature_columns:
            last_lag_30 = daily_sales['amount'].iloc[-30] if len(daily_sales) >= 30 else last_lag_1
            future_df['lag_30'] = last_lag_30
        
        if 'rolling_7' in feature_columns:
            last_rolling_7 = daily_sales['rolling_7'].iloc[-1]
            future_df['rolling_7'] = last_rolling_7
        
        if 'rolling_30' in feature_columns:
            last_rolling_30 = daily_sales['rolling_30'].iloc[-1]
            future_df['rolling_30'] = last_rolling_30
            
        if 'rolling_3' in feature_columns:
            last_rolling_3 = daily_sales['rolling_3'].iloc[-1]
            future_df['rolling_3'] = last_rolling_3
        
        # Make predictions
        future_features = future_df[feature_columns]
        future_predictions = best_model_obj.predict(future_features)
        
        # Group by month for forecast
        future_df['predicted_amount'] = future_predictions
        monthly_forecast = future_df.groupby(future_df['date'].dt.to_period('M'))['predicted_amount'].sum().reset_index()
        
        forecast = []
        for i, row in monthly_forecast.iterrows():
            forecast.append({
                'month': f'Month {i+1}',
                'predicted_sales': float(round(max(0, row['predicted_amount']), 2)),
                'confidence': float(round(model_results[best_model]['r2'] * 100, 1))
            })
        
        # Calculate overall confidence based on model performance
        overall_confidence = round(model_results[best_model]['r2'] * 100, 1)
        
        return {
            'forecast': forecast,
            'confidence': float(overall_confidence),
            'model_performance': {
                name: {
                    'r2': float(round(results['r2'], 3)),
                    'mae': float(round(results['mae'], 2)),
                    'mse': float(round(results['mse'], 2))
                } for name, results in model_results.items()
            },
            'best_model': best_model,
            'historical_data': {str(k): float(v) for k, v in daily_sales.groupby(daily_sales['date'].dt.to_period('M'))['amount'].sum().to_dict().items()},
            'message': f'ML forecast using {best_model} (R²: {model_results[best_model]["r2"]:.3f})'
        }





    def detect_anomalies(self):
        """
        Detect anomalies in sales, orders, and customer behavior using Isolation Forest
        """
        # Get recent paid invoices for financial anomaly detection
        invoices = Invoice.objects.filter(
            business=self.business,
            status='paid',
            invoice_type='manufacturer'
        ).order_by('-created_at')[:100]  # Last 100 invoices
        
        # Get recent orders for behavioral anomaly detection
        orders = Order.objects.filter(
            business=self.business
        ).order_by('-created_at')[:100]  # Last 100 orders
        
        if not invoices.exists() and not orders.exists():
            print("DEBUG: No data found for anomaly detection")
            return {
                'anomalies': [],
                'statistics': {
                    'total_orders_analyzed': 0,
                    'total_anomalies': 0,
                    'anomaly_percentage': 0,
                    'anomaly_types': {}
                },
                'detection_method': 'Isolation Forest',
                'message': 'No data available for anomaly detection'
            }
        
        print(f"DEBUG: Found {invoices.count()} invoices and {orders.count()} orders for anomaly detection")
        
        # Prepare data for anomaly detection
        anomaly_data = []
        
        # Analyze invoices for financial anomalies
        for invoice in invoices:
            try:
                amount = float(invoice.total_amount or invoice.amount or 0)
                if amount > 0:
                    # Calculate invoice features
                    invoice_date = invoice.created_at
                    day_of_week = invoice_date.weekday()
                    hour_of_day = invoice_date.hour
                    month = invoice_date.month
                    
                    # Get customer info from invoice
                    customer_name = invoice.customer_name or "Unknown"
                    
                    # Find related orders for this customer
                    customer_orders = Order.objects.filter(
                        business=self.business,
                        customer__first_name__icontains=customer_name.split()[0] if customer_name else ""
                    )
                    customer_total_orders = customer_orders.count()
                    
                    # Calculate average invoice amount for this customer
                    customer_invoices = Invoice.objects.filter(
                        business=self.business,
                        status='paid',
                        invoice_type='manufacturer',
                        customer_name__icontains=customer_name
                    )
                    customer_avg_amount = customer_invoices.aggregate(
                        avg_amount=Avg('total_amount')
                    )['avg_amount'] or 0
                        
                    anomaly_data.append({
                        'invoice_id': invoice.id,
                        'amount': amount,
                        'day_of_week': day_of_week,
                        'hour_of_day': hour_of_day,
                        'month': month,
                        'customer_total_orders': customer_total_orders,
                        'customer_avg_amount': float(customer_avg_amount),
                        'amount_deviation': abs(amount - float(customer_avg_amount)) if customer_avg_amount > 0 else amount,
                        'invoice_date': invoice_date.isoformat(),
                        'customer_name': customer_name
                    })
                        
            except Exception as e:
                print(f"DEBUG: Error processing invoice {invoice.id}: {str(e)}")
                continue
        
        if len(anomaly_data) < 1:
            print("DEBUG: Insufficient data for anomaly detection")
            return {
                'anomalies': [],
                'statistics': {
                    'total_invoices_analyzed': len(anomaly_data),
                    'total_anomalies': 0,
                    'anomaly_percentage': 0,
                    'anomaly_types': {}
                },
                'detection_method': 'Isolation Forest',
                'message': f'Insufficient data for anomaly detection (need at least 1 invoice, found {len(anomaly_data)})'
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(anomaly_data)
        
        # Prepare features for anomaly detection
        features = ['amount', 'day_of_week', 'hour_of_day', 'month', 'customer_total_orders', 'amount_deviation']
        X = df[features].values
        
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Use Isolation Forest for anomaly detection
        from sklearn.ensemble import IsolationForest
        
        # Train isolation forest
        iso_forest = IsolationForest(
            contamination=0.1,  # Expect 10% anomalies
            random_state=42,
            n_estimators=100
        )
        
        # Fit and predict
        anomaly_labels = iso_forest.fit_predict(X_scaled)
        
        # Add anomaly labels to dataframe
        df['is_anomaly'] = anomaly_labels == -1
        df['anomaly_score'] = iso_forest.decision_function(X_scaled)
        
        # Get anomalies
        anomalies = df[df['is_anomaly'] == True].copy()
        normal_invoices = df[df['is_anomaly'] == False].copy()
        
        # Analyze anomalies
        anomaly_analysis = []
        for _, anomaly in anomalies.iterrows():
            # Determine anomaly type
            amount = anomaly['amount']
            avg_amount = df['amount'].mean()
            std_amount = df['amount'].std()
            
            if amount > avg_amount + 2 * std_amount:
                anomaly_type = "High Value Invoice"
                severity = "High"
                description = f"Invoice amount (${amount:.2f}) is significantly higher than average (${avg_amount:.2f})"
            elif amount < avg_amount - 2 * std_amount:
                anomaly_type = "Low Value Invoice"
                severity = "Medium"
                description = f"Invoice amount (${amount:.2f}) is significantly lower than average (${avg_amount:.2f})"
            elif anomaly['hour_of_day'] < 6 or anomaly['hour_of_day'] > 22:
                anomaly_type = "Unusual Time"
                severity = "Low"
                description = f"Invoice created at unusual hour ({anomaly['hour_of_day']}:00)"
            elif anomaly['customer_total_orders'] == 1:
                anomaly_type = "New Customer"
                severity = "Low"
                description = "First invoice from this customer"
            else:
                anomaly_type = "Behavioral Anomaly"
                severity = "Medium"
                description = "Unusual invoice pattern detected"
            
            anomaly_analysis.append({
                'invoice_id': int(anomaly['invoice_id']),
                'customer_name': anomaly['customer_name'],
                'amount': round(anomaly['amount'], 2),
                'invoice_date': anomaly['invoice_date'],
                'anomaly_type': anomaly_type,
                'severity': severity,
                'description': description,
                'anomaly_score': round(anomaly['anomaly_score'], 3),
                'features': {
                    'day_of_week': int(anomaly['day_of_week']),
                    'hour_of_day': int(anomaly['hour_of_day']),
                    'month': int(anomaly['month']),
                    'customer_total_orders': int(anomaly['customer_total_orders'])
                }
            })
        
        # Calculate statistics
        total_invoices = len(df)
        total_anomalies = len(anomalies)
        anomaly_percentage = (total_anomalies / total_invoices) * 100 if total_invoices > 0 else 0
        
        # Group anomalies by type
        anomaly_types = {}
        for anomaly in anomaly_analysis:
            anomaly_type = anomaly['anomaly_type']
            if anomaly_type not in anomaly_types:
                anomaly_types[anomaly_type] = 0
            anomaly_types[anomaly_type] += 1
        
        return {
            'anomalies': anomaly_analysis,
            'statistics': {
                'total_invoices_analyzed': total_invoices,
                'total_anomalies': total_anomalies,
                'anomaly_percentage': round(anomaly_percentage, 1),
                'anomaly_types': anomaly_types
            },
            'features_used': features,
            'detection_method': 'Isolation Forest',
            'contamination_rate': 0.1,
            'message': f'Anomaly detection using Isolation Forest ({total_anomalies} anomalies found)'
        }


    


    def get_business_growth_data(self, time_period='monthly'):
        """
        Get real business growth data for the dashboard
        """
        from datetime import datetime, timedelta
        from django.db.models import Count, Sum, Q
        
        # Calculate date ranges
        end_date = timezone.now()
        if time_period == 'weekly':
            start_date = end_date - timedelta(days=90)  # 12 weeks
            group_by = 'week'
        elif time_period == 'monthly':
            start_date = end_date - timedelta(days=365)  # 12 months
            group_by = 'month'
        else:  # quarterly
            start_date = end_date - timedelta(days=1095)  # 12 quarters
            group_by = 'quarter'
        
        print(f"DEBUG: Date range - Start: {start_date}, End: {end_date}")
        print(f"DEBUG: Time period: {time_period}, Group by: {group_by}")
        
        # Get revenue growth data (from paid manufacturer invoices)
        revenue_data = []
        invoices = Invoice.objects.filter(
            business=self.business,
            status='paid',
            invoice_type='manufacturer',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).order_by('created_at')
        
        # Group by time period
        current_period = start_date
        while current_period <= end_date:
            if group_by == 'week':
                period_end = current_period + timedelta(days=7)
                period_key = current_period.strftime('%Y-W%U')
            elif group_by == 'month':
                period_end = current_period.replace(day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = current_period.strftime('%Y-%m')
            else:  # quarter
                quarter = (current_period.month - 1) // 3 + 1
                period_end = current_period.replace(month=quarter * 3, day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = f"{current_period.year}-Q{quarter}"
            
            period_invoices = invoices.filter(
                created_at__gte=current_period,
                created_at__lt=period_end
            )
            
            period_revenue = period_invoices.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            revenue_data.append({
                'period': period_key,
                'revenue': float(period_revenue),
                'date': current_period.strftime('%Y-%m-%d')
            })
            
            if group_by == 'week':
                current_period += timedelta(days=7)
            elif group_by == 'month':
                current_period = (current_period.replace(day=1) + timedelta(days=32)).replace(day=1)
            else:  # quarter
                current_period = (current_period.replace(month=quarter * 3 + 1, day=1) + timedelta(days=32)).replace(day=1)
        
        # Get order growth data
        order_data = []
        # Get all orders for this business to debug
        all_orders = Order.objects.filter(business=self.business)
        print(f"DEBUG: Total orders for business {self.business.id}: {all_orders.count()}")
        for order in all_orders:
            print(f"DEBUG: Order {order.id} - Status: {order.status}, Created: {order.created_at}")
        
        # First, let's get orders without date filtering to see if any exist
        all_valid_orders = Order.objects.filter(
            business=self.business,
            status__in=['completed', 'delivered', 'pending', 'in_production', 'shipped']  # Include all statuses for debugging
        )
        print(f"DEBUG: All valid status orders: {all_valid_orders.count()}")
        
        orders = Order.objects.filter(
            business=self.business,
            status__in=['completed', 'delivered'],  # Include both completed and delivered orders
            created_at__gte=start_date,
            created_at__lte=end_date
        ).order_by('created_at')
        
        print(f"DEBUG: Date-filtered orders: {orders.count()}")
        
        # If no orders in date range, let's get the most recent order regardless of date
        if orders.count() == 0:
            print("DEBUG: No orders in date range, getting most recent order")
            recent_order = Order.objects.filter(
                business=self.business,
                status__in=['completed', 'delivered']
            ).order_by('-created_at').first()
            
            if recent_order:
                print(f"DEBUG: Most recent order: {recent_order.id} - Status: {recent_order.status}, Created: {recent_order.created_at}")
                # Adjust date range to include this order
                if recent_order.created_at < start_date:
                    start_date = recent_order.created_at.replace(day=1)  # Start from beginning of month
                    print(f"DEBUG: Adjusted start_date to: {start_date}")
                if recent_order.created_at > end_date:
                    end_date = recent_order.created_at + timedelta(days=1)  # Include the order date
                    print(f"DEBUG: Adjusted end_date to: {end_date}")
                
                # Re-query with adjusted dates
                orders = Order.objects.filter(
                    business=self.business,
                    status__in=['completed', 'delivered'],
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).order_by('created_at')
                print(f"DEBUG: Re-queried orders with adjusted dates: {orders.count()}")
        
        current_period = start_date
        while current_period <= end_date:
            if group_by == 'week':
                period_end = current_period + timedelta(days=7)
                period_key = current_period.strftime('%Y-W%U')
            elif group_by == 'month':
                period_end = current_period.replace(day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = current_period.strftime('%Y-%m')
            else:  # quarter
                quarter = (current_period.month - 1) // 3 + 1
                period_end = current_period.replace(month=quarter * 3, day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = f"{current_period.year}-Q{quarter}"
            
            period_orders = orders.filter(
                created_at__gte=current_period,
                created_at__lt=period_end
            )
            
            order_count = period_orders.count()
            
            if order_count > 0:
                print(f"DEBUG: Period {period_key} has {order_count} orders")
                for order in period_orders:
                    print(f"DEBUG:   - Order {order.id}: {order.status} at {order.created_at}")
            
            order_data.append({
                'period': period_key,
                'orders': order_count,
                'date': current_period.strftime('%Y-%m-%d')
            })
            
            if group_by == 'week':
                current_period += timedelta(days=7)
            elif group_by == 'month':
                current_period = (current_period.replace(day=1) + timedelta(days=32)).replace(day=1)
            else:  # quarter
                current_period = (current_period.replace(month=quarter * 3 + 1, day=1) + timedelta(days=32)).replace(day=1)
        
        # Get customer growth data
        customer_data = []
        current_period = start_date
        while current_period <= end_date:
            if group_by == 'week':
                period_end = current_period + timedelta(days=7)
                period_key = current_period.strftime('%Y-W%U')
            elif group_by == 'month':
                period_end = current_period.replace(day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = current_period.strftime('%Y-%m')
            else:  # quarter
                quarter = (current_period.month - 1) // 3 + 1
                period_end = current_period.replace(month=quarter * 3, day=1) + timedelta(days=32)
                period_end = period_end.replace(day=1) - timedelta(days=1)
                period_key = f"{current_period.year}-Q{quarter}"
            
            # Count unique customers up to this period
            period_customers = Order.objects.filter(
                business=self.business,
                created_at__lte=period_end
            ).values('customer').distinct().count()
            
            customer_data.append({
                'period': period_key,
                'customers': period_customers,
                'date': current_period.strftime('%Y-%m-%d')
            })
            
            if group_by == 'week':
                current_period += timedelta(days=7)
            elif group_by == 'month':
                current_period = (current_period.replace(day=1) + timedelta(days=32)).replace(day=1)
            else:  # quarter
                current_period = (current_period.replace(month=quarter * 3 + 1, day=1) + timedelta(days=32)).replace(day=1)
        
        # Calculate growth percentages
        def calculate_growth_percentage(data_list, key):
            if len(data_list) < 2:
                print(f"DEBUG: Not enough data for {key} growth calculation")
                return 0
            
            current_value = data_list[-1][key]
            previous_value = data_list[-2][key]
            
            print(f"DEBUG: {key} growth calculation - Current: {current_value}, Previous: {previous_value}")
            
            if previous_value == 0:
                growth = 100 if current_value > 0 else 0
                print(f"DEBUG: {key} growth (from 0): {growth}%")
                return growth
            
            growth = round(((current_value - previous_value) / previous_value) * 100, 1)
            print(f"DEBUG: {key} growth: {growth}%")
            return growth
        
        print(f"DEBUG: Revenue data points: {len(revenue_data)}")
        print(f"DEBUG: Order data points: {len(order_data)}")
        print(f"DEBUG: Customer data points: {len(customer_data)}")
        
        if order_data:
            print(f"DEBUG: Order data sample: {order_data[:3]}")
        
        revenue_growth = calculate_growth_percentage(revenue_data, 'revenue')
        order_growth = calculate_growth_percentage(order_data, 'orders')
        customer_growth = calculate_growth_percentage(customer_data, 'customers')
        
        # Calculate totals
        total_revenue = sum(item['revenue'] for item in revenue_data)
        total_orders = sum(item['orders'] for item in order_data)
        total_customers = customer_data[-1]['customers'] if customer_data else 0
        
        print(f"DEBUG: Final totals - Revenue: {total_revenue}, Orders: {total_orders}, Customers: {total_customers}")
        print(f"DEBUG: Final growth - Revenue: {revenue_growth}%, Orders: {order_growth}%, Customers: {customer_growth}%")
        
        return {
            'revenue_growth': revenue_growth,
            'order_growth': order_growth,
            'customer_growth': customer_growth,
            'revenue_data': revenue_data,
            'order_data': order_data,
            'customer_data': customer_data,
            'time_period': time_period,
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'total_customers': total_customers
        }
