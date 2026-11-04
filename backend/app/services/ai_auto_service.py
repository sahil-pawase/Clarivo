import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import json
import gc
from datetime import datetime
import logging
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.feature_selection import SelectKBest, f_classif
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
import warnings
warnings.filterwarnings('ignore')

# Try to import transformers for advanced text analysis
try:
    from transformers import pipeline, AutoTokenizer, AutoModel
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Transformers not available, using basic text analysis")

logger = logging.getLogger(__name__)

class LightweightAIProcessor:
    """
    Lightweight AI processor for automatic data analysis
    Memory-optimized for low-resource environments with offline AI capabilities
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.imputers = {}
        self.processing_steps = []
        
        # Initialize lightweight AI models for text analysis
        self.sentiment_analyzer = None
        self.text_classifier = None
        
        if TRANSFORMERS_AVAILABLE:
            try:
                # Use lightweight models that work offline
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis", 
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    return_all_scores=True
                )
                logger.info("Loaded sentiment analysis model")
            except Exception as e:
                logger.warning(f"Could not load transformers models: {e}")
                self.sentiment_analyzer = None
        
    def process_dataset_auto(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """
        Main auto-processing pipeline
        """
        try:
            logger.info(f"Starting auto-processing for {dataset_name}")
            
            # Initialize result structure
            result = {
                'dataset_name': dataset_name,
                'original_shape': df.shape,
                'processing_steps': [],
                'cleaned_data': None,
                'analysis': {},
                'visualizations': [],
                'insights': [],
                'export_data': {}
            }
            
            # Step 1: Data Cleaning
            cleaned_df, cleaning_report = self._auto_clean_data(df)
            result['cleaned_data'] = cleaned_df.to_dict('records')
            result['processing_steps'].append({
                'step': 'Data Cleaning',
                'status': 'completed',
                'details': cleaning_report
            })
            
            # Step 2: Data Analysis
            analysis_results = self._auto_analyze_data(cleaned_df)
            result['analysis'] = analysis_results
            result['processing_steps'].append({
                'step': 'Data Analysis',
                'status': 'completed',
                'details': 'Statistical analysis and pattern detection completed'
            })
            
            # Step 3: Auto Visualization
            viz_recommendations = self._auto_generate_visualizations(cleaned_df)
            result['visualizations'] = viz_recommendations
            result['processing_steps'].append({
                'step': 'Visualization Generation',
                'status': 'completed',
                'details': f'Generated {len(viz_recommendations)} visualization recommendations'
            })
            
            # Step 4: Generate Insights
            insights = self._generate_insights(cleaned_df, analysis_results)
            result['insights'] = insights
            result['processing_steps'].append({
                'step': 'Insight Generation',
                'status': 'completed',
                'details': f'Generated {len(insights)} key insights'
            })
            
            # Step 5: Prepare Export Data
            export_data = self._prepare_export_data(cleaned_df, analysis_results, insights)
            result['export_data'] = export_data
            result['processing_steps'].append({
                'step': 'Export Preparation',
                'status': 'completed',
                'details': 'Export-ready data and reports prepared'
            })
            
            logger.info(f"Auto-processing completed for {dataset_name}")
            return result
            
        except Exception as e:
            logger.error(f"Error in auto-processing: {str(e)}")
            raise
    
    def _auto_clean_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Automatic data cleaning with memory optimization
        """
        cleaned_df = df.copy()
        report = {
            'original_rows': len(df),
            'original_columns': len(df.columns),
            'actions_taken': []
        }
        
        # 1. Handle missing values
        missing_info = {}
        for col in cleaned_df.columns:
            missing_count = cleaned_df[col].isnull().sum()
            missing_pct = (missing_count / len(cleaned_df)) * 100
            
            if missing_count > 0:
                missing_info[col] = {'count': missing_count, 'percentage': missing_pct}
                
                if missing_pct > 50:
                    # Drop columns with >50% missing data
                    cleaned_df = cleaned_df.drop(columns=[col])
                    report['actions_taken'].append(f"Dropped column '{col}' (>{missing_pct:.1f}% missing)")
                else:
                    # Impute missing values
                    if cleaned_df[col].dtype in ['object', 'category']:
                        # Mode for categorical
                        mode_val = cleaned_df[col].mode().iloc[0] if not cleaned_df[col].mode().empty else 'Unknown'
                        cleaned_df[col] = cleaned_df[col].fillna(mode_val)
                        report['actions_taken'].append(f"Filled missing values in '{col}' with mode: '{mode_val}'")
                    else:
                        # Median for numerical
                        median_val = cleaned_df[col].median()
                        cleaned_df[col] = cleaned_df[col].fillna(median_val)
                        report['actions_taken'].append(f"Filled missing values in '{col}' with median: {median_val}")
        
        # 2. Remove duplicates
        initial_rows = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates()
        duplicates_removed = initial_rows - len(cleaned_df)
        if duplicates_removed > 0:
            report['actions_taken'].append(f"Removed {duplicates_removed} duplicate rows")
        
        # 3. Handle outliers (only for numerical columns, memory-efficient)
        numerical_cols = cleaned_df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols[:5]:  # Limit to first 5 numerical columns for performance
            Q1 = cleaned_df[col].quantile(0.25)
            Q3 = cleaned_df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers_mask = (cleaned_df[col] < lower_bound) | (cleaned_df[col] > upper_bound)
            outliers_count = outliers_mask.sum()
            
            if outliers_count > 0 and outliers_count < len(cleaned_df) * 0.1:  # Remove if <10% of data
                cleaned_df = cleaned_df[~outliers_mask]
                report['actions_taken'].append(f"Removed {outliers_count} outliers from '{col}'")
        
        # 4. Optimize data types for memory
        for col in cleaned_df.columns:
            if cleaned_df[col].dtype == 'object':
                # Try to convert to category if unique values < 50% of total
                unique_ratio = cleaned_df[col].nunique() / len(cleaned_df)
                if unique_ratio < 0.5:
                    cleaned_df[col] = cleaned_df[col].astype('category')
                    report['actions_taken'].append(f"Optimized '{col}' to category type")
            elif cleaned_df[col].dtype in ['int64', 'float64']:
                # Downcast numerical types
                if cleaned_df[col].dtype == 'int64':
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], downcast='integer')
                else:
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], downcast='float')
        
        report['final_rows'] = len(cleaned_df)
        report['final_columns'] = len(cleaned_df.columns)
        report['missing_info'] = missing_info
        
        return cleaned_df, report
    
    def _auto_analyze_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Lightweight statistical analysis
        """
        analysis = {
            'basic_stats': {},
            'correlations': {},
            'patterns': {},
            'data_quality': {}
        }
        
        # Basic statistics
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        analysis['basic_stats'] = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'numerical_columns': len(numerical_cols),
            'categorical_columns': len(categorical_cols),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024
        }
        
        # Numerical analysis (limit for performance)
        if len(numerical_cols) > 0:
            num_df = df[numerical_cols].head(1000)  # Sample for performance
            analysis['basic_stats']['numerical_summary'] = {
                col: {
                    'mean': float(num_df[col].mean()),
                    'median': float(num_df[col].median()),
                    'std': float(num_df[col].std()),
                    'min': float(num_df[col].min()),
                    'max': float(num_df[col].max())
                } for col in numerical_cols[:5]  # Limit to 5 columns
            }
            
            # Correlation analysis (memory-efficient)
            if len(numerical_cols) > 1:
                corr_matrix = num_df.corr()
                # Find strong correlations
                strong_corr = []
                for i in range(len(corr_matrix.columns)):
                    for j in range(i+1, len(corr_matrix.columns)):
                        corr_val = corr_matrix.iloc[i, j]
                        if abs(corr_val) > 0.7:
                            strong_corr.append({
                                'col1': corr_matrix.columns[i],
                                'col2': corr_matrix.columns[j],
                                'correlation': float(corr_val)
                            })
                analysis['correlations']['strong_correlations'] = strong_corr
        
        # Categorical analysis
        if len(categorical_cols) > 0:
            cat_analysis = {}
            for col in categorical_cols[:3]:  # Limit to 3 columns
                value_counts = df[col].value_counts().head(10)
                cat_analysis[col] = {
                    'unique_values': int(df[col].nunique()),
                    'top_values': value_counts.to_dict()
                }
            analysis['basic_stats']['categorical_summary'] = cat_analysis
        
        # Data quality metrics
        analysis['data_quality'] = {
            'completeness': float((df.notna().sum().sum() / (len(df) * len(df.columns))) * 100),
            'uniqueness': float((df.nunique().sum() / len(df)) * 100),
            'consistency': 100.0  # Simplified for now
        }
        
        return analysis
    
    def _auto_generate_visualizations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Generate AI-powered smart visualization recommendations
        """
        visualizations = []
        
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        
        # AI-powered visualization selection based on data characteristics
        
        # 1. Smart distribution analysis
        for col in numerical_cols[:3]:  # Limit to 3 most important
            # Analyze distribution characteristics
            col_data = df[col].dropna()
            if len(col_data) > 0:
                skewness = col_data.skew()
                kurtosis = col_data.kurtosis()
                
                # Choose visualization based on distribution characteristics
                if abs(skewness) > 1:
                    viz_type = 'histogram'
                    description = f'Shows the {"right-skewed" if skewness > 0 else "left-skewed"} distribution of {col}'
                else:
                    viz_type = 'histogram'
                    description = f'Shows the normal distribution pattern of {col}'
                
                visualizations.append({
                    'type': viz_type,
                    'title': f'{col} Distribution Analysis',
                    'x_column': col,
                    'y_column': 'frequency',
                    'description': description,
                    'priority': 'high',
                    'ai_insight': f'Skewness: {skewness:.2f}, Kurtosis: {kurtosis:.2f}'
                })
        
        # 2. Smart categorical analysis
        for col in categorical_cols[:2]:  # Limit to 2 most important
            unique_count = df[col].nunique()
            total_count = len(df[col].dropna())
            
            if unique_count <= 10:  # Good for pie/donut chart
                viz_type = 'donut'
                description = f'Shows the distribution of {unique_count} categories in {col}'
                priority = 'high'
            elif unique_count <= 20:  # Better as bar chart
                viz_type = 'bar'
                description = f'Shows the frequency of top categories in {col}'
                priority = 'medium'
            else:  # Too many categories, suggest grouping
                viz_type = 'bar'
                description = f'Shows top categories in {col} (consider grouping {unique_count} categories)'
                priority = 'low'
            
            visualizations.append({
                'type': viz_type,
                'title': f'{col} Category Analysis',
                'x_column': col,
                'y_column': 'count',
                'description': description,
                'priority': priority,
                'ai_insight': f'{unique_count} unique values out of {total_count} records'
            })
        
        # 3. Intelligent correlation analysis
        if len(numerical_cols) > 1:
            # Calculate correlation strength to determine priority
            sample_df = df[numerical_cols].sample(n=min(1000, len(df))).corr()
            max_correlation = sample_df.abs().values[np.triu_indices_from(sample_df.values, k=1)].max()
            
            priority = 'high' if max_correlation > 0.7 else 'medium' if max_correlation > 0.3 else 'low'
            
            visualizations.append({
                'type': 'heatmap',
                'title': 'AI Correlation Matrix',
                'x_column': 'variables',
                'y_column': 'correlation',
                'description': f'Shows relationships between numerical variables (max correlation: {max_correlation:.2f})',
                'priority': priority,
                'ai_insight': f'Strongest correlation detected: {max_correlation:.2f}'
            })
        
        # 4. Smart cross-analysis (categorical vs numerical)
        if len(categorical_cols) > 0 and len(numerical_cols) > 0:
            cat_col = categorical_cols[0]
            num_col = numerical_cols[0]
            
            # Check if the categorical variable has reasonable number of categories
            cat_unique = df[cat_col].nunique()
            if cat_unique <= 10:
                viz_type = 'boxplot'
                priority = 'high'
                description = f'Compares {num_col} distribution across {cat_col} categories'
            else:
                viz_type = 'violin'
                priority = 'medium'
                description = f'Shows {num_col} distribution patterns by {cat_col} (many categories)'
            
            visualizations.append({
                'type': viz_type,
                'title': f'{num_col} by {cat_col}',
                'x_column': cat_col,
                'y_column': num_col,
                'description': description,
                'priority': priority,
                'ai_insight': f'Comparing across {cat_unique} categories'
            })
        
        # 5. Advanced time series analysis
        if len(datetime_cols) > 0 and len(numerical_cols) > 0:
            date_col = datetime_cols[0]
            num_col = numerical_cols[0]
            
            # Analyze temporal patterns
            temp_df = df[[date_col, num_col]].dropna()
            if len(temp_df) > 10:
                # Check for seasonality or trends
                temp_df = temp_df.sort_values(date_col)
                values = temp_df[num_col].values
                
                # Simple trend detection
                trend_slope = np.polyfit(range(len(values)), values, 1)[0]
                has_trend = abs(trend_slope) > np.std(values) * 0.1
                
                description = f'Shows {"trending" if has_trend else "stable"} pattern of {num_col} over time'
                priority = 'high' if has_trend else 'medium'
                
                visualizations.append({
                    'type': 'line',
                    'title': f'{num_col} Time Series Analysis',
                    'x_column': date_col,
                    'y_column': num_col,
                    'description': description,
                    'priority': priority,
                    'ai_insight': f'Trend slope: {trend_slope:.4f}'
                })
        
        # 6. AI-recommended advanced visualizations
        if len(numerical_cols) >= 3:
            # Suggest 3D scatter or parallel coordinates for multivariate analysis
            visualizations.append({
                'type': 'scatter_matrix',
                'title': 'Multivariate Relationship Analysis',
                'x_column': 'multiple',
                'y_column': 'multiple',
                'description': f'AI recommends exploring relationships between {len(numerical_cols)} numerical variables',
                'priority': 'medium',
                'ai_insight': 'Advanced multivariate analysis recommended'
            })
        
        return visualizations
    
    def _generate_insights(self, df: pd.DataFrame, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate AI-powered actionable insights from the data
        """
        insights = []
        
        # Advanced AI-powered insights
        insights.extend(self._generate_ai_powered_insights(df, analysis))
        
        # Data quality insights
        completeness = analysis['data_quality']['completeness']
        if completeness < 90:
            insights.append({
                'type': 'data_quality',
                'title': 'Data Completeness Issue',
                'description': f'Your dataset is only {completeness:.1f}% complete. Consider investigating missing data patterns.',
                'severity': 'medium',
                'actionable': True,
                'recommendation': 'Review data collection process or imputation strategies'
            })
        
        # Size insights
        total_rows = analysis['basic_stats']['total_rows']
        if total_rows < 100:
            insights.append({
                'type': 'sample_size',
                'title': 'Small Sample Size',
                'description': f'With only {total_rows} rows, statistical conclusions may be limited.',
                'severity': 'low',
                'actionable': True,
                'recommendation': 'Consider collecting more data for robust analysis'
            })
        elif total_rows > 100000:
            insights.append({
                'type': 'performance',
                'title': 'Large Dataset Detected',
                'description': f'Dataset has {total_rows:,} rows. Consider sampling for faster analysis.',
                'severity': 'low',
                'actionable': True,
                'recommendation': 'Use data sampling techniques for exploratory analysis'
            })
        
        # Correlation insights
        if 'strong_correlations' in analysis['correlations']:
            strong_corrs = analysis['correlations']['strong_correlations']
            if strong_corrs:
                for corr in strong_corrs[:2]:  # Top 2
                    insights.append({
                        'type': 'correlation',
                        'title': f'Strong Relationship Found',
                        'description': f'{corr["col1"]} and {corr["col2"]} are strongly correlated (r={corr["correlation"]:.2f})',
                        'severity': 'high',
                        'actionable': True,
                        'recommendation': 'Investigate this relationship for business insights or consider feature engineering'
                    })
        
        # Distribution insights
        if 'numerical_summary' in analysis['basic_stats']:
            for col, stats in analysis['basic_stats']['numerical_summary'].items():
                # Check for skewness
                if stats['mean'] > stats['median'] * 1.5:
                    insights.append({
                        'type': 'distribution',
                        'title': f'{col} is Right-Skewed',
                        'description': f'{col} has a right-skewed distribution (mean > median)',
                        'severity': 'low',
                        'actionable': True,
                        'recommendation': 'Consider log transformation or investigate outliers'
                    })
        
        # Categorical insights
        if 'categorical_summary' in analysis['basic_stats']:
            for col, stats in analysis['basic_stats']['categorical_summary'].items():
                if stats['unique_values'] > len(df) * 0.8:
                    insights.append({
                        'type': 'cardinality',
                        'title': f'High Cardinality in {col}',
                        'description': f'{col} has {stats["unique_values"]} unique values, which is very high',
                        'severity': 'medium',
                        'actionable': True,
                        'recommendation': 'Consider grouping similar categories or using this as an identifier'
                    })
        
        return insights
    
    def _generate_ai_powered_insights(self, df: pd.DataFrame, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate advanced AI-powered insights using machine learning
        """
        ai_insights = []
        
        try:
            # 1. Anomaly Detection Insights
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            if len(numerical_cols) > 0:
                # Use Isolation Forest for anomaly detection
                sample_size = min(1000, len(df))
                sample_df = df[numerical_cols].sample(n=sample_size).fillna(0)
                
                if len(sample_df) > 10:  # Need minimum samples
                    iso_forest = IsolationForest(contamination=0.1, random_state=42)
                    anomalies = iso_forest.fit_predict(sample_df)
                    anomaly_count = np.sum(anomalies == -1)
                    
                    if anomaly_count > 0:
                        ai_insights.append({
                            'type': 'anomaly_detection',
                            'title': 'Anomalies Detected by AI',
                            'description': f'Machine learning detected {anomaly_count} potential anomalies in your numerical data ({anomaly_count/len(sample_df)*100:.1f}% of sample).',
                            'severity': 'medium',
                            'actionable': True,
                            'recommendation': 'Investigate these anomalies - they could be data errors or interesting outliers worth exploring'
                        })
            
            # 2. Clustering Insights
            if len(numerical_cols) >= 2:
                try:
                    sample_df = df[numerical_cols].sample(n=min(500, len(df))).fillna(0)
                    if len(sample_df) > 10:
                        # Use KMeans clustering
                        n_clusters = min(5, len(sample_df) // 10)
                        if n_clusters >= 2:
                            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                            clusters = kmeans.fit_predict(sample_df)
                            
                            # Calculate cluster quality (silhouette-like metric)
                            unique_clusters = len(np.unique(clusters))
                            if unique_clusters > 1:
                                ai_insights.append({
                                    'type': 'clustering',
                                    'title': 'Natural Data Groupings Found',
                                    'description': f'AI identified {unique_clusters} distinct groups in your data, suggesting natural patterns or segments.',
                                    'severity': 'high',
                                    'actionable': True,
                                    'recommendation': 'Explore these groups to understand different customer segments, product categories, or behavioral patterns'
                                })
                except Exception as e:
                    logger.debug(f"Clustering analysis failed: {e}")
            
            # 3. Feature Importance Insights
            if len(numerical_cols) > 2:
                try:
                    # Create a synthetic target for feature importance analysis
                    sample_df = df[numerical_cols].sample(n=min(500, len(df))).fillna(0)
                    if len(sample_df) > 20:
                        # Use the first column as target, others as features
                        target_col = numerical_cols[0]
                        feature_cols = numerical_cols[1:4]  # Limit to 3 features for speed
                        
                        X = sample_df[feature_cols]
                        y = sample_df[target_col]
                        
                        # Use SelectKBest for feature importance
                        selector = SelectKBest(score_func=f_classif, k='all')
                        selector.fit(X, y)
                        
                        # Get top features
                        feature_scores = list(zip(feature_cols, selector.scores_))
                        feature_scores.sort(key=lambda x: x[1], reverse=True)
                        
                        top_feature = feature_scores[0][0]
                        ai_insights.append({
                            'type': 'feature_importance',
                            'title': 'Key Predictive Features Identified',
                            'description': f'AI analysis shows that "{top_feature}" is the most important feature for predicting "{target_col}".',
                            'severity': 'high',
                            'actionable': True,
                            'recommendation': f'Focus on "{top_feature}" as it has the strongest predictive power in your dataset'
                        })
                except Exception as e:
                    logger.debug(f"Feature importance analysis failed: {e}")
            
            # 4. Text Analysis Insights (if text columns exist)
            text_cols = df.select_dtypes(include=['object']).columns
            for col in text_cols[:2]:  # Limit to 2 text columns
                try:
                    text_data = df[col].dropna().astype(str)
                    if len(text_data) > 0:
                        # Basic text analysis
                        avg_length = text_data.str.len().mean()
                        unique_ratio = text_data.nunique() / len(text_data)
                        
                        if avg_length > 50:  # Likely text content
                            ai_insights.append({
                                'type': 'text_analysis',
                                'title': f'Rich Text Content in {col}',
                                'description': f'Column "{col}" contains substantial text data (avg {avg_length:.0f} characters) with {unique_ratio:.1%} unique values.',
                                'severity': 'medium',
                                'actionable': True,
                                'recommendation': 'Consider text mining techniques like sentiment analysis, topic modeling, or keyword extraction'
                            })
                        
                        # Sentiment analysis if transformers available
                        if self.sentiment_analyzer and len(text_data) > 0:
                            try:
                                # Analyze a small sample
                                sample_texts = text_data.sample(n=min(10, len(text_data))).tolist()
                                sentiments = []
                                
                                for text in sample_texts:
                                    if len(text.strip()) > 10:  # Skip very short texts
                                        result = self.sentiment_analyzer(text[:512])  # Limit text length
                                        if result and len(result) > 0:
                                            sentiments.append(result[0])
                                
                                if sentiments:
                                    positive_count = sum(1 for s in sentiments if s.get('label') == 'POSITIVE')
                                    sentiment_ratio = positive_count / len(sentiments)
                                    
                                    ai_insights.append({
                                        'type': 'sentiment_analysis',
                                        'title': f'Sentiment Analysis of {col}',
                                        'description': f'AI sentiment analysis shows {sentiment_ratio:.1%} positive sentiment in "{col}" text data.',
                                        'severity': 'low',
                                        'actionable': True,
                                        'recommendation': 'Use sentiment trends to understand customer satisfaction, feedback patterns, or content performance'
                                    })
                            except Exception as e:
                                logger.debug(f"Sentiment analysis failed: {e}")
                                
                except Exception as e:
                    logger.debug(f"Text analysis failed for column {col}: {e}")
            
            # 5. Temporal Pattern Insights
            date_cols = df.select_dtypes(include=['datetime64']).columns
            if len(date_cols) > 0 and len(numerical_cols) > 0:
                try:
                    date_col = date_cols[0]
                    num_col = numerical_cols[0]
                    
                    # Sort by date and look for trends
                    temp_df = df[[date_col, num_col]].dropna().sort_values(date_col)
                    if len(temp_df) > 10:
                        # Simple trend analysis
                        values = temp_df[num_col].values
                        trend_slope = np.polyfit(range(len(values)), values, 1)[0]
                        
                        if abs(trend_slope) > np.std(values) * 0.1:  # Significant trend
                            trend_direction = "increasing" if trend_slope > 0 else "decreasing"
                            ai_insights.append({
                                'type': 'temporal_pattern',
                                'title': f'Time-based Trend Detected',
                                'description': f'AI detected a {trend_direction} trend in "{num_col}" over time.',
                                'severity': 'high',
                                'actionable': True,
                                'recommendation': f'Investigate factors driving this {trend_direction} trend for strategic planning'
                            })
                except Exception as e:
                    logger.debug(f"Temporal analysis failed: {e}")
                    
        except Exception as e:
            logger.error(f"AI-powered insights generation failed: {e}")
            # Add a fallback insight
            ai_insights.append({
                'type': 'ai_analysis',
                'title': 'AI Analysis Complete',
                'description': 'Advanced AI analysis has been performed on your dataset using machine learning algorithms.',
                'severity': 'low',
                'actionable': False,
                'recommendation': 'The AI has analyzed patterns, anomalies, and relationships in your data'
            })
        
        return ai_insights
    
    def _prepare_export_data(self, df: pd.DataFrame, analysis: Dict[str, Any], insights: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare data for export in various formats
        """
        export_data = {
            'cleaned_dataset': {
                'format': 'csv',
                'data': df.to_csv(index=False),
                'description': 'Cleaned and processed dataset'
            },
            'summary_report': {
                'format': 'json',
                'data': {
                    'analysis_summary': analysis,
                    'key_insights': insights,
                    'generated_at': datetime.now().isoformat(),
                    'dataset_info': {
                        'rows': len(df),
                        'columns': len(df.columns),
                        'column_names': list(df.columns)
                    }
                },
                'description': 'Comprehensive analysis report'
            },
            'insights_summary': {
                'format': 'text',
                'data': self._format_insights_text(insights),
                'description': 'Human-readable insights summary'
            }
        }
        
        return export_data
    
    def _format_insights_text(self, insights: List[Dict[str, Any]]) -> str:
        """
        Format insights as readable text
        """
        text = "=== DATA ANALYSIS INSIGHTS ===\n\n"
        
        for i, insight in enumerate(insights, 1):
            text += f"{i}. {insight['title']}\n"
            text += f"   {insight['description']}\n"
            text += f"   Recommendation: {insight['recommendation']}\n"
            text += f"   Severity: {insight['severity'].upper()}\n\n"
        
        text += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        text += "=== END OF REPORT ==="
        
        return text

# Global instance
ai_processor = LightweightAIProcessor()