import { Column } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<Button
			size='sm'
			className={cn('text-muted-foreground -ml-3 h-8 text-xs hover:bg-transparent dark:hover:bg-transparent', className)}
			variant='ghost'
			onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
		>
			<span>{title}</span>
			<ArrowUpDown />
		</Button>
	);
}
