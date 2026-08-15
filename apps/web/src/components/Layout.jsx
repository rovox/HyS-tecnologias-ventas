import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300 w-full">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="bg-amber-50 text-amber-900 text-xs font-semibold px-4 py-2 border-b border-amber-200">
          POC frontend · datos ficticios en memoria · sin PocketBase ni NestJS
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;