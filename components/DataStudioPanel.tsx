
import React, { useState } from 'react';
import { ColumnInfo, ConversionStrategy, DataTool } from '../types';
import { CleanIcon, TypeConvertIcon, OutlierIcon, WandIcon } from './icons';
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

// Sub-panel components
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
    const [activeTab, setActiveTab] = useState<DataTool>('missing-values');

    const tabs: { id: DataTool; label: string; icon: React.ReactNode; }[] = [
        { id: 'missing-values', label: 'Missing Values', icon: <CleanIcon className="w-5 h-5" /> },
        { id: 'convert-types', label: 'Convert Types', icon: <TypeConvertIcon className="w-5 h-5" /> },
        { id: 'outliers', label: 'Outliers', icon: <OutlierIcon className="w-5 h-5" /> },
        { id: 'general', label: 'General', icon: <WandIcon className="w-5 h-5" /> },
    ];
    
    return (
        <div className="mb-3 p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as DataTool)} disabled={props.disabled} />
            <div className="pt-2">
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