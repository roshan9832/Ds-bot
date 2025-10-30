export type Sender = 'user' | 'ai' | 'system';

export type ChartData = {
    type: 'bar' | 'line' | 'pie';
    data: Record<string, string | number>[];
    dataKey: string;
    categoryKey: string;
};

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  chartData?: ChartData;
}

export type ColumnInfo = {
  name: string;
  type: string;
  hasMissingValues: boolean;
};

export type ConversionStrategy = {
  targetType: string;
  onError: 'coerce' | 'remove' | '';
};

export type DataTool = 'missing-values' | 'convert-types' | 'outliers' | 'general';