import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import TasksFloatingPanel from './TasksFloatingPanel.jsx';
import ActivityOverlay from './ActivityOverlay.jsx';
import { isMockMode } from '@/api/config.js';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const toggleActivity = useCallback(() => {
    setActivityOpen((open) => !open);
  }, []);

  const closeActivity = useCallback(() => {
    setActivityOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] transition-all duration-300 w-full">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          activityOpen={activityOpen}
          onToggleActivity={toggleActivity}
        />
        <div className="bg-primary-fixed text-on-primary-fixed text-xs font-semibold px-4 py-2 border-b border-outline-variant">
          {isMockMode
            ? 'POC frontend · datos en este navegador · sin conexión a NestJS'
            : 'Modo API · sesión JWT contra NestJS'}
        </div>
        <main className="flex-1 p-4 md:px-8 md:py-6 w-full min-w-0 max-w-[1440px]">
          {children}
        </main>
      </div>
      <ActivityOverlay open={activityOpen} onClose={closeActivity} />
      <TasksFloatingPanel />
    </div>
  );
};

export default Layout;
