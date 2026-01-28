import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from 'cookies-next';

interface LayoutContextType {
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	documentViewerOpen: boolean;
	setDocumentViewerOpen: (open: boolean) => void;
	documentViewerWidth: number;
	setDocumentViewerWidth: (width: number) => void;
	// Função para abrir o visualizador e minimizar a sidebar automaticamente
	openDocumentViewer: () => void;
	// Função para fechar o visualizador e restaurar a sidebar se necessário
	closeDocumentViewer: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
	children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
	const [isMounted, setIsMounted] = useState(false);
	const [sidebarOpen, setSidebarOpenState] = useState(true);
	const [documentViewerOpen, setDocumentViewerOpenState] = useState(false);
	const [documentViewerWidth, setDocumentViewerWidth] = useState(900);
	const [sidebarWasOpenBeforeViewer, setSidebarWasOpenBeforeViewer] = useState(true);

	// Inicialização do estado da sidebar a partir do cookie
	useEffect(() => {
		setIsMounted(true);
		const cookieValue = getCookie('USER_SIDEBAR_STATE');
		if (cookieValue !== undefined) {
			setSidebarOpenState(cookieValue === 'true');
		}
	}, []);

	// Atualiza o cookie sempre que o estado da sidebar mudar
	useEffect(() => {
		if (isMounted) {
			setCookie('USER_SIDEBAR_STATE', sidebarOpen.toString(), { path: '/' });
		}
	}, [sidebarOpen, isMounted]);

	const setSidebarOpen = (open: boolean) => {
		setSidebarOpenState(open);
	};

	const setDocumentViewerOpen = (open: boolean) => {
		setDocumentViewerOpenState(open);
	};

	const openDocumentViewer = () => {
		// Salva o estado atual da sidebar antes de minimizá-la
		setSidebarWasOpenBeforeViewer(sidebarOpen);

		// Minimiza a sidebar se estiver aberta
		if (sidebarOpen) {
			setSidebarOpen(false);
		}

		// Abre o visualizador
		setDocumentViewerOpen(true);
	};

	const closeDocumentViewer = () => {
		// Fecha o visualizador
		setDocumentViewerOpen(false);

		// Restaura a sidebar para o estado anterior se ela estava aberta
		if (sidebarWasOpenBeforeViewer) {
			setSidebarOpen(true);
		}
	};

	return (
		<LayoutContext.Provider
			value={{
				sidebarOpen,
				setSidebarOpen,
				documentViewerOpen,
				setDocumentViewerOpen,
				documentViewerWidth,
				setDocumentViewerWidth,
				openDocumentViewer,
				closeDocumentViewer,
			}}
		>
			{children}
		</LayoutContext.Provider>
	);
}

export function useLayout() {
	const context = useContext(LayoutContext);
	if (context === undefined) {
		throw new Error('useLayout must be used within a LayoutProvider');
	}
	return context;
}
