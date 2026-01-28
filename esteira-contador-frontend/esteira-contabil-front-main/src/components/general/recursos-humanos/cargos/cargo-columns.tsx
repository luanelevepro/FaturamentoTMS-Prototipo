import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Cargo } from '@/pages/recursos-humanos/cargos';
import HandleInsertCargoSalario from './btn-insert-cargo-salario';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import HandleDeactivateCargo from './btn-deactivate-cargo';
import HandleActivateCargo from './btn-activate-cargo';

export const columns: ColumnDef<Cargo>[] = [
	{
		id: 'expander',
		header: () => null,
		cell: ({ row }) => (
			<Button variant='ghost' size='icon' onClick={() => row.toggleExpanded()}>
				{row.getIsExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}
			</Button>
		),
	},
	{
		accessorKey: 'id_externo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'is_ativo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			return (
				<Badge variant='outline' className='cursor-default'>
					{row.getValue('is_ativo') ? 'Ativo' : 'Inativo'}
				</Badge>
			);
		},
	},
	{
		id: 'actions',
		header: 'Ações',
		cell: ({ row }) => {
			const ativo = row.original.is_ativo === true;
			const cargo = row.original;
			return (
				<div className='flex gap-2' key={cargo.id}>
					{ativo ? <HandleDeactivateCargo cargo={row.original} /> : <HandleActivateCargo cargo={row.original} />}
				</div>
			);
		},
	},
	{
		id: 'expandedContent',
		header: () => null,
		cell: ({ row }) => {
			const cargo = row.original;
			return <HandleInsertCargoSalario cargoId={cargo.id} />;
		},
	},
];
