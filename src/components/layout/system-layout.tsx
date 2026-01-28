import { ReactNode, useState } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { CompanyProvider } from '@/context/company-context';

type LayoutProps = {
    children: ReactNode;
};

export default function SystemLayout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <CompanyProvider>
            <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="w-[1px] h-4 bg-gray-200 mx-2" />
                        {/* Breadcrumbs could go here */}
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </CompanyProvider>
    );
}
