import React, { useState } from 'react';
import { ColumnInfo, ConversionStrategy, DataTool, NumericStats, CategoricalStats } from '../types';
import { CleanIcon, TypeConvertIcon, OutlierIcon, WandIcon, ProfileIcon, CorrelationIcon } from './icons';
import { Tabs } from './Tabs';

// Props interfaces for sub-panels
interface MissingValuesContentProps {
    columns: ColumnInfo[];
    strategies: { [key: string]: string };
    onStrategyChange: (strategies: { [key: string]: string }) => void;
    onApply: () => void;
    disabled: boolean;
}
interface DataTypeConverterContentProps {
    columns: ColumnInfo[];
    strategies: { [key: string]: ConversionStrategy };
    onStrategyChange: (strategies: { [key: string]: ConversionStrategy }) => void;
    onApply: () => void;
    disabled: boolean;
}
interface OutlierRemovalContentProps {
    columns: ColumnInfo[];
    strategies: { [key: string]: string };
    onStrategyChange: (strategies: { [key: string]: string }) => void;
    onApply: () => void;
    disabled: boolean;
}
interface GeneralActionsContentProps {
    onAction: (action: string) => void;
    disabled: boolean;
}

interface DataProfileContentProps {
    columns: ColumnInfo[];
}

interface CorrelationMatrixContentProps {
    numericColumns: ColumnInfo[];
    onAction: (action: string) => void;
    disabled: boolean;
}


// Sub-panel components

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-gray-700/50 p-2 rounded-md text-center">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-base font-semibold text-gray-100">{value}</p>
    </div>
);

const renderStats = (column: ColumnInfo) => {
    if (column.type === 'Numeric' && column.stats) {
        const stats = column.stats as NumericStats;
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                <StatCard label="Mean" value={stats.mean.toLocaleString()} />
                <StatCard label="Median" value={stats.median.toLocaleString()} />
                <StatCard label="Std Dev" value={stats.stdDev.toLocaleString()} />
                <StatCard label="Min" value={stats.min.toLocaleString()} />
                <StatCard label="Max" value={stats.max.toLocaleString()} />
            </div>
        );
    }
    if ((column.type === 'String' || column.type === 'Boolean') && column.stats) {
        const stats = column.stats as CategoricalStats;
        const topValues = Object.entries(stats.valueCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        
        const total = Object.values(stats.valueCounts).reduce((sum, count) => sum + count, 0);
        if (total === 0) return <div className="mt-3"><StatCard label="Unique Values" value={stats.uniqueValues} /></div>;

        return (
            <div className="mt-3 space-y-3">
                <StatCard label="Unique Values" value={stats.uniqueValues} />
                {topValues.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Top Values</h4>
                        <div className="space-y-2">
                            {topValues.map(([value, count]) => (
                                <div key={value} className="flex items-center text-xs">
                                    <span className="truncate w-2/5 text-gray-300 pr-2" title={value}>{value.trim() === '' ? '""' : value}</span>
                                    <div className="w-3/5 bg-gray-600 rounded-full h-4 relative">
                                        <div 
                                            className="bg-indigo-500 h-4 rounded-full flex items-center justify-end pr-2" 
                                            style={{ width: `${(count / total) * 100}%` }}
                                        >
                                           <span className="text-white text-[10px] font-bold">{count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const DataProfileContent: React.FC<DataProfileContentProps> = ({ columns }) => {
    if (!columns || columns.length === 0) {
        return <p className="text-center text-sm text-gray-500 py-4">No data to profile.</p>;
    }

    const totalRows = columns[0]?.totalRows || 0;

    return (
        <div className="py-4 animate-fade-in">
            <div className="text-center border-b border-gray-700 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-white">Dataset Profile</h3>
                <p className="text-sm text-gray-400">{columns.length} Columns &bull; {totalRows} Rows</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {columns.map(col => (
                    <div key={col.name} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-white truncate text-sm" title={col.name}>{col.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                col.type === 'Numeric' ? 'bg-blue-900 text-blue-300' : 
                                col.type === 'Boolean' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'
                            }`}>{col.type}</span>
                        </div>
                        
                        <div className="text-sm">
                            <div className="flex justify-between items-center bg-gray-700/60 p-2 rounded-md">
                                <span className="text-gray-400">Missing</span>
                                <span className={`font-medium ${col.missingCount > 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                                    {col.missingCount} ({col.totalRows > 0 ? ((col.missingCount / col.totalRows) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>

                        {renderStats(col)}
                    </div>
                ))}
            </div>
        </div>
    );
};


const MissingValuesContent: React.FC<MissingValuesContentProps> = ({ columns, strategies, onStrategyChange, onApply, disabled }) => {
    const getOptionsForType = (type: string) => {
        if (type.includes('Numeric')) {
            return [
                { value: 'impute-mean', label: 'Impute with Mean' },
                { value: 'impute-median', label: 'Impute with Median' },
                { value: 'fill-with-0', label: 'Fill with 0' },
            ];
        }
        return [
            { value: 'impute-mode', label: 'Impute with Mode' },
            { value: 'fill-with-placeholder', label: 'Fill with "missing"' },
        ];
    };
    if (columns.length === 0) {
        return <p className="text-center text-sm text-gray-500 py-4">No columns with missing values detected.</p>;
    }
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
                {columns.map(column => (
                    <div key={column.name}>
                        <label htmlFor={`select-${column.name}`} className="block text-xs font-medium text-gray-400 mb-1">{column.name} <span className="opacity-70">({column.type})</span></label>
                        <select id={`select-${column.name}`} value={strategies[column.name] || ''} onChange={(e) => onStrategyChange({ ...strategies, [column.name]: e.target.value })} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 p-2">
                            <option value="">Select strategy...</option>
                            {getOptionsForType(column.type).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className="text-center">
                <button onClick={onApply} disabled={disabled || Object.values(strategies).every(s => !s)} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Apply Strategies</button>
            </div>
        </>
    );
};

const DataTypeConverterContent: React.FC<DataTypeConverterContentProps> = ({ columns, strategies, onStrategyChange, onApply, disabled }) => {
    const targetTypeOptions = [{ value: 'String', label: 'Text (String)' }, { value: 'Numeric', label: 'Number (Numeric)' }, { value: 'Boolean', label: 'True/False (Boolean)' }];
    const errorHandlingOptions = [{ value: 'coerce', label: 'Set to blank (coerce)' }, { value: 'remove', label: 'Remove row' }];
    
    const handleStrategyChange = (columnName: string, part: keyof ConversionStrategy, value: string) => {
        const currentStrategy = strategies[columnName] || { targetType: '', onError: '' };
        const newStrategy = { ...currentStrategy, [part]: value };
        if (part === 'targetType' && value !== 'Numeric') newStrategy.onError = '';
        onStrategyChange({ ...strategies, [columnName]: newStrategy });
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
                {columns.map(column => {
                    // FIX: Cast strategy to ConversionStrategy to resolve 'unknown' type error.
                    const strategy = strategies[column.name] as ConversionStrategy | undefined;
                    return (
                        <div key={column.name} className="flex flex-col gap-2">
                            <div>
                                <label htmlFor={`select-type-${column.name}`} className="block text-xs font-medium text-gray-400 mb-1">{column.name} <span className="opacity-70">(is {column.type})</span></label>
                                <select id={`select-type-${column.name}`} value={strategy?.targetType || ''} onChange={(e) => handleStrategyChange(column.name, 'targetType', e.target.value)} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 p-2">
                                    <option value="">Convert to...</option>
                                    {targetTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            {strategy?.targetType === 'Numeric' && (
                                 <div>
                                    <label htmlFor={`select-error-${column.name}`} className="block text-xs font-medium text-gray-400 mb-1">If conversion fails</label>
                                    <select id={`select-error-${column.name}`} value={strategy?.onError || ''} onChange={(e) => handleStrategyChange(column.name, 'onError', e.target.value)} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 p-2">
                                        <option value="">Select error handling...</option>
                                        {errorHandlingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="text-center">
                <button onClick={onApply} disabled={disabled || Object.values(strategies).every(s => !(s as ConversionStrategy).targetType)} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Apply Conversions</button>
            </div>
        </>
    );
};

const OutlierRemovalContent: React.FC<OutlierRemovalContentProps> = ({ columns, strategies, onStrategyChange, onApply, disabled }) => {
    const handleCheckboxChange = (columnName: string, isChecked: boolean) => {
        const newStrategies = { ...strategies };
        if (isChecked) newStrategies[columnName] = 'IQR';
        else delete newStrategies[columnName];
        onStrategyChange(newStrategies);
    };
    if (columns.length === 0) {
        return <p className="text-center text-sm text-gray-500 py-4">No numeric columns available for outlier removal.</p>;
    }
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
                {columns.map(column => (
                    <div key={column.name} className="flex items-center bg-gray-700/50 p-3 rounded-md">
                        <input type="checkbox" id={`checkbox-${column.name}`} checked={!!strategies[column.name]} onChange={(e) => handleCheckboxChange(column.name, e.target.checked)} disabled={disabled} className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-indigo-600 focus:ring-indigo-500"/>
                        <label htmlFor={`checkbox-${column.name}`} className="ml-3 block text-sm text-gray-300">{column.name}</label>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-gray-500 mb-3">Uses the Interquartile Range (IQR) method to identify and remove outliers.</p>
            <div className="text-center">
                <button onClick={onApply} disabled={disabled || Object.keys(strategies).length === 0} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Apply Outlier Removal</button>
            </div>
        </>
    );
};

const CorrelationMatrixContent: React.FC<CorrelationMatrixContentProps> = ({ numericColumns, onAction, disabled }) => {
    if (numericColumns.length < 2) {
        return <p className="text-center text-sm text-gray-500 py-4">You need at least two numeric columns to generate a correlation matrix.</p>;
    }

    const handleGenerate = () => {
        onAction('Generate a correlation matrix for all numeric columns in the dataset. Display it as a markdown table.');
    };

    return (
        <div className="py-4 text-center animate-fade-in">
            <h3 className="text-md font-semibold text-white mb-2">Correlation Matrix Analysis</h3>
            <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
                This will calculate the Pearson correlation coefficient between all pairs of numeric columns. The results will be displayed in a matrix, helping you identify linear relationships in your data.
            </p>
            <button
                onClick={handleGenerate}
                disabled={disabled}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Generate Correlation Matrix
            </button>
        </div>
    );
};


const GeneralActionsContent: React.FC<GeneralActionsContentProps> = ({ onAction, disabled }) => {
    const cleaningActions = ["Remove duplicate rows"];
    return (
        <div className="flex flex-wrap justify-center gap-2 my-4">
            {cleaningActions.map((action) => (
                <button key={action} onClick={() => onAction(action)} disabled={disabled} className="px-4 py-2 text-sm font-medium bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{action}</button>
            ))}
        </div>
    );
};


// Main Panel Component
// FIX: Redefined DataStudioPanelProps to be a flat interface to avoid type conflicts with properties like 'strategies' and 'onStrategyChange'.
interface DataStudioPanelProps {
    columns: ColumnInfo[];
    columnsWithMissing: ColumnInfo[];
    numericColumns: ColumnInfo[];

    cleaningStrategies: { [key: string]: string };
    setCleaningStrategies: (strategies: { [key: string]: string }) => void;
    handleApplyCleaning: () => void;

    conversionStrategies: { [key: string]: ConversionStrategy };
    setConversionStrategies: (strategies: { [key: string]: ConversionStrategy }) => void;
    handleApplyConversions: () => void;
    
    outlierStrategies: { [key: string]: string };
    setOutlierStrategies: (strategies: { [key: string]: string }) => void;
    handleApplyOutlierRemoval: () => void;

    onAction: (action: string) => void;
    disabled: boolean;
}


export const DataStudioPanel: React.FC<DataStudioPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<DataTool>('profile');

    const tabs: { id: DataTool; label: string; icon: React.ReactNode; }[] = [
        { id: 'profile', label: 'Profile', icon: <ProfileIcon className="w-5 h-5" /> },
        { id: 'missing-values', label: 'Missing Values', icon: <CleanIcon className="w-5 h-5" /> },
        { id: 'convert-types', label: 'Convert Types', icon: <TypeConvertIcon className="w-5 h-5" /> },
        { id: 'outliers', label: 'Outliers', icon: <OutlierIcon className="w-5 h-5" /> },
        { id: 'correlation', label: 'Correlation', icon: <CorrelationIcon className="w-5 h-5" /> },
        { id: 'general', label: 'General', icon: <WandIcon className="w-5 h-5" /> },
    ];
    
    return (
        <div className="mb-3 p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as DataTool)} disabled={props.disabled} />
            <div className="pt-2">
                {activeTab === 'profile' && (
                    <DataProfileContent columns={props.columns} />
                )}
                {activeTab === 'missing-values' && (
                    <MissingValuesContent 
                        columns={props.columnsWithMissing}
                        strategies={props.cleaningStrategies}
                        onStrategyChange={props.setCleaningStrategies}
                        onApply={props.handleApplyCleaning}
                        disabled={props.disabled}
                    />
                )}
                 {activeTab === 'convert-types' && (
                    <DataTypeConverterContent
                        columns={props.columns}
                        strategies={props.conversionStrategies}
                        onStrategyChange={props.setConversionStrategies}
                        onApply={props.handleApplyConversions}
                        disabled={props.disabled}
                    />
                )}
                {activeTab === 'outliers' && (
                    <OutlierRemovalContent
                        columns={props.numericColumns}
                        strategies={props.outlierStrategies}
                        onStrategyChange={props.setOutlierStrategies}
                        onApply={props.handleApplyOutlierRemoval}
                        disabled={props.disabled}
                    />
                )}
                {activeTab === 'correlation' && (
                    <CorrelationMatrixContent
                        numericColumns={props.numericColumns}
                        onAction={props.onAction}
                        disabled={props.disabled}
                    />
                )}
                 {activeTab === 'general' && (
                    <GeneralActionsContent
                        onAction={props.onAction}
                        disabled={props.disabled}
                    />
                )}
            </div>
        </div>
    );
};