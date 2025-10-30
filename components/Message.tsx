import React from 'react';
import { Message as MessageType } from '../types';
import { ChartDisplay } from './ChartDisplay';
import { AiIcon, UserIcon, SystemIcon } from './icons';

interface MessageProps {
  message: MessageType;
}

const renderTextWithMarkdown = (text: string) => {
    // Simple markdown for bold and code blocks
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    let html = text.replace(/\n/g, '<br />'); // Handle newlines
    html = html.replace(boldRegex, '<strong>$1</strong>');
    html = html.replace(codeRegex, '<code class="bg-gray-900/50 text-indigo-300 px-1 py-0.5 rounded text-sm">$1</code>');

    return <p className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }}></p>
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