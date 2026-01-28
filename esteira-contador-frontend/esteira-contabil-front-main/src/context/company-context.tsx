import { getCookie, setCookie } from 'cookies-next';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router'; // Importa o hook useRouter do Next.js

// Tipagem do contexto
interface CompanyContextType {
	state: string;
	updateState: (newValue: string) => void;
}

// Criando o contexto com valor inicial opcional
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Tipagem para as propriedades do provedor
interface CompanyContextProviderProps {
	children: ReactNode;
}

// Provedor do contexto
export const CompanyContextProvider: React.FC<CompanyContextProviderProps> = ({ children }) => {
	const [state, setState] = useState<string>('');
	const [loading, setLoading] = useState(true); // Estado para controlar o carregamento do estado do cookie
	const router = useRouter(); // Instância do roteador

	// Carregar estado do cookie na montagem
	useEffect(() => {
		const fetchStoredState = () => {
			const storedState = getCookie('USER_COMPANY_CONTEXT_STATE');
			if (storedState) {
				setState(storedState as string);
			} else {
				if (router.pathname !== '/welcome' && router.pathname !== '/selecao/empresas' && router.pathname !== '/login') {
					router.push('/selecao/empresas');
				}
			}
			setLoading(false); // Marcar como não carregando depois que o valor for obtido
		};
		fetchStoredState();
	}, [router]); // Adiciona o router como dependência para evitar problemas de escopo

	// Atualizar cookie sempre que o estado mudar
	useEffect(() => {
		if (state) {
			setCookie('USER_COMPANY_CONTEXT_STATE', state, { maxAge: 60 * 60 * 24 * 7 }); // Exemplo: cookie expira em 7 dias
		}
	}, [state]);

	const updateState = (newValue: string) => setState(newValue);

	// Se ainda estiver carregando, não renderiza o contexto
	if (loading) {
		return null; // Ou renderiza um spinner de carregamento se necessário
	}

	return <CompanyContext.Provider value={{ state, updateState }}>{children}</CompanyContext.Provider>;
};

// Hook para consumir o contexto
export const useCompanyContext = (): CompanyContextType => {
	const context = useContext(CompanyContext);
	if (!context) {
		throw new Error('CompanyContext deve ser usado dentro de um CompanyContextProvider');
	}
	return context;
};
