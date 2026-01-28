import React, { createContext, useContext, useState, ReactNode } from 'react';

type CompanyContextType = {
    state: string;
    updateState: (id: string) => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<string>('1');

    const updateState = async (id: string) => {
        setState(id);
        // Persist or verify if needed
    };

    return (
        <CompanyContext.Provider value={{ state, updateState }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompanyContext() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompanyContext must be used within a CompanyProvider');
    }
    return context;
}
