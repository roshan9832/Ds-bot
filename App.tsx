
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { QuickActions } from './components/QuickActions';
import { DataStudioPanel } from './components/DataStudioPanel';
import { analyzeDataWithGemini } from './services/geminiService';
import { Message, ChartData, ColumnInfo, ConversionStrategy, NumericStats, CategoricalStats, ValidationIssue } from './types';
import { CsvIcon, DownloadIcon } from './components/icons';

/**
 * Checks if a string value can be interpreted as a number.
 * @param v The string value.
 * @returns True if the value is numeric, false otherwise.
 */
const isNumeric = (v: string): boolean => v.trim() !== '' && !isNaN(Number(v));

/**
 * Calculates statistical metrics for an array of numbers.
 * @param data Array of numbers.
 * @returns An object containing mean, median, standard deviation, min, and max.
 */
const getNumericStats = (data: number[]): NumericStats => {
    if (data.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const stdDev = Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data.length);
    return {
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        min: sorted[0],
        max: sorted[sorted.length - 1]
    };
};

/**
 * Calculates frequency counts for an array of strings.
 * @param data Array of strings.
 * @returns An object containing value counts and the number of unique values.
 */
const getCategoricalStats = (data: string[]): CategoricalStats => {
    const valueCounts = data.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return { valueCounts, uniqueValues: Object.keys(valueCounts).length };
};


/**
 * Analyzes the columns of a CSV file from its text content.
 * It processes the entire dataset to infer data types, count missing values,
 * and calculate detailed statistics for each column.
 * @param csvText The full text content of the CSV file.
 * @returns An array of objects, each containing detailed info and stats for a column.
 */
const analyzeColumns = (csvText: string): ColumnInfo[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));

    return headers.map((header, colIndex) => {
        const columnValues = rows.map(row => row[colIndex]).filter(v => v !== undefined);
        const nonMissingValues = columnValues.filter(v => v !== null && v.trim() !== '');
        
        const missingCount = columnValues.length - nonMissingValues.length;
        const totalRows = rows.length;

        const isPotentiallyNumeric = nonMissingValues.every(isNumeric);

        let columnInfo: ColumnInfo = {
            name: header,
            type: 'String',
            hasMissingValues: missingCount > 0,
            missingCount,
            totalRows,
        };

        if (isPotentiallyNumeric && nonMissingValues.length > 0) {
            columnInfo.type = 'Numeric';
            const numericData = nonMissingValues.map(Number);
            columnInfo.stats = getNumericStats(numericData);
        } else {
            const uniqueValues = new Set(nonMissingValues);
            if (uniqueValues.size <= 2 && nonMissingValues.length > 0) {
                 columnInfo.type = 'Boolean';
            }
            columnInfo.stats = getCategoricalStats(nonMissingValues);
        }
        
        return columnInfo;
    });
};

const formatColumnAnalysis = (columns: ColumnInfo[]): string => {
  return columns.map(c => {
    let statsString = '';
    if (c.stats) {
      if (c.type === 'Numeric') {
        const stats = c.stats as NumericStats;
        statsString = `Mean: ${stats.mean}, Median: ${stats.median}, StdDev: ${stats.stdDev}, Range: [${stats.min}, ${stats.max}]`;
      } else {
        const stats = c.stats as CategoricalStats;
        const topValues = Object.entries(stats.valueCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([val, count]) => `${val} (${count})`)
          .join(', ');
        statsString = `${stats.uniqueValues} unique values. Top: ${topValues}`;
      }
    }
    const missingString = c.hasMissingValues ? ` (${c.missingCount}/${c.totalRows} missing)` : '';
    return `*   **${c.name}** (${c.type})${missingString}: ${statsString}`;
  }).join('\n');
};

/**
 * Validates CSV data for common issues like inconsistent row lengths and mixed data types.
 * @param headers An array of header strings.
 * @param rows A 2D array representing the rows and cells of the CSV.
 * @param columnInfo An array of ColumnInfo objects from the initial analysis.
 * @returns An array of validation issues found.
 */
const validateCsvData = (headers: string[], rows: string[][], columnInfo: ColumnInfo[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const headerCount = headers.length;
    const numericColumns = new Set(columnInfo.filter(c => c.type === 'Numeric').map(c => c.name));

    rows.forEach((row, rowIndex) => {
        // Check for inconsistent row length
        if (row.length !== headerCount) {
            issues.push({
                type: 'INCONSISTENT_ROW_LENGTH',
                row: rowIndex + 2, // 1-based index + header row
                message: `Expected ${headerCount} columns, but found ${row.length}.`,
            });
            return;
        }

        // Check for mixed data types in numeric columns
        row.forEach((cell, colIndex) => {
            const header = headers[colIndex];
            if (numericColumns.has(header) && cell.trim() !== '' && !isNumeric(cell)) {
                issues.push({
                    type: 'MIXED_DATA_TYPE',
                    column: header,
                    row: rowIndex + 2, // 1-based index + header row
                    value: cell,
                    message: `Found non-numeric value "${cell}" in the supposedly numeric column "${header}".`,
                });
            }
        });
    });

    return issues;
};

/**
 * Formats validation issues into a user-friendly markdown string.
 * @param issues An array of validation issues.
 * @returns A formatted string to be displayed in the chat.
 */
const formatValidationIssues = (issues: ValidationIssue[]): string => {
    const MAX_ISSUES_TO_SHOW = 5;
    const issueSummary = issues.slice(0, MAX_ISSUES_TO_SHOW).map(issue => {
        if (issue.type === 'MIXED_DATA_TYPE') {
            return `*   **Mixed Data Type** in column \`${issue.column}\` (Row ${issue.row}): ${issue.message}`;
        }
        if (issue.type === 'INCONSISTENT_ROW_LENGTH') {
            return `*   **Inconsistent Row Length** at Row ${issue.row}: ${issue.message}`;
        }
        return '';
    }).join('\n');

    const moreIssuesMessage = issues.length > MAX_ISSUES_TO_SHOW
        ? `\n...and ${issues.length - MAX_ISSUES_TO_SHOW} more issues.`
        : '';

    return `
**Data Validation Failed**

I found some integrity issues in your CSV file that need to be fixed before I can proceed with the analysis. Please correct them and upload the file again.

Here are the first few issues I found:
${issueSummary}
${moreIssuesMessage}
    `;
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
  const [csvData, setCsvData] = useState<string | null>(null);
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
      
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
          addMessage({ sender: 'system', text: 'The CSV file must contain a header and at least one row of data.' });
          return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));

      const columns = analyzeColumns(text);

      if (columns.length === 0) {
        addMessage({
          sender: 'system',
          text: `Could not parse columns from "${file.name}". Please ensure it is a valid, comma-separated CSV file.`,
        });
        setCsvData(null);
        return;
      }

      const validationIssues = validateCsvData(headers, rows, columns);
      if (validationIssues.length > 0) {
          const errorMessage = formatValidationIssues(validationIssues);
          addMessage({ sender: 'ai', text: errorMessage });
          setUploadedFile(null);
          setCsvData(null);
          return;
      }

      setCsvData(text);
      setUploadedFile({ name: file.name, columns });
      
      const analysisText = formatColumnAnalysis(columns);
      addMessage({
        sender: 'ai',
        text: `Successfully uploaded **${file.name}**. Here's a detailed column analysis:\n\n${analysisText}`,
      });

      const columnsWithMissing = columns.filter(c => c.hasMissingValues);
      if (columnsWithMissing.length > 0) {
        const columnNames = columnsWithMissing.map(c => `\`${c.name}\``).join(', ');
        const suggestionText = `
**Data Quality Suggestion: Missing Values Detected**

I found missing values in the column(s): ${columnNames}.

Please use the **"Data Studio"** panel's **"Missing Values"** tab to choose a cleaning strategy for each column.
        `;
         addMessage({ sender: 'ai', text: suggestionText });
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
      const aiResponse = await analyzeDataWithGemini(text, uploadedFile?.columns || [], csvData);
      
      const chartDataRegex = /```json\n([\s\S]*?)\n```/;
      const csvDataRegex = /```csv\n([\s\S]*?)\n```/;

      const chartMatch = aiResponse.match(chartDataRegex);
      const csvMatch = aiResponse.match(csvDataRegex);
      
      let responseText = aiResponse;
      let chartData: ChartData | null = null;
      
      if (csvMatch && csvMatch[1]) {
        const newCsvData = csvMatch[1].trim();
        setCsvData(newCsvData);
        
        const newColumns = analyzeColumns(newCsvData);
        setUploadedFile(prev => ({ name: prev!.name, columns: newColumns }));
        
        responseText = aiResponse.replace(csvDataRegex, '').trim();
        addMessage({ sender: 'system', text: 'Dataset has been updated. Column analysis is refreshed.' });
      }
      
      if (chartMatch && chartMatch[1]) {
        try {
          chartData = JSON.parse(chartMatch[1]);
          responseText = responseText.replace(chartDataRegex, '').trim();
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
  }, [isLoading, uploadedFile, csvData]);

  const handleApplyCleaning = useCallback(() => {
    const cleaningRequests = Object.entries(cleaningStrategies)
        .map(([column, strategy]) => {
            if (strategy) {
                // FIX: Cast strategy to string to resolve 'unknown' type error.
                const strategyText = (strategy as string).replace('-', ' ');
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
        // FIX: Cast strategy to ConversionStrategy to resolve 'unknown' type errors.
        const typedStrategy = strategy as ConversionStrategy;
        if (typedStrategy && typedStrategy.targetType) {
          let request = `For the column "${column}", convert its data type to ${typedStrategy.targetType}.`;
          if (typedStrategy.targetType === 'Numeric' && typedStrategy.onError) {
            request += ` When handling conversion errors, the strategy should be to ${typedStrategy.onError} the problematic rows.`;
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

  const handleDownload = () => {
    if (!csvData || !uploadedFile) return;

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const originalName = uploadedFile.name.replace(/\.csv$/, '');
    link.setAttribute('download', `${originalName}_modified.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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
                   <button 
                      onClick={handleDownload} 
                      disabled={!csvData}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Download CSV"
                      title="Download modified CSV"
                  >
                      <DownloadIcon className="w-5 h-5" />
                  </button>
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