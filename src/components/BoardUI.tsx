import React from 'react';
import { Info, Package } from 'lucide-react';

// --- SHARED TYPES ---

export interface BoardColumnProps {
    title: string | React.ReactNode;
    count: number;
    children: React.ReactNode;
    headerColor: string;
    accentColor?: string;
    tooltip?: string;
    headerExtra?: React.ReactNode; // Elemento extra no header (ex: botão de alertas)
}

export interface BoardCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    accentColor?: string; // 'blue' | 'yellow' | 'orange' | 'emerald' | 'gray' etc
}

// --- COMPONENTS ---

export const BoardColumn: React.FC<BoardColumnProps> = ({
    title,
    count,
    children,
    headerColor,
    accentColor,
    tooltip,
    headerExtra
}) => (
    <div className={`flex-1 min-w-[320px] flex flex-col h-full rounded-[40px] overflow-hidden shadow-inner bg-gray-100 ring-1 ring-black/5`}>
        <div className={`p-6 border-b border-gray-200 flex justify-between items-center shrink-0 shadow-sm ${headerColor} rounded-t-[40px]`}>
            <div className="flex items-center gap-3">
                {typeof title === 'string' ? (
                    <h3 className="font-black text-gray-950 text-xs uppercase tracking-tighter">{title}</h3>
                ) : (
                    <div className="font-black text-gray-950 text-xs uppercase tracking-tighter">{title}</div>
                )}
                {tooltip && (
                    <div className="group relative">
                        <Info size={14} className="text-current opacity-50 cursor-help hover:opacity-100 transition-opacity" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            {tooltip}
                            <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {headerExtra}
                <span className="text-[10px] font-black bg-black text-white px-3 py-1.5 rounded-full shadow-lg tabular-nums tracking-tighter leading-none">{count}</span>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white/60">
            {children}
        </div>
    </div>
);

export const BoardCard: React.FC<BoardCardProps> = ({
    children,
    className = '',
    onClick,
    accentColor
}) => {

    // Determine border color based on accentColor if not provided in className
    let accentBorder = 'border-l-gray-400';
    if (accentColor === 'blue') accentBorder = 'border-l-blue-500';
    else if (accentColor === 'yellow') accentBorder = 'border-l-yellow-400';
    else if (accentColor === 'orange') accentBorder = 'border-l-orange-500';
    else if (accentColor === 'emerald') accentBorder = 'border-l-emerald-500';
    else if (accentColor === 'green') accentBorder = 'border-l-green-500';
    else if (accentColor === 'purple') accentBorder = 'border-l-purple-500';
    else if (accentColor === 'gray') accentBorder = 'border-l-gray-400';

    return (
        <div
            onClick={onClick}
            className={`
                bg-white p-6 rounded-[35px] border border-gray-200/50 shadow-sm
                hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 cursor-default ring-1 ring-black/5
                border-l-4 ${accentBorder}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export const EmptyState: React.FC<{ text?: string; message?: string }> = ({ text, message }) => (
    <div className="text-center py-16 px-8 rounded-[40px] border-4 border-dashed border-gray-100 mb-4 bg-gray-50/30">
        <Package size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{text || message}</p>
    </div>
);
