
import React from 'react';

interface QuickActionsProps {
  onAction: (action: string) => void;
  disabled: boolean;
}

const actions = [
  "Summarize the dataset",
  "Check for missing values",
  "Identify potential outliers",
  "Suggest visualizations",
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, disabled }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-3">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action}
        </button>
      ))}
    </div>
  );
};
