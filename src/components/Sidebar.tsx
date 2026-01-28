import React from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Truck,
  LogOut,
  ChevronRight,
  Package,
  CreditCard,
  Grid,
  List,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  onChangeView?: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10 hidden md:flex">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">T</div>
        <div>
          <h1 className="font-bold text-sm text-gray-800">TRANSPORTES TOMAZI</h1>
          <p className="text-xs text-gray-500">Empresa</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dashboard</div>
        <NavItem icon={<LayoutDashboard size={18} />} label="Visão Geral" />

        <div className="mt-6 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Transporte</div>
        <NavItem
          icon={<List size={18} />}
          label="Viagens Lista (V1)"
          active={currentView === 'LIST'}
          onClick={() => onChangeView && onChangeView('LIST')}
        />
        <NavItem
          icon={<Grid size={18} />}
          label="Viagens Board (V2)"
          active={currentView === 'LIST_V2'}
          onClick={() => onChangeView && onChangeView('LIST_V2')}
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Cronograma"
          active={currentView === 'TIMELINE'}
          onClick={() => onChangeView && onChangeView('TIMELINE')}
          isNew
        />

        <div className="mt-6 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrativo</div>
        <NavItem icon={<Users size={18} />} label="Usuários" />
        <NavItem icon={<Settings size={18} />} label="Configuração" hasSub />

        <div className="mt-6 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Financeiro</div>
        <NavItem icon={<CreditCard size={18} />} label="Faturamento" />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            LU
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Luan</p>
            <p className="text-xs text-gray-500">ti@eleve.cnt.br</p>
          </div>
          <LogOut size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; hasSub?: boolean; isNew?: boolean; onClick?: () => void }> = ({ icon, label, active, hasSub, isNew, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
        {isNew && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${active ? 'bg-white text-gray-900' : 'bg-purple-100 text-purple-700'}`}>Novo</span>}
      </div>
      {hasSub && <ChevronRight size={14} className="text-gray-400" />}
    </div>
  );
};
