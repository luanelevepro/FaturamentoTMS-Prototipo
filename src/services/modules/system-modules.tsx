import {
    LayoutDashboard,
    Grid,
    List,
    Calendar,
    Users,
    Settings,
    CreditCard
} from 'lucide-react';
import React from 'react';

// Simplified ModuleType for this project
export type ModuleType = {
    name: string;
    description: string;
    menus: {
        name: string;
        href: string;
        description?: string;
        icon: React.ReactNode;
        items?: { name: string; href: string; description: string }[];
        roles?: string[];
    }[];
    moduleName: string;
    system?: boolean;
    hidden?: boolean;
};

export const systemModules: ModuleType[] = [
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
        name: 'Transporte',
        description: 'Gerenciamento de transportes.',
        moduleName: 'TMS',
        menus: [
            {
                name: 'Viagens (Board)',
                href: '/viagens/board', // MAPS TO LIST_V2
                icon: <Grid className='mr-2 h-4 w-4' />,
                description: 'Visualização em Kanban',
            },
            {
                name: 'Viagens (Lista)',
                href: '/viagens/lista', // MAPS TO LIST
                icon: <List className='mr-2 h-4 w-4' />,
                description: 'Visualização em Lista',
            },
            {
                name: 'Cronograma',
                href: '/viagens/cronograma', // MAPS TO TIMELINE
                icon: <Calendar className='mr-2 h-4 w-4' />,
                description: 'Visualização Cronograma',
            }
        ],
    },
    {
        name: 'Administrativo',
        description: 'Admin',
        moduleName: 'ADMIN',
        menus: [
            {
                name: 'Usuários',
                href: '/admin/usuarios',
                icon: <Users className='mr-2 h-4 w-4' />,
            },
            {
                name: 'Configuração',
                href: '/admin/config',
                icon: <Settings className='mr-2 h-4 w-4' />,
            }
        ]
    },
    {
        name: 'Financeiro',
        description: 'Financeiro',
        moduleName: 'FINANCEIRO',
        menus: [
            {
                name: 'Faturamento',
                href: '/financeiro/faturamento',
                icon: <CreditCard className='mr-2 h-4 w-4' />,
            }
        ]
    }
];
