import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    disabled: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab, disabled }) => {
    return (
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !disabled && setActiveTab(tab.id)}
                        disabled={disabled}
                        className={`
                            flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium
                            ${activeTab === tab.id
                                ? 'border-indigo-400 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                        `}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};