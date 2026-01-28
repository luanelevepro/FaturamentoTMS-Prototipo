import { ModuleType } from '@/components/navegation/app-sidebar';
import {
	// AlertTriangle,
	Bolt,
	BriefcaseBusiness,
	Building,
	CalendarDays,
	ChartColumnIncreasing,
	CircleUser,
	FileCog,
	FileInput,
	FileOutput,
	FilePlus2,
	LayoutDashboard,
	ReceiptText,
	ScrollText,
	SquarePlus,
	Tag,
	Truck,
	UserCheck,
	Users,
	Workflow,
} from 'lucide-react';

export const systemModules = [
	{
		name: 'Dashboard',
		description: 'Visão geral do sistema.',
		menus: [
			{
				name: 'Visão Geral',
				href: '/',
				icon: <LayoutDashboard className='mr-2 h-4 w-4' />,
				description: 'Visão geral do sistema.',
			},
		],
		moduleName: 'DASHBOARD',
		system: true,
		hidden: true,
	},
	{
		name: 'Sistema',
		description: 'Cadastro de informações básicas do sistema.',
		menus: [
			{
				name: 'Cadastros',
				href: '/',
				icon: <FilePlus2 className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Regimes Tributários',
						href: '/cadastros/regimes-tributarios',
						description: 'Cadastro de regimes tributários.',
					},
					{
						name: 'Simples Nacional',
						href: '/cadastros/simples-nacional',
						description: 'Cadastro de faixas Simples Nacional.',
					},
					{
						name: 'Tipos de produto',
						href: '/cadastros/tipos-produto',
						description: 'Cadastro de tipos de produto.',
					},
					{
						name: 'Tipos de serviço',
						href: '/cadastros/tipos-servico',
						description: 'Cadastro de tipos de serviço.',
					},
					{
						name: 'Tipos de grupos',
						href: '/contabilidade/tipos-grupos',
						description: 'Cadastro de tipos de grupos de contas.',
					},
					{
						name: 'Origem CST',
						href: '/cadastros/origem-cst',
						description: 'Cadastro de origem CST.',
					},
					{
						name: 'CST',
						href: '/cadastros/cst',
						description: 'Cadastro de CST.',
					},
					{
						name: 'CFOP',
						href: '/cadastros/cfop',
						description: 'Cadastro de CFOP.',
					},
					{
						name: 'UF',
						href: '/cadastros/uf',
						description: 'Cadastro de Unidades Federativas.',
					},
					{
						name: 'Cidades',
						href: '/cadastros/cidades',
						description: 'Cadastro de cidades.',
					},
					{
						name: 'Tipos de Inconsistência',
						href: '/cadastros/tipos-inconsistencia',
						description: 'Cadastro de tipos de inconsistência para auditoria.',
					},
				],
			},
			{
				name: 'Integrações',
				href: '/integracao',
				icon: <Workflow className='mr-2 h-4 w-4' />,
			},
			{
				name: 'Embarcador',
				href: '/',
				icon: <Building className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Marcas Carrocerias',
						href: '/embarcador/sis-embarcador/marcas-carrocerias',
						description: 'Gerenciamento de marcas de carrocerias',
					},
					// TODO: Implementar importação de documentos spreadSheet
					// {
					// 	name: 'Import. Frota',
					// 	href: '/sistema/embarcador/importacoes/frota',
					// 	description: 'Gerenciamento de layouts  de importação',
					// },
				],
			},
		],
		moduleName: 'SISTEMA',
		hidden: true,
	},
	{
		name: 'Administrativo',
		description: 'Gerenciamento administrativo do sistema.',
		menus: [
			{
				name: 'Escritórios',
				href: '/administracao/escritorios',
				icon: <ScrollText className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de escritorios.',
				roles: ['ADM_SISTEMA'],
			},
			{
				name: 'Empresas',
				href: '/administracao/empresas',
				icon: <Building className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de empresas.',
				roles: ['ADM_SISTEMA', 'ADM_ESCRITORIO'],
			},
			{
				name: 'Usuários',
				href: '/administracao/usuarios',
				icon: <Users className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de usuários.',
				roles: ['ADM_SISTEMA', 'ADM_ESCRITORIO', 'ADM_EMPRESA'],
			},
			{
				name: 'Integrações',
				href: '/integracao/conexoes',
				icon: <Workflow className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de conexões de integração.',
				roles: ['ADM_EMPRESA', 'ADM_ESCRITORIO'],
			},
			{
				name: 'Minha Conta',
				href: '/administracao/minha-conta/resumo',
				icon: <CircleUser className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de minha conta.',
				roles: ['ADM_EMPRESA', 'ADM_ESCRITORIO'],
			},{
				name: 'Configuração',
				href: '/',
				icon: <Bolt className='mr-2 h-4 w-4' />,
				description: 'Configurações administrativas',
				roles: ['ADM_EMPRESA', 'ADM_ESCRITORIO'],
				items: [
					{
						name: 'Faturamento',
						description: 'configurações empresa',
						href: '/administracao/config/faturamento',
					},
				],
			},
		],
		moduleName: 'ADMINISTRATIVO',
	},
	{
		name: 'Fiscal',
		description: 'Gerenciamento de obrigações fiscais.',
		moduleName: 'FISCAL',
		menus: [
			{
				name: 'Cadastros',
				href: '',
				icon: <FilePlus2 className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Certicado Digital',
						href: '/fiscal/certificado-digital',
						description: 'Cadastro de certificados digitais.',
					},
					{
						name: 'Fornecedores',
						href: '/fiscal/fornecedores',
						description: 'Cadastro de fornecedores de empresa.',
					},
					{
						name: 'Itens padrões',
						href: '/cadastros/itens-padroes',
						description: 'Cadastro de itens padrões por segmento.',
					},
					{
						name: 'Produtos',
						href: '/fiscal/produtos',
						description: 'Cadastro de produtos.',
					},
					{
						name: 'Regras NF-e',
						href: '/fiscal/entradas/regras-nfe',
						description: 'Cadastro de regras para NF-e de entrada.',
					},
					{
						name: 'Segmentos empresa',
						href: '/cadastros/segmentos-empresa',
						description: 'Cadastro de segmentos de empresa.',
					},
					{
						name: 'Serviços',
						href: '/fiscal/servicos',
						description: 'Cadastro de serviços.',
					},
				],
			},
			{
				name: 'Entradas',
				href: '/fiscal/entradas',
				icon: <FileInput className='mr-2 h-4 w-4' />,
			},
			{
				name: 'Saídas',
				href: '/fiscal/saidas',
				icon: <FileOutput className='mr-2 h-4 w-4' />,
			},
			// {
			// 	name: 'Auditoria Fiscal',
			// 	href: '/fiscal/auditoria',
			// 	icon: <AlertTriangle className='mr-2 h-4 w-4' />,
			// },
		],
	},
	{
		name: 'Contabilidade',
		description: 'Gerenciamento de contas e lançamentos contábeis.',
		moduleName: 'CONTABILIDADE',
		menus: [
			{
				name: 'Cadastros',
				href: '',
				icon: <FilePlus2 className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Centros de Custos',
						href: '/contabilidade/centros-custos',
						description: 'Cadastro de centros de custos.',
					},
					{
						name: 'Departamentos',
						href: '/contabilidade/departamentos',
						description: 'Cadastro de departamentos.',
					},
					{
						name: 'Grupo de contas',
						href: '/contabilidade/grupos-contas',
						description: 'Cadastro de grupos de contas.',
					},
				],
			},
			{
				name: 'Plano de Contas',
				href: '/contabilidade/plano-contas',
				icon: <ReceiptText className='mr-2 h-4 w-4' />,
			},
		],
	},
	{
		name: 'Finanças',
		description: 'Gerenciamento de contas e lançamentos financeiros.',
		moduleName: 'FINANÇAS',
		menus: [],
	},
	{
		name: 'Faturamento',
		description: 'Gerenciamento de faturamento e notas fiscais.',
		moduleName: 'FATURAMENTO',
		menus: [
			{
				name: 'Dashboard',
				href: '/faturamento/dashboard',
				icon: <ChartColumnIncreasing className='mr-2 h-4 w-4' />,
				description: 'Análise de metas e faturamento',
			},
			{
				name: 'Cadastros',
				href: '/',
				icon: <SquarePlus className='mr-2 h-4 w-4' />,
				description: 'Análise de metas e faturamento',
				items: [				
					{
						name: 'Série',
						description: 'Cadastrar série',
						href: '/faturamento/serie',
					},
					{
						name: 'Apólices',
						description: 'Cadastrar apólices',
						href: '/faturamento/apolice',
					},
				],
			},
			{
				name: 'Transporte',
				href: '/',
				icon: <Truck className='mr-2 h-4 w-4' />,
				description: 'Transporte visão geral.',
				items: [
					{
						name: 'Visão geral',
						description: 'Transporte - Últimas viagens',
						href: '/faturamento/transporte',
					},
					{
						name: 'DFe',
						description: 'Transporte - DFe',
						href: '/faturamento/transporte/dfe',
					},
					{
						name: 'CTe',
						description: 'Transporte - Cte',
						href: '/faturamento/transporte/cte',
					},
					{
						name: 'MDFe',
						description: 'Transporte - MDFe',
						href: '/faturamento/transporte/mdfe',
					},
					{
						name: 'Viagens e Cargas',
						description: 'Transporte - Viagens e Cargas',
						href: '/faturamento/transporte/viagens-cargas',
					},
				],
			},
			{
				name: 'Vendas',
				href: '/aaaa',
				icon: <Tag className='mr-2 h-4 w-4' />,
				description: 'eita.',
			},
			{
				name: 'Serviços',
				href: '/aaaa',
				icon: <Bolt className='mr-2 h-4 w-4' />,
				description: 'aaaaa.',
			},
			{
				name: 'Fechamento',
				href: '/aaaa',
				icon: <CalendarDays className='mr-2 h-4 w-4' />,
				description: 'aaaaa.',
			},
		],
	},
	{
		name: 'Estoques',
		description: 'Gerenciamento de estoques e produtos.',
		moduleName: 'ESTOQUES',
		menus: [],
	},
	{
		name: 'Recursos Humanos',
		description: 'Gerenciamento de funcionários e folha de pagamento.',
		moduleName: 'RECURSOS_HUMANOS',
		menus: [
			{
				name: 'Funcionários',
				href: '/recursos-humanos/funcionarios',
				icon: <UserCheck className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de usuários.',
			},
			{
				name: 'Cargos',
				href: '/recursos-humanos/cargos',
				icon: <BriefcaseBusiness className='mr-2 h-4 w-4' />,
				description: 'Gerenciamento de usuários.',
			},
		],
	},
	{
		name: 'Controladoria',
		description: 'Gerenciamento de custos e orçamentos.',
		moduleName: 'CONTROLADORIA',
		menus: [],
	},
	{
		name: 'TMS',
		description: 'Gerenciamento de transportes e logística.',
		moduleName: 'TMS',
		menus: [
			{
				name: 'Cadastros',
				href: '',
				icon: <FilePlus2 className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Veículos',
						href: '/tms/veiculos',
						description: 'Cadastro de veículos da frota.',
					},
					{
						name: 'Segmentos',
						href: '/tms/segmentos',
						description: 'Cadastro de segmentos de transporte.',
					},
				],
			},
		],
	},
	{
		name: 'Embarcador',
		moduleName: 'EMBARCADOR',
		description: 'Módulo Embarcador.',
		menus: [
			{
				name: 'Parâmetros',
				href: '/',
				icon: <FileCog className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Class. Veículos',
						href: '/embarcador/parametros/classificacao-veiculos',
						description: 'Gerenciamento de classificação de veículos.',
					},
					{
						name: 'Class. Carroceria',
						href: '/embarcador/parametros/classificacao-carrocerias',
						description: 'Gerenciamento de Classificação de carroceria.',
					},
					{
						name: 'Class. Implementos',
						href: '/embarcador/parametros/classificacao-implementos',
						description: 'Gerenciamento de Classificação de implementos.',
					},
				],
			},
			{
				name: 'Cadastros',
				href: '/',
				icon: <FilePlus2 className='mr-2 h-4 w-4' />,
				items: [
					{
						name: 'Estabelecimentos',
						href: '/embarcador/cadastros/estabelecimentos',
						description: 'Gerenciamento de estabelecimentos',
					},
					{
						name: 'Transportadoras',
						href: '/embarcador/cadastros/transportadoras',
						description: 'Gerenciamento de transportadoras',
					},
				],
			},
		],
	},
] satisfies ModuleType[];
