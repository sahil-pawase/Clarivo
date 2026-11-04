# HOW ALGORITHMS WORK - Clarivo Algorithmic Implementation & Data Science

## 🧠 **Algorithm Overview & Philosophy**

Clarivo implements a **multi-layered algorithmic approach** combining traditional data science techniques with modern AI capabilities. The system processes data through several algorithmic stages, each optimized for specific analytical tasks.

---

## 📊 **Data Processing Algorithms**

### **1. File Parsing & Data Ingestion**

#### **CSV Processing Algorithm**
```python
def process_csv_file(file_path: str) -> pd.DataFrame:
    """
    Algorithm: Intelligent CSV parsing with automatic type detection
    Complexity: O(n) where n = number of rows
    """
    # Step 1: Read file with pandas
    df = pd.read_csv(file_path)
    
    # Step 2: Automatic data type inference
    for column in df.columns:
        # Try to convert to numeric types first
        if df[column].dtype == 'object':
            # Attempt numeric conversion
            numeric_conversion = pd.to_numeric(df[column], errors='coerce')
            if not numeric_conversion.isna().all():
                df[column] = numeric_conversion
            # Attempt datetime conversion
            elif pd.to_datetime(df[column], errors='coerce').notna().sum() > len(df) * 0.5:
                df[column] = pd.to_datetime(df[column], errors='coerce')
    
    # Step 3: Handle missing values
    df = handle_missing_values(df)
    
    return df
```

**Algorithm Features:**
- **Type Inference**: Automatic detection of numeric, datetime, and categorical data
- **Missing Value Handling**: Intelligent imputation strategies
- **Memory Optimization**: Efficient data type selection
- **Error Recovery**: Graceful handling of malformed data

#### **Excel Processing Algorithm**
```python
def process_excel_file(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    Algorithm: Multi-sheet Excel processing with sheet selection
    Complexity: O(s * n) where s = sheets, n = total rows
    """
    # Step 1: Read all sheets
    excel_file = pd.ExcelFile(file_path)
    sheets = {}
    
    # Step 2: Process each sheet
    for sheet_name in excel_file.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        if not df.empty:
            sheets[sheet_name] = process_dataframe(df)
    
    # Step 3: Select primary sheet (largest or user-specified)
    primary_sheet = select_primary_sheet(sheets)
    
    return {
        'primary': sheets[primary_sheet],
        'all_sheets': sheets
    }
```

### **2. Data Cleaning & Preprocessing**

#### **Missing Value Detection Algorithm**
```python
def detect_missing_patterns(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Algorithm: Pattern-based missing value analysis
    Complexity: O(n * m) where n = rows, m = columns
    """
    missing_analysis = {}
    
    for column in df.columns:
        missing_count = df[column].isna().sum()
        missing_percentage = (missing_count / len(df)) * 100
        
        # Pattern detection
        if missing_percentage > 0:
            # Check for systematic patterns
            pattern_type = analyze_missing_pattern(df[column])
            
            missing_analysis[column] = {
                'count': missing_count,
                'percentage': missing_percentage,
                'pattern': pattern_type,
                'recommendation': suggest_imputation_strategy(pattern_type, missing_percentage)
            }
    
    return missing_analysis

def analyze_missing_pattern(series: pd.Series) -> str:
    """
    Algorithm: Missing value pattern classification
    """
    missing_indices = series.isna()
    
    if missing_indices.sum() == 0:
        return "no_missing"
    
    # Check for random missing (MCAR)
    if is_random_missing(missing_indices):
        return "random_missing"
    
    # Check for systematic missing (MNAR)
    elif is_systematic_missing(series, missing_indices):
        return "systematic_missing"
    
    # Check for missing at random (MAR)
    else:
        return "missing_at_random"
```

#### **Outlier Detection Algorithm**
```python
def detect_outliers_iqr(df: pd.DataFrame, column: str, factor: float = 1.5) -> List[int]:
    """
    Algorithm: Interquartile Range (IQR) outlier detection
    Complexity: O(n log n) due to sorting
    """
    values = df[column].dropna()
    
    if len(values) < 4:
        return []
    
    # Calculate quartiles
    q1 = values.quantile(0.25)
    q3 = values.quantile(0.75)
    iqr = q3 - q1
    
    # Define bounds
    lower_bound = q1 - (factor * iqr)
    upper_bound = q3 + (factor * iqr)
    
    # Find outlier indices
    outlier_indices = df[
        (df[column] < lower_bound) | (df[column] > upper_bound)
    ].index.tolist()
    
    return outlier_indices

def detect_outliers_zscore(df: pd.DataFrame, column: str, threshold: float = 3.0) -> List[int]:
    """
    Algorithm: Z-score based outlier detection
    Complexity: O(n)
    """
    values = df[column].dropna()
    
    if len(values) < 2:
        return []
    
    # Calculate z-scores
    mean_val = values.mean()
    std_val = values.std()
    
    if std_val == 0:
        return []
    
    z_scores = np.abs((values - mean_val) / std_val)
    
    # Find outliers
    outlier_indices = df[column][z_scores > threshold].index.tolist()
    
    return outlier_indices
```

---

## 🤖 **AI & Machine Learning Algorithms**

### **1. Gemini AI Integration Algorithm**

#### **Natural Language Query Processing**
```python
def process_natural_language_query(df: pd.DataFrame, query: str, dataset_name: str) -> str:
    """
    Algorithm: Context-aware AI query processing
    Complexity: O(1) for API call, O(n) for context preparation
    """
    # Step 1: Prepare dataset context
    context = prepare_dataset_context(df, dataset_name)
    
    # Step 2: Construct intelligent prompt
    prompt = construct_ai_prompt(query, context)
    
    # Step 3: Generate AI response
    response = generate_ai_response(prompt)
    
    # Step 4: Post-process and validate
    processed_response = post_process_response(response, df)
    
    return processed_response

def prepare_dataset_context(df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
    """
    Algorithm: Intelligent context preparation for AI
    """
    context = {
        'dataset_name': dataset_name,
        'shape': df.shape,
        'columns': list(df.columns),
        'column_types': df.dtypes.to_dict(),
        'numeric_columns': df.select_dtypes(include=['number']).columns.tolist(),
        'categorical_columns': df.select_dtypes(include=['object']).columns.tolist(),
        'datetime_columns': df.select_dtypes(include=['datetime']).columns.tolist(),
        'sample_data': df.head(3).to_dict('records'),
        'statistical_summary': generate_statistical_summary(df),
        'data_quality_metrics': calculate_data_quality_metrics(df)
    }
    
    return context

def construct_ai_prompt(query: str, context: Dict[str, Any]) -> str:
    """
    Algorithm: Dynamic prompt construction based on query type
    """
    # Analyze query intent
    intent = analyze_query_intent(query)
    
    # Select appropriate prompt template
    if intent == 'statistical_analysis':
        template = STATISTICAL_ANALYSIS_TEMPLATE
    elif intent == 'data_quality':
        template = DATA_QUALITY_TEMPLATE
    elif intent == 'visualization':
        template = VISUALIZATION_TEMPLATE
    else:
        template = GENERAL_ANALYSIS_TEMPLATE
    
    # Fill template with context
    prompt = template.format(
        query=query,
        dataset_info=format_dataset_info(context),
        sample_data=format_sample_data(context['sample_data']),
        statistics=format_statistics(context['statistical_summary'])
    )
    
    return prompt
```

#### **Dataset Analysis Algorithm**
```python
def analyze_dataset_ai(df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
    """
    Algorithm: Comprehensive AI-powered dataset analysis
    """
    # Step 1: Generate comprehensive prompt
    analysis_prompt = generate_analysis_prompt(df, dataset_name)
    
    # Step 2: Get AI analysis
    ai_response = await get_ai_analysis(analysis_prompt)
    
    # Step 3: Extract structured insights
    insights = extract_structured_insights(ai_response)
    
    # Step 4: Generate recommendations
    recommendations = generate_ai_recommendations(df, insights)
    
    return {
        'analysis': ai_response,
        'insights': insights,
        'recommendations': recommendations,
        'data_quality_score': calculate_data_quality_score(df),
        'complexity_assessment': assess_dataset_complexity(df)
    }
```

### **2. Statistical Analysis Algorithms**

#### **Descriptive Statistics Engine**
```python
def calculate_comprehensive_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Algorithm: Multi-dimensional statistical analysis
    Complexity: O(n * m) where n = rows, m = columns
    """
    stats = {}
    
    # Numeric columns
    numeric_columns = df.select_dtypes(include=['number']).columns
    for col in numeric_columns:
        series = df[col].dropna()
        if len(series) > 0:
            stats[col] = {
                'count': len(series),
                'mean': series.mean(),
                'median': series.median(),
                'std': series.std(),
                'min': series.min(),
                'max': series.max(),
                'q25': series.quantile(0.25),
                'q75': series.quantile(0.75),
                'skewness': series.skew(),
                'kurtosis': series.kurtosis(),
                'missing_count': df[col].isna().sum(),
                'missing_percentage': (df[col].isna().sum() / len(df)) * 100
            }
    
    # Categorical columns
    categorical_columns = df.select_dtypes(include=['object']).columns
    for col in categorical_columns:
        value_counts = df[col].value_counts()
        stats[col] = {
            'unique_count': value_counts.nunique(),
            'most_common': value_counts.head(5).to_dict(),
            'missing_count': df[col].isna().sum(),
            'missing_percentage': (df[col].isna().sum() / len(df)) * 100,
            'entropy': calculate_categorical_entropy(value_counts)
        }
    
    return stats

def calculate_categorical_entropy(value_counts: pd.Series) -> float:
    """
    Algorithm: Shannon entropy calculation for categorical data
    Complexity: O(k) where k = unique values
    """
    total = value_counts.sum()
    probabilities = value_counts / total
    
    # Calculate entropy: H = -Σ(p * log2(p))
    entropy = -np.sum(probabilities * np.log2(probabilities))
    
    return entropy
```

#### **Correlation Analysis Algorithm**
```python
def calculate_correlation_matrix(df: pd.DataFrame, method: str = 'pearson') -> pd.DataFrame:
    """
    Algorithm: Multi-method correlation analysis
    Complexity: O(n * m²) where n = rows, m = columns
    """
    # Select only numeric columns
    numeric_df = df.select_dtypes(include=['number'])
    
    if numeric_df.empty:
        return pd.DataFrame()
    
    # Calculate correlation matrix
    if method == 'pearson':
        corr_matrix = numeric_df.corr(method='pearson')
    elif method == 'spearman':
        corr_matrix = numeric_df.corr(method='spearman')
    elif method == 'kendall':
        corr_matrix = numeric_df.corr(method='kendall')
    else:
        raise ValueError(f"Unsupported correlation method: {method}")
    
    # Handle NaN values (perfect correlation with self)
    corr_matrix = corr_matrix.fillna(1.0)
    
    return corr_matrix

def find_strong_correlations(corr_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict]:
    """
    Algorithm: Strong correlation pair detection
    Complexity: O(m²) where m = columns
    """
    strong_correlations = []
    
    # Get upper triangle of correlation matrix
    upper_triangle = np.triu(corr_matrix.values, k=1)
    
    # Find indices where correlation exceeds threshold
    high_corr_indices = np.where(np.abs(upper_triangle) > threshold)
    
    for i, j in zip(*high_corr_indices):
        correlation_value = upper_triangle[i, j]
        col1 = corr_matrix.columns[i]
        col2 = corr_matrix.columns[j]
        
        strong_correlations.append({
            'column1': col1,
            'column2': col2,
            'correlation': correlation_value,
            'strength': 'strong' if abs(correlation_value) > 0.8 else 'moderate'
        })
    
    # Sort by absolute correlation value
    strong_correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    return strong_correlations
```

---

## 📈 **Chart Generation Algorithms**

### **1. Automatic Chart Type Selection**

#### **Chart Type Recommendation Algorithm**
```python
def recommend_chart_type(df: pd.DataFrame, columns: List[str]) -> str:
    """
    Algorithm: Intelligent chart type selection based on data characteristics
    Complexity: O(n * m) where n = rows, m = selected columns
    """
    if not columns:
        return 'error'
    
    # Analyze data types and characteristics
    data_analysis = analyze_columns_for_charting(df, columns)
    
    # Apply decision tree logic
    if data_analysis['has_time_series']:
        return 'line_chart'
    elif data_analysis['is_categorical_comparison']:
        return 'bar_chart'
    elif data_analysis['is_distribution']:
        return 'histogram'
    elif data_analysis['is_correlation']:
        return 'scatter_plot'
    elif data_analysis['is_composition']:
        return 'pie_chart'
    else:
        return 'table'

def analyze_columns_for_charting(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Algorithm: Data characteristic analysis for chart selection
    """
    analysis = {
        'has_time_series': False,
        'is_categorical_comparison': False,
        'is_distribution': False,
        'is_correlation': False,
        'is_composition': False
    }
    
    if len(columns) == 1:
        col = columns[0]
        series = df[col].dropna()
        
        # Check for time series
        if pd.api.types.is_datetime64_any_dtype(series):
            analysis['has_time_series'] = True
        
        # Check for distribution
        elif pd.api.types.is_numeric_dtype(series):
            analysis['is_distribution'] = True
    
    elif len(columns) == 2:
        col1, col2 = columns[0], columns[1]
        
        # Check for correlation
        if (pd.api.types.is_numeric_dtype(df[col1]) and 
            pd.api.types.is_numeric_dtype(df[col2])):
            analysis['is_correlation'] = True
        
        # Check for categorical comparison
        elif (pd.api.types.is_object_dtype(df[col1]) and 
              pd.api.types.is_numeric_dtype(df[col2])):
            analysis['is_categorical_comparison'] = True
    
    return analysis
```

### **2. Chart Configuration Generation**

#### **Dynamic Chart Configuration Algorithm**
```python
def generate_chart_config(df: pd.DataFrame, chart_type: str, columns: List[str]) -> Dict[str, Any]:
    """
    Algorithm: Dynamic chart configuration generation
    Complexity: O(n) where n = rows
    """
    if chart_type == 'histogram':
        return generate_histogram_config(df, columns[0])
    elif chart_type == 'scatter_plot':
        return generate_scatter_config(df, columns[0], columns[1])
    elif chart_type == 'bar_chart':
        return generate_bar_config(df, columns[0], columns[1])
    elif chart_type == 'line_chart':
        return generate_line_config(df, columns[0], columns[1])
    else:
        return generate_default_config(df, columns)

def generate_histogram_config(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """
    Algorithm: Histogram configuration with optimal bin selection
    """
    series = df[column].dropna()
    
    # Sturges' formula for optimal bin count
    n_bins = int(np.ceil(1 + 3.322 * np.log10(len(series))))
    
    # Calculate bin edges
    bin_edges = np.linspace(series.min(), series.max(), n_bins + 1)
    
    return {
        'type': 'histogram',
        'x': series.tolist(),
        'nbinsx': n_bins,
        'xbins': {
            'start': series.min(),
            'end': series.max(),
            'size': (series.max() - series.min()) / n_bins
        },
        'opacity': 0.7,
        'marker': {
            'color': 'rgb(55, 83, 109)',
            'line': {'color': 'white', 'width': 1}
        }
    }
```

---

## 🔍 **Data Quality & Validation Algorithms**

### **1. Data Quality Assessment**

#### **Comprehensive Quality Scoring Algorithm**
```python
def calculate_data_quality_score(df: pd.DataFrame) -> Dict[str, float]:
    """
    Algorithm: Multi-dimensional data quality assessment
    Complexity: O(n * m) where n = rows, m = columns
    """
    quality_metrics = {}
    
    # Completeness score
    completeness = calculate_completeness_score(df)
    
    # Consistency score
    consistency = calculate_consistency_score(df)
    
    # Accuracy score
    accuracy = calculate_accuracy_score(df)
    
    # Validity score
    validity = calculate_validity_score(df)
    
    # Overall weighted score
    overall_score = (
        completeness * 0.3 +
        consistency * 0.25 +
        accuracy * 0.25 +
        validity * 0.2
    )
    
    return {
        'overall': overall_score,
        'completeness': completeness,
        'consistency': consistency,
        'accuracy': accuracy,
        'validity': validity
    }

def calculate_completeness_score(df: pd.DataFrame) -> float:
    """
    Algorithm: Data completeness calculation
    """
    total_cells = df.size
    missing_cells = df.isna().sum().sum()
    
    completeness = (total_cells - missing_cells) / total_cells
    return completeness

def calculate_consistency_score(df: pd.DataFrame) -> float:
    """
    Algorithm: Data consistency assessment
    """
    consistency_scores = []
    
    for column in df.columns:
        if df[column].dtype == 'object':
            # Check for consistent formatting in categorical data
            consistency_scores.append(assess_categorical_consistency(df[column]))
        elif pd.api.types.is_numeric_dtype(df[column]):
            # Check for numeric consistency
            consistency_scores.append(assess_numeric_consistency(df[column]))
    
    return np.mean(consistency_scores) if consistency_scores else 1.0
```

### **2. Anomaly Detection**

#### **Multi-Method Anomaly Detection Algorithm**
```python
def detect_anomalies_comprehensive(df: pd.DataFrame, column: str) -> Dict[str, List[int]]:
    """
    Algorithm: Multi-method anomaly detection
    Complexity: O(n log n) due to sorting
    """
    anomalies = {}
    
    # IQR method
    anomalies['iqr'] = detect_outliers_iqr(df, column)
    
    # Z-score method
    anomalies['zscore'] = detect_outliers_zscore(df, column)
    
    # Isolation Forest (if available)
    try:
        anomalies['isolation_forest'] = detect_outliers_isolation_forest(df, column)
    except:
        anomalies['isolation_forest'] = []
    
    # Combine results
    all_anomalies = set()
    for method_anomalies in anomalies.values():
        all_anomalies.update(method_anomalies)
    
    anomalies['combined'] = list(all_anomalies)
    
    return anomalies
```

---

## ⚡ **Performance Optimization Algorithms**

### **1. Memory Management**

#### **Efficient Data Type Selection Algorithm**
```python
def optimize_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Algorithm: Memory-efficient data type optimization
    Complexity: O(n * m) where n = rows, m = columns
    """
    optimized_df = df.copy()
    
    for column in df.columns:
        if df[column].dtype == 'object':
            # Try to convert to category if low cardinality
            unique_ratio = df[column].nunique() / len(df[column])
            if unique_ratio < 0.5:
                optimized_df[column] = df[column].astype('category')
        
        elif df[column].dtype == 'int64':
            # Downcast integers
            optimized_df[column] = pd.to_numeric(df[column], downcast='integer')
        
        elif df[column].dtype == 'float64':
            # Downcast floats
            optimized_df[column] = pd.to_numeric(df[column], downcast='float')
    
    return optimized_df
```

### **2. Caching Strategy**

#### **Intelligent Caching Algorithm**
```python
class DatasetCache:
    """
    Algorithm: LRU cache with intelligent eviction
    """
    def __init__(self, max_size: int = 10):
        self.max_size = max_size
        self.cache = {}
        self.access_order = []
    
    def get(self, key: str) -> Optional[pd.DataFrame]:
        if key in self.cache:
            # Update access order
            self.access_order.remove(key)
            self.access_order.append(key)
            return self.cache[key]
        return None
    
    def put(self, key: str, value: pd.DataFrame):
        if key in self.cache:
            # Update existing
            self.access_order.remove(key)
        elif len(self.cache) >= self.max_size:
            # Evict least recently used
            lru_key = self.access_order.pop(0)
            del self.cache[lru_key]
        
        self.cache[key] = value
        self.access_order.append(key)
```

---

## 🔬 **Algorithm Complexity Analysis**

### **Time Complexity Summary**
```
Operation                    | Best Case | Average Case | Worst Case
----------------------------|-----------|--------------|------------
File Upload & Parsing       | O(n)      | O(n)         | O(n)
Data Cleaning               | O(n*m)    | O(n*m)       | O(n*m)
Statistical Analysis        | O(n*m)    | O(n*m)       | O(n*m)
Outlier Detection (IQR)     | O(n log n)| O(n log n)   | O(n log n)
Correlation Analysis        | O(n*m²)   | O(n*m²)      | O(n*m²)
Chart Generation            | O(n)      | O(n)         | O(n)
AI Analysis                 | O(1)      | O(1)         | O(1)
Data Quality Assessment     | O(n*m)    | O(n*m)       | O(n*m)
```

### **Space Complexity Summary**
```
Operation                    | Space Complexity
----------------------------|------------------
Data Storage                | O(n*m)
Statistical Calculations    | O(m²)
Chart Configurations        | O(1)
AI Context Preparation      | O(n*m)
Cache Management            | O(c) where c = cache size
```

---

## 🚀 **Algorithm Optimization Strategies**

### **1. Parallel Processing**
- **Multi-threading**: File processing and statistical calculations
- **Vectorization**: NumPy operations for bulk data processing
- **Chunking**: Large dataset processing in manageable chunks

### **2. Memory Efficiency**
- **Lazy Loading**: Load data on-demand
- **Data Type Optimization**: Use smallest possible data types
- **Garbage Collection**: Regular cleanup of temporary objects

### **3. Caching Strategies**
- **Result Caching**: Store computed statistics
- **Chart Caching**: Cache generated chart configurations
- **AI Response Caching**: Cache common AI queries

These algorithms provide a robust foundation for data analysis, combining traditional statistical methods with modern AI capabilities while maintaining optimal performance and accuracy.
