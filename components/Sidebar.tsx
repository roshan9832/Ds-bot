
import React from 'react';
import { AnalyticsIcon, DatabaseIcon, FileTextIcon, HistoryIcon, SettingsIcon, LogoIcon } from './icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false }) => (
  <a
    href="#"
    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
      ${active
        ? 'bg-gray-700 text-white'
        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </a>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700">
      <div className="flex items-center h-16 px-4 border-b border-gray-700">
        <LogoIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="ml-2 text-lg font-semibold text-white">Data AI</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavItem icon={<AnalyticsIcon className="w-5 h-5" />} label="Conversation" active />
        <NavItem icon={<DatabaseIcon className="w-5 h-5" />} label="Datasets" />
        <NavItem icon={<FileTextIcon className="w-5 h-5" />} label="Reports" />
        <NavItem icon={<HistoryIcon className="w-5 h-5" />} label="History" />
      </nav>
      <div className="p-4 border-t border-gray-700">
        <NavItem icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
      </div>
    </aside>
  );
};
