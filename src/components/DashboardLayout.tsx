import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Beaker, Target, Pill, BarChart3 } from 'lucide-react';
interface DashboardLayoutProps {
  children: React.ReactNode;
}
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        {}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <SidebarTrigger className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" />
              <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Beaker className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Drug Discovery Platform</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Pharmaceutical Research</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-card/50 px-3 py-1.5 rounded-md border">
                <Target className="h-4 w-4 text-primary" />
                <span>Target ID</span>
              </div>
              <div className="flex items-center space-x-2 bg-card/50 px-3 py-1.5 rounded-md border">
                <Pill className="h-4 w-4 text-secondary" />
                <span>Hit Discovery</span>
              </div>
              <div className="flex items-center space-x-2 bg-card/50 px-3 py-1.5 rounded-md border">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span>Analysis</span>
              </div>
            </div>
          </div>
        </header>
        {}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}