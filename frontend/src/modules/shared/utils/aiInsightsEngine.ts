/**
 * Client-side AI Insights Engine
 * Generates intelligent insights from data without API calls
 */

export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'boolean';
  values: any[];
  uniqueCount: number;
  nullCount: number;
  stats?: {
    mean?: number;
    median?: number;
    std?: number;
    min?: number;
    max?: number;
    q25?: number;
    q75?: number;
    skewness?: number;
    kurtosis?: number;
  };
}

export interface DataInsight {
  type: 'correlation' | 'distribution' | 'outlier' | 'trend' | 'quality' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendation: string;
  data?: any;
}

export interface VisualizationRecommendation {
  type: 'histogram' | 'scatter' | 'line' | 'bar' | 'heatmap' | 'boxplot' | 'donut';
  title: string;
  x_column: string;
  y_column?: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export class AIInsightsEngine {
  private data: any[];
  private columns: DataColumn[];
  
  constructor(data: any[]) {
    try {
      this.data = data || [];
      this.columns = this.analyzeColumns(this.data);
    } catch (error) {
      console.error('Error initializing AI Insights Engine:', error);
      this.data = [];
      this.columns = [];
    }
  }

  /**
   * Analyze data structure and types
   */
  private analyzeColumns(data: any[]): DataColumn[] {
    try {
      if (!data || data.length === 0) return [];
      
      const sampleSize = Math.min(1000, data.length);
      const sample = data.slice(0, sampleSize);
      if (sample.length === 0 || !sample[0]) return [];
      
      const columnNames = Object.keys(sample[0] || {});
      
      return columnNames.map(name => {
        const allValues = sample.map(row => row[name]);
        const values = allValues.filter(v => v != null && v !== '' && v !== undefined);
        const uniqueValues = Array.from(new Set(values));
        const nullCount = allValues.length - values.length;
        
        // Determine column type with better heuristics
        let type: DataColumn['type'] = 'categorical';
        
        if (values.length > 0) {
          // Check for numeric values (including strings that represent numbers)
          const numericValues = values.filter(v => {
            const num = Number(v);
            return !isNaN(num) && isFinite(num);
          });
          
          // Check for date values
          const dateValues = values.filter(v => {
            if (typeof v === 'string') {
              const date = new Date(v);
              return !isNaN(date.getTime()) && v.length > 4; // Avoid treating years as dates
            }
            return false;
          });
          
          // Check for boolean values
          const booleanValues = values.filter(v => 
            typeof v === 'boolean' || 
            (typeof v === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())) ||
            (typeof v === 'number' && (v === 0 || v === 1))
          );
          
          // Determine type based on majority
          const numericRatio = numericValues.length / values.length;
          const dateRatio = dateValues.length / values.length;
          const booleanRatio = booleanValues.length / values.length;
          
          if (numericRatio > 0.8) {
            type = 'numeric';
          } else if (dateRatio > 0.6) {
            type = 'datetime';
          } else if (booleanRatio > 0.8 || (uniqueValues.length <= 2 && booleanRatio > 0.5)) {
            type = 'boolean';
          } else {
            type = 'categorical';
          }
          
          // Special case: if it looks like an ID column (unique values close to row count)
          if (type === 'numeric' && uniqueValues.length / values.length > 0.95 && 
              (name.toLowerCase().includes('id') || name.toLowerCase() === 'index')) {
            type = 'categorical'; // Treat IDs as categorical for analysis purposes
          }
        }
        
        const column: DataColumn = {
          name,
          type,
          values,
          uniqueCount: uniqueValues.length,
          nullCount
        };
        
        // Calculate statistics for numeric columns
        if (type === 'numeric') {
          const numValues = values.map(v => Number(v)).filter(v => !isNaN(v));
          if (numValues.length > 0) {
            numValues.sort((a, b) => a - b);
            const mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
            
            // Proper median calculation
            let median;
            if (numValues.length % 2 === 0) {
              const mid1 = numValues[Math.floor(numValues.length / 2) - 1];
              const mid2 = numValues[Math.floor(numValues.length / 2)];
              median = (mid1 + mid2) / 2;
            } else {
              median = numValues[Math.floor(numValues.length / 2)];
            }
            
            const variance = numValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numValues.length;
            const std = Math.sqrt(variance);
            
            column.stats = {
              mean,
              median,
              std,
              min: numValues[0] || 0,
              max: numValues[numValues.length - 1] || 0,
              q25: numValues[Math.max(0, Math.floor(numValues.length * 0.25))] || 0,
              q75: numValues[Math.max(0, Math.floor(numValues.length * 0.75))] || 0,
              skewness: this.calculateSkewness(numValues, mean, std),
              kurtosis: this.calculateKurtosis(numValues, mean, std)
            };
          }
        }
        
        return column;
      });
    } catch (error) {
      console.error('Error analyzing columns:', error);
      return [];
    }
  }

  /**
   * Calculate skewness (measure of asymmetry)
   */
  private calculateSkewness(values: number[], mean: number, std: number): number {
    if (std === 0) return 0;
    const n = values.length;
    const skew = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
    return skew;
  }

  /**
   * Calculate kurtosis (measure of tail heaviness)
   */
  private calculateKurtosis(values: number[], mean: number, std: number): number {
    if (std === 0) return 0;
    const n = values.length;
    const kurt = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3;
    return kurt;
  }

  /**
   * Generate comprehensive insights
   */
  generateInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    
    try {
      // Data quality insights
      insights.push(...this.generateDataQualityInsights());
      
      // Distribution insights
      insights.push(...this.generateDistributionInsights());
      
      // Correlation insights
      insights.push(...this.generateCorrelationInsights());
      
      // Outlier insights
      insights.push(...this.generateOutlierInsights());
      
      // Pattern insights
      insights.push(...this.generatePatternInsights());
      
      // Recommendation insights
      insights.push(...this.generateRecommendationInsights());
      
      // Sort by importance (severity + confidence)
      return insights
        .sort((a, b) => {
          const scoreA = (a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1) * a.confidence;
          const scoreB = (b.severity === 'high' ? 3 : b.severity === 'medium' ? 2 : 1) * b.confidence;
          return scoreB - scoreA;
        })
        .slice(0, 10); // Top 10 insights
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Generate data quality insights
   */
  private generateDataQualityInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    const totalRows = this.data.length;
    
    // Overall completeness
    const totalCells = totalRows * this.columns.length;
    const totalNulls = this.columns.reduce((sum, col) => sum + col.nullCount, 0);
    const completeness = ((totalCells - totalNulls) / totalCells) * 100;
    
    if (completeness < 90) {
      insights.push({
        type: 'quality',
        title: 'Data Completeness Issue',
        description: `Dataset is ${completeness.toFixed(1)}% complete. ${totalNulls} missing values found across ${this.columns.length} columns.`,
        severity: completeness < 70 ? 'high' : 'medium',
        confidence: 0.95,
        actionable: true,
        recommendation: 'Consider data imputation strategies or investigate data collection process.'
      });
    } else {
      insights.push({
        type: 'quality',
        title: 'Excellent Data Quality',
        description: `Dataset shows excellent completeness at ${completeness.toFixed(1)}% with minimal missing values.`,
        severity: 'low',
        confidence: 0.9,
        actionable: false,
        recommendation: 'Data is ready for analysis. Continue with current data collection practices.'
      });
    }
    
    return insights;
  }

  /**
   * Generate distribution insights
   */
  private generateDistributionInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    
    this.columns.filter(col => col.type === 'numeric' && col.stats).forEach(col => {
      const stats = col.stats!;
      
      // Skewness analysis
      if (Math.abs(stats.skewness!) > 1) {
        const direction = stats.skewness! > 0 ? 'right' : 'left';
        insights.push({
          type: 'distribution',
          title: `${col.name} is ${direction.charAt(0).toUpperCase() + direction.slice(1)}-Skewed`,
          description: `${col.name} shows ${direction}-skewed distribution (skewness: ${stats.skewness!.toFixed(2)}).`,
          severity: Math.abs(stats.skewness!) > 2 ? 'medium' : 'low',
          confidence: 0.85,
          actionable: true,
          recommendation: `Consider ${direction === 'right' ? 'log transformation' : 'square transformation'} or investigate outliers.`
        });
      }
    });
    
    return insights;
  }

  /**
   * Generate correlation insights
   */
  private generateCorrelationInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    const numericColumns = this.columns.filter(col => col.type === 'numeric' && col.stats);
    
    if (numericColumns.length < 2) return insights;
    
    // Calculate correlations between numeric columns
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const correlation = this.calculateCorrelation(col1.values, col2.values);
        
        if (Math.abs(correlation) > 0.7) {
          const strength = Math.abs(correlation) > 0.9 ? 'very strong' : 'strong';
          const direction = correlation > 0 ? 'positive' : 'negative';
          
          insights.push({
            type: 'correlation',
            title: `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} correlation`,
            description: `${col1.name} and ${col2.name} show a ${strength} ${direction} correlation (r=${correlation.toFixed(3)}).`,
            severity: Math.abs(correlation) > 0.9 ? 'high' : 'medium',
            confidence: 0.9,
            actionable: true,
            recommendation: 'Investigate this relationship for business insights or consider feature engineering.',
            data: { correlation, col1: col1.name, col2: col2.name }
          });
        }
      }
    }
    
    return insights;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(values1: any[], values2: any[]): number {
    try {
      const pairs = values1.map((v1, i) => [Number(v1), Number(values2[i])])
        .filter(([v1, v2]) => !isNaN(v1) && !isNaN(v2));
      
      if (pairs.length < 2) return 0;
      
      const n = pairs.length;
      const sum1 = pairs.reduce((sum, [v1]) => sum + v1, 0);
      const sum2 = pairs.reduce((sum, [, v2]) => sum + v2, 0);
      const sum1Sq = pairs.reduce((sum, [v1]) => sum + v1 * v1, 0);
      const sum2Sq = pairs.reduce((sum, [, v2]) => sum + v2 * v2, 0);
      const sum12 = pairs.reduce((sum, [v1, v2]) => sum + v1 * v2, 0);
      
      const numerator = n * sum12 - sum1 * sum2;
      const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
      
      return denominator === 0 ? 0 : numerator / denominator;
    } catch (error) {
      console.warn('Error calculating correlation:', error);
      return 0;
    }
  }

  /**
   * Generate outlier insights
   */
  private generateOutlierInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    
    this.columns.filter(col => col.type === 'numeric' && col.stats).forEach(col => {
      if (!col.stats) return;
      
      // IQR-based outlier detection
      if (col.stats.q25 !== undefined && col.stats.q75 !== undefined) {
        const iqr = col.stats.q75 - col.stats.q25;
        const lowerBound = col.stats.q25 - 1.5 * iqr;
        const upperBound = col.stats.q75 + 1.5 * iqr;
        const outliers = col.values.filter(v => Number(v) < lowerBound || Number(v) > upperBound);
        
        if (outliers.length > 0) {
          const outlierPercentage = (outliers.length / col.values.length) * 100;
          insights.push({
            type: 'outlier',
            title: `Outliers Detected in ${col.name}`,
            description: `Found ${outliers.length} outliers (${outlierPercentage.toFixed(1)}%) in ${col.name}.`,
            severity: outlierPercentage > 5 ? 'high' : 'medium',
            confidence: 0.9,
            actionable: true,
            recommendation: 'Investigate outliers for data entry errors or consider robust statistical methods.',
            data: { outlierCount: outliers.length, percentage: outlierPercentage }
          });
        }
      }
    });
    
    return insights;
  }

  /**
   * Generate pattern insights
   */
  private generatePatternInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    
    // Categorical distribution patterns
    this.columns.filter(col => col.type === 'categorical').forEach(col => {
      const valueCounts = col.values.reduce((counts, val) => {
        counts[val] = (counts[val] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const sortedCounts = Object.entries(valueCounts).sort(([,a], [,b]) => (b as number) - (a as number));
      const topValue = sortedCounts[0];
      const dominanceRatio = (topValue[1] as number) / col.values.length;
      
      if (dominanceRatio > 0.8) {
        insights.push({
          type: 'pattern',
          title: `Dominant Category in ${col.name}`,
          description: `${col.name} is dominated by '${topValue[0] as string}' (${(dominanceRatio * 100).toFixed(1)}% of values).`,
          severity: 'medium',
          confidence: 0.9,
          actionable: true,
          recommendation: 'Consider if this imbalance affects your analysis or if stratified sampling is needed.'
        });
      }
    });
    
    return insights;
  }

  /**
   * Generate recommendation insights
   */
  private generateRecommendationInsights(): DataInsight[] {
    const insights: DataInsight[] = [];
    const totalRows = this.data.length;
    
    // Sample size recommendations
    if (totalRows < 100) {
      insights.push({
        type: 'recommendation',
        title: 'Small Sample Size',
        description: `Dataset has only ${totalRows} rows. Statistical conclusions may be limited with small sample sizes.`,
        severity: 'medium',
        confidence: 0.8,
        actionable: true,
        recommendation: 'Consider collecting more data for robust statistical analysis.'
      });
    }
    
    return insights;
  }

  /**
   * Generate visualization recommendations based on actual data analysis
   */
  generateVisualizationRecommendations(): VisualizationRecommendation[] {
    const recommendations: VisualizationRecommendation[] = [];
    
    try {
      const numericCols = this.columns.filter(col => col.type === 'numeric');
      const categoricalCols = this.columns.filter(col => col.type === 'categorical');
      
      // Filter out ID-like columns for meaningful analysis
      const meaningfulNumericCols = numericCols.filter(col => 
        !col.name.toLowerCase().includes('id') && 
        col.uniqueCount > 5 &&
        col.uniqueCount / this.data.length < 0.95
      );
      
      const meaningfulCategoricalCols = categoricalCols.filter(col => 
        col.uniqueCount >= 2 && col.uniqueCount <= 20
      );
      
      // Best numeric distributions
      meaningfulNumericCols.slice(0, 3).forEach(col => {
        recommendations.push({
          type: 'histogram',
          title: `${col.name} Distribution Analysis`,
          x_column: col.name,
          description: `Analyze the distribution pattern of ${col.name}`,
          priority: 'medium',
          confidence: 0.8
        });
      });
      
      // Best categorical breakdowns
      meaningfulCategoricalCols.slice(0, 2).forEach(col => {
        recommendations.push({
          type: 'bar',
          title: `${col.name} Category Breakdown`,
          x_column: col.name,
          description: `Show the distribution of ${col.name} categories`,
          priority: 'medium',
          confidence: 0.8
        });
      });
      
      // Cross-analysis: categorical vs numeric
      if (meaningfulCategoricalCols.length > 0 && meaningfulNumericCols.length > 0) {
        const catCol = meaningfulCategoricalCols[0];
        const numCol = meaningfulNumericCols[0];
        
        if (catCol.uniqueCount <= 8) {
          recommendations.push({
            type: 'boxplot',
            title: `${numCol.name} Distribution by ${catCol.name}`,
            x_column: catCol.name,
            y_column: numCol.name,
            description: `Compare how ${numCol.name} varies across different ${catCol.name} categories.`,
            priority: 'high',
            confidence: 0.85
          });
        }
      }
      
      // Correlation analysis
      if (meaningfulNumericCols.length >= 2) {
        const col1 = meaningfulNumericCols[0];
        const col2 = meaningfulNumericCols[1];
        
        recommendations.push({
          type: 'scatter',
          title: `${col1.name} vs ${col2.name}`,
          x_column: col1.name,
          y_column: col2.name,
          description: `Explore the relationship between ${col1.name} and ${col2.name}`,
          priority: 'high',
          confidence: 0.9
        });
      }
      
      return recommendations
        .sort((a, b) => {
          const scoreA = (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1) * a.confidence;
          const scoreB = (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) * b.confidence;
          return scoreB - scoreA;
        })
        .slice(0, 6); // Limit to top 6 recommendations
    } catch (error) {
      console.error('Error generating visualization recommendations:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive statistical summary paragraph
   */
  generateStatisticalSummary(): string {
    try {
      if (!this.data || !this.columns) {
        return 'Statistical analysis could not be performed due to data initialization issues.';
      }

      const numericCols = this.columns.filter(col => col && col.type === 'numeric' && col.stats);
      const categoricalCols = this.columns.filter(col => col && col.type === 'categorical');
      const totalRows = this.data.length;
      
      if (numericCols.length === 0) {
        return `This dataset contains ${totalRows.toLocaleString()} records with ${this.columns.length} columns, but no numerical variables for statistical analysis. Consider feature engineering to create numerical variables for deeper statistical insights.`;
      }

      let summary = `Statistical Analysis Summary: This dataset comprises ${totalRows.toLocaleString()} observations across ${this.columns.length} variables, with ${numericCols.length} numerical and ${categoricalCols.length} categorical features.\n\n`;
      
      summary += `Key Variables Analysis:\n`;
      numericCols.forEach(col => {
        try {
          if (col && col.stats && col.name) {
            const stats = col.stats;
            const mean = (typeof stats.mean === 'number' && !isNaN(stats.mean)) ? stats.mean.toFixed(2) : 'N/A';
            const median = (typeof stats.median === 'number' && !isNaN(stats.median)) ? stats.median.toFixed(2) : 'N/A';
            const std = (typeof stats.std === 'number' && !isNaN(stats.std)) ? stats.std.toFixed(2) : 'N/A';
            const min = (typeof stats.min === 'number' && !isNaN(stats.min)) ? stats.min.toFixed(2) : 'N/A';
            const max = (typeof stats.max === 'number' && !isNaN(stats.max)) ? stats.max.toFixed(2) : 'N/A';
            
            summary += `• ${col.name}: mean ${mean}, median ${median}, std ${std}, range ${min} to ${max}\n`;
          }
        } catch (colError) {
          console.warn('Error processing column:', col?.name, colError);
        }
      });
      
      // Add basic data quality info
      summary += `\nData Quality: Dataset appears to be ${totalRows > 100 ? 'substantial' : 'small'} with ${this.columns.length} variables analyzed.\n`;
      
      return summary;
    } catch (error) {
      console.error('Error generating statistical summary:', error);
      return `Statistical Analysis Summary: This dataset contains ${this.data.length.toLocaleString()} observations across ${this.columns.length} variables. A detailed statistical analysis could not be completed due to data processing issues. Please check the data format and try again.`;
    }
  }

  /**
   * Get basic statistics summary
   */
  getBasicStats() {
    const numericCols = this.columns.filter(col => col.type === 'numeric');
    const categoricalCols = this.columns.filter(col => col.type === 'categorical');
    
    return {
      total_rows: this.data.length,
      total_columns: this.columns.length,
      numerical_columns: numericCols.length,
      categorical_columns: categoricalCols.length,
      memory_usage_mb: (JSON.stringify(this.data).length / 1024 / 1024),
      completeness: this.calculateCompleteness(),
      uniqueness: this.calculateUniqueness(),
      consistency: 95.0, // Simplified for now
      statistical_summary: this.generateStatisticalSummary()
    };
  }

  private calculateCompleteness(): number {
    const totalCells = this.data.length * this.columns.length;
    const totalNulls = this.columns.reduce((sum, col) => sum + col.nullCount, 0);
    return ((totalCells - totalNulls) / totalCells) * 100;
  }

  private calculateUniqueness(): number {
    const totalValues = this.columns.reduce((sum, col) => sum + col.values.length, 0);
    const totalUnique = this.columns.reduce((sum, col) => sum + col.uniqueCount, 0);
    return (totalUnique / totalValues) * 100;
  }
}