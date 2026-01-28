import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { Company } from '@/pages/administracao/empresas';
import BtnSetModulosEmpresa from './btn-modules-empresa';
import BtnUsuariosEmpresa from './btn-usuarios-empresa';
import BtnHandleInsertAPI from './btn-insert-api-key';
import BtnVincularParametros from './btn-vincular-parametros';

export const columns: ColumnDef<Company>[] = [
	{
		accessorKey: 'ds_documento',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Documento' />,
		cell: ({ row }) => {
			return <span>{formatCnpjCpf(row.getValue('ds_documento'))}</span>;
		},
	},

	{
		accessorKey: 'ds_razao_social',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Razão Social' />,
	},
	{
		accessorKey: 'ds_fantasia',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome Fantasia' />,
	},
	{
		accessorKey: 'ds_cnae',
		header: ({ column }) => <DataTableColumnHeader column={column} title='CNAE' />,
	},
	{
		accessorKey: 'ds_uf',
		header: ({ column }) => <DataTableColumnHeader column={column} title='UF' />,
	},
	{
		accessorKey: 'is_ativo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			return (
				<Badge variant={row.getValue('is_ativo') ? 'success' : 'danger'} className='cursor-default'>
					{row.getValue('is_ativo') ? 'Ativo' : 'Inativo'}
				</Badge>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<div className='flex justify-end gap-1'>
					<BtnUsuariosEmpresa empresa={row.original} />
					<BtnSetModulosEmpresa empresa={row.original} />
					<BtnVincularParametros empresa={row.original} />
					<BtnHandleInsertAPI empresa={row.original} />
				</div>
			);
		},
	},
];
