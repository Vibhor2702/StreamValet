import React from 'react';

export default function Layout({ sidebar, header, children }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <aside className="w-16 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
        {sidebar}
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6">
          {header}
        </header>
        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
