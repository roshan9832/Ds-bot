import React from 'react';
import { Message as MessageType } from '../types';
import { ChartDisplay } from './ChartDisplay';
import { AiIcon, UserIcon, SystemIcon } from './icons';

interface MessageProps {
  message: MessageType;
}

const renderTextWithMarkdown = (text: string) => {
    // Regex to find markdown table blocks
    const tableRegex = /^((?:\|.*\|(?:\r\n|\n))+)/gm;
    const parts = text.split(tableRegex);

    const elements = parts.map((part, index) => {
        if (!part) return null;

        // Check if the part is a table by re-testing with the regex.
        // The split operation can leave empty strings or newlines that we should ignore.
        if (part.trim().startsWith('|') && part.includes('-') && tableRegex.test(''+part)) {
            const rows = part.trim().split('\n');
            if (rows.length < 2 || !rows[1].includes('-')) {
                 // Not a valid table, render as plain text
            } else {
                const header = rows[0];
                const bodyRows = rows.slice(2);

                let tableHtml = '<div class="overflow-x-auto my-4 bg-gray-900/50 border border-gray-700 rounded-lg"><table class="w-full min-w-max text-left border-collapse">';
                
                const headers = header.split('|').slice(1, -1).map(h => h.trim());
                tableHtml += '<thead><tr class="border-b-2 border-gray-600">';
                headers.forEach(h => {
                    tableHtml += `<th class="p-3 font-semibold text-xs text-gray-300 uppercase tracking-wider">${h}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
                
                bodyRows.forEach(row => {
                    const cells = row.split('|').slice(1, -1).map(c => c.trim());
                    tableHtml += '<tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">';
                    cells.forEach(cell => {
                        const num = parseFloat(cell);
                        let cellClass = 'text-gray-300';
                        if (cell === '1.00' || cell === '1') {
                            cellClass = 'text-gray-500 italic';
                        } else if (!isNaN(num)) {
                            if (num >= 0.7) cellClass = 'text-green-400 font-semibold';
                            else if (num <= -0.7) cellClass = 'text-red-400 font-semibold';
                            else if (num >= 0.4 || num <= -0.4) cellClass = 'text-yellow-400';
                        }
                        tableHtml += `<td class="p-3 text-sm ${cellClass}">${cell}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody></table></div>';
                return <div key={index} dangerouslySetInnerHTML={{ __html: tableHtml }} />;
            }
        }
        
        // Process non-table text
        if (!part.trim()) return null;
        let html = part
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, '<br />')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-900/50 text-indigo-300 px-1 py-0.5 rounded text-sm">$1</code>');
        
        return <p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: html }} />;
    });

    return <div className="text-sm text-gray-200 leading-relaxed">{elements.filter(Boolean)}</div>;
};


export const Message: React.FC<MessageProps> = ({ message }) => {
  const { sender, text, chartData } = message;

  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  const containerClasses = `flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`;
  
  if (isSystem) {
    return (
        <div className="flex items-center justify-center gap-3 my-4 animate-fade-in">
            <div className="w-full h-px bg-gray-700/50"></div>
            <div className="flex items-center gap-2 text-gray-400 text-xs italic text-center whitespace-nowrap bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700/80">
                <SystemIcon className="w-4 h-4" />
                <span>{text}</span>
            </div>
            <div className="w-full h-px bg-gray-700/50"></div>
        </div>
    );
  }

  const bubbleClasses = `rounded-lg p-3 max-w-lg lg:max-w-xl xl:max-w-2xl
    ${isUser ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}
  `;

  const Icon = isUser ? UserIcon : AiIcon;

  return (
    <div className={containerClasses}>
      {!isUser && <Icon className="w-8 h-8 rounded-full bg-gray-600 p-1.5 flex-shrink-0" />}
      
      <div className="flex flex-col gap-2">
        <div className={bubbleClasses}>
            {renderTextWithMarkdown(text)}
        </div>
        {chartData && (
          <div className="bg-gray-700 p-4 rounded-lg w-full max-w-lg lg:max-w-xl xl:max-w-2xl animate-slide-in-up">
             <ChartDisplay chartData={chartData} />
          </div>
        )}
      </div>

      {isUser && <Icon className="w-8 h-8 rounded-full bg-gray-600 p-1.5 flex-shrink-0" />}
    </div>
  );
};