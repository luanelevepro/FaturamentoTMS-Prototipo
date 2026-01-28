import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import UserModules from './btn-modules-user';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { User } from '@/pages/administracao/usuarios';
import HandleDeleteUser from './btn-delete-user';

export const columns: ColumnDef<User>[] = [
	{
		accessorKey: 'ds_name',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'ds_email',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
	},
	{
		accessorKey: 'is_confirmed',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			return (
				<Badge variant={'outline'} className='cursor-default'>
					{row.getValue('is_confirmed') ? 'Ativo' : 'Inativo'}
				</Badge>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<div className='flex justify-end'>
					<UserModules user={row.original} />
					<HandleDeleteUser user={row.original} />
				</div>
			);
		},
	},
];
