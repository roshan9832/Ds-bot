import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { QuickActions } from './components/QuickActions';
import { DataStudioPanel } from './components/DataStudioPanel';
import { analyzeDataWithGemini } from './services/geminiService';
import { Message, ChartData, ColumnInfo, ConversionStrategy } from './types';
import { CsvIcon } from './components/icons';

/**
 * Infers the data type of a single string value.
 * @param value The string value to analyze.
 * @returns The inferred data type: 'Numeric', 'Boolean', or 'String'.
 */
const inferDataType = (value: string): 'Numeric' | 'Boolean' | 'String' => {
  if (value === null || value === undefined || value.trim() === '') return 'String';
  if (['true', 'false', 'yes', 'no', '0', '1'].includes(value.toLowerCase())) return 'Boolean';
  if (!isNaN(Number(value)) && value.trim() !== '') return 'Numeric';
  return 'String';
};

/**
 * Analyzes the columns of a CSV file from its text content.
 * It reads the headers, inspects the first 50 rows to infer data types,
 * and checks for the presence of missing values in each column.
 * @param csvText The full text content of the CSV file.
 * @returns An array of objects, each containing a column name, its inferred type, and a flag for missing values.
 */
const analyzeColumns = (csvText: string): ColumnInfo[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1, 51); 

    if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
        return [];
    }
    
    const parsedRows = rows.map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));

    const columnTypes: { [key: string]: Set<string> } = {};
    const columnsWithMissingValues = new Set<string>();

    headers.forEach(h => { if(h) columnTypes[h] = new Set() });

    parsedRows.forEach(row => {
        headers.forEach((header, index) => {
            if (header) {
                const cellValue = row[index];
                if (cellValue === null || cellValue === undefined || cellValue.trim() === '') {
                    columnsWithMissingValues.add(header);
                } else {
                    columnTypes[header].add(inferDataType(cellValue));
                }
            }
        });
    });

    return headers.filter(h => h).map(header => {
        const types = Array.from(columnTypes[header]);
        let finalType = 'String'; 
        if (types.length === 0) {
            finalType = 'Empty';
        } else if (types.length === 1) {
            finalType = types[0];
        } else if (types.length > 1) {
             if (types.includes('String')) {
                finalType = 'String (Mixed)';
            } else if (types.includes('Numeric') && types.includes('Boolean')) {
                finalType = 'Numeric';
            } else {
                finalType = 'Mixed';
            }
        }
        return { name: header, type: finalType, hasMissingValues: columnsWithMissingValues.has(header) };
    });
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your conversational data analysis assistant. Please upload a CSV file to begin.',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; columns: ColumnInfo[] } | null>(null);
  const [cleaningStrategies, setCleaningStrategies] = useState<{ [key: string]: string }>({});
  const [conversionStrategies, setConversionStrategies] = useState<{ [key: string]: ConversionStrategy }>({});
  const [outlierStrategies, setOutlierStrategies] = useState<{ [key: string]: string }>({});


  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        addMessage({ sender: 'system', text: 'Failed to read the uploaded file.' });
        return;
      }

      const columns = analyzeColumns(text);

      if (columns.length === 0) {
        addMessage({
          sender: 'system',
          text: `Could not parse columns from "${file.name}". Please ensure it is a valid, comma-separated CSV file.`,
        });
        return;
      }

      setUploadedFile({ name: file.name, columns });
      
      const analysisText = columns.map(c => `*   **${c.name}**: ${c.type}`).join('\n');
      addMessage({
        sender: 'system',
        text: `Successfully uploaded **${file.name}**. I've analyzed the first 50 rows to infer column types:\n\n${analysisText}`,
      });

      const columnsWithMissing = columns.filter(c => c.hasMissingValues);
      if (columnsWithMissing.length > 0) {
        const columnNames = columnsWithMissing.map(c => `\`${c.name}\``).join(', ');
        const suggestionText = `
**Data Quality Suggestion: Missing Values Detected**

I found missing values in the column(s): ${columnNames}.

Please use the **"Data Studio"** panel's **"Missing Values"** tab to choose a cleaning strategy for each column.
        `;
         addMessage({ sender: 'system', text: suggestionText });
      }

      addMessage({ sender: 'ai', text: `What would you like to know about **${file.name}**? You can ask a question or use the Data Studio to clean the file.` });
    };
    reader.readAsText(file);
  };
  
  const handleSend = useCallback(async (text: string) => {
    if (isLoading || !text.trim()) return;

    addMessage({ sender: 'user', text });
    setIsLoading(true);

    try {
      const aiResponse = await analyzeDataWithGemini(text, uploadedFile?.columns || []);
      
      const chartDataRegex = /```json\n([\s\S]*?)\n```/;
      const match = aiResponse.match(chartDataRegex);
      
      let responseText = aiResponse;
      let chartData: ChartData | null = null;
      
      if (match && match[1]) {
        try {
          chartData = JSON.parse(match[1]);
          responseText = aiResponse.replace(chartDataRegex, '').trim();
        } catch (error) {
          console.error('Failed to parse chart JSON:', error);
        }
      }

      addMessage({ sender: 'ai', text: responseText, chartData: chartData || undefined });
    } catch (error) {
      console.error(error);
      addMessage({
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please check your API key and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, uploadedFile]);

  const handleApplyCleaning = useCallback(() => {
    const cleaningRequests = Object.entries(cleaningStrategies)
        .map(([column, strategy]) => {
            if (strategy) {
                const strategyText = strategy.replace('-', ' ');
                return `For the column "${column}", handle missing values by applying the following strategy: ${strategyText}.`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    if (cleaningRequests) {
        const fullQuery = `Apply the following data cleaning steps to handle missing values:\n${cleaningRequests}`;
        handleSend(fullQuery);
        setCleaningStrategies({}); 
    }
  }, [cleaningStrategies, handleSend]);

  const handleApplyConversions = useCallback(() => {
    const conversionRequests = Object.entries(conversionStrategies)
      .map(([column, strategy]) => {
        if (strategy && strategy.targetType) {
          let request = `For the column "${column}", convert its data type to ${strategy.targetType}.`;
          if (strategy.targetType === 'Numeric' && strategy.onError) {
            request += ` When handling conversion errors, the strategy should be to ${strategy.onError} the problematic rows.`;
          }
          return request;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');

    if (conversionRequests) {
      const fullQuery = `Apply the following data type conversions:\n${conversionRequests}`;
      handleSend(fullQuery);
      setConversionStrategies({});
    }
  }, [conversionStrategies, handleSend]);

  const handleApplyOutlierRemoval = useCallback(() => {
    const outlierRequests = Object.entries(outlierStrategies)
      .filter(([_, method]) => method)
      .map(([column, method]) => `For the numeric column "${column}", remove outliers using the ${method} method.`)
      .join('\n');

    if (outlierRequests) {
      const fullQuery = `Apply the following outlier removal steps:\n${outlierRequests}`;
      handleSend(fullQuery);
      setOutlierStrategies({});
    }
  }, [outlierStrategies, handleSend]);


  const columnsWithMissing = uploadedFile?.columns.filter(c => c.hasMissingValues) || [];
  const numericColumns = uploadedFile?.columns.filter(c => c.type.includes('Numeric')) || [];

  return (
    <div className="flex h-screen antialiased text-gray-200 bg-gray-900 font-sans">
      <Sidebar />
      <main className="flex flex-col flex-1 h-full">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>
        
        <div className="px-4 md:px-6 pb-4 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
          {uploadedFile ? (
            <div className="animate-slide-in-up">
              <div className="flex items-center gap-3 p-3 my-3 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg">
                  <CsvIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-grow">
                    <span className="font-semibold">{uploadedFile.name}</span>
                    <p className="text-xs text-gray-400">{uploadedFile.columns.length} columns loaded.</p>
                  </div>
              </div>
              <DataStudioPanel
                  columns={uploadedFile.columns}
                  columnsWithMissing={columnsWithMissing}
                  numericColumns={numericColumns}
                  cleaningStrategies={cleaningStrategies}
                  setCleaningStrategies={setCleaningStrategies}
                  handleApplyCleaning={handleApplyCleaning}
                  conversionStrategies={conversionStrategies}
                  setConversionStrategies={setConversionStrategies}
                  handleApplyConversions={handleApplyConversions}
                  outlierStrategies={outlierStrategies}
                  setOutlierStrategies={setOutlierStrategies}
                  handleApplyOutlierRemoval={handleApplyOutlierRemoval}
                  onAction={handleSend}
                  disabled={isLoading}
              />
            </div>
          ) : (
             <div className="text-center p-4 text-sm text-gray-500">
              Please upload a CSV file to begin analysis.
            </div>
          )}
          
          <QuickActions onAction={handleSend} disabled={!uploadedFile || isLoading} />
          <ChatInput onSend={handleSend} onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;