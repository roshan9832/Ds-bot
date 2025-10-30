
import React, { useState, useRef } from 'react';
import { SendIcon, PaperclipIcon } from './icons';

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onFileUpload, isLoading }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text);
      setText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />
      <button
        type="button"
        onClick={handleAttachClick}
        className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors"
      >
        <PaperclipIcon className="w-5 h-5" />
      </button>
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about your data..."
          className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-indigo-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
