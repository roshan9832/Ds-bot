
import React, { useRef, useEffect } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatWindowProps {
  messages: MessageType[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="space-y-6">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-3 max-w-lg">
            <LoadingSpinner />
            <span className="text-sm text-gray-300">Analyzing...</span>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
