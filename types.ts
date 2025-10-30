export type Sender = 'user' | 'ai' | 'system';

export type ChartData = {
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    data: Record<string, string | number>[];
    dataKey?: string;
    categoryKey?: string;
    xKey?: string;
    yKey?: string;
};

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  chartData?: ChartData;
}

export type NumericStats = {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
};

export type CategoricalStats = {
  valueCounts: Record<string, number>;
  uniqueValues: number;
};

export type ColumnInfo = {
  name:string;
  type: string;
  hasMissingValues: boolean;
  totalRows: number;
  missingCount: number;
  stats?: NumericStats | CategoricalStats;
};

export type ConversionStrategy = {
  targetType: string;
  onError: 'coerce' | 'remove' | '';
};

export type DataTool = 'missing-values' | 'convert-types' | 'outliers' | 'general';

export type ValidationIssue = {
  type: 'INCONSISTENT_ROW_LENGTH' | 'MIXED_DATA_TYPE';
  column?: string;
  row: number;
  value?: string;
  message: string;
};
