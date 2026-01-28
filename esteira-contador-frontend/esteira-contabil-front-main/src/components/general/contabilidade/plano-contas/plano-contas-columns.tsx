import { ColumnDef } from '@tanstack/react-table';
import { PlanoConta } from '@/pages/contabilidade/plano-contas';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';

export const columns: ColumnDef<PlanoConta>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />
		),
	},
	{
		accessorKey: 'ds_classificacao_cta',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Classificação da Conta' />,
		cell: ({ row }) => {
			const codigo = row.getValue<string>('ds_classificacao_cta') || '';
			const nivel = codigo.length;
			const margemPx = (nivel - 1) * 8;
			return <div style={{ marginLeft: `${margemPx}px` }}>{codigo}</div>;
		},
	},
	{
		accessorKey: 'ds_nome_cta',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome da Conta' />,
		cell: ({ row }) => row.getValue('ds_nome_cta'),
	},
	{
		accessorKey: 'ds_tipo_cta',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo da Conta' />,
		cell: ({ row }) => row.getValue('ds_tipo_cta'),
	},
	{
		id: 'id_grupo_contas',
		accessorKey: 'con_grupo_contas.ds_nome_grupo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Indicador de Grupo' />,
		cell: ({ row }) => {
			const { js_con_grupo_contas } = row.original;
			return js_con_grupo_contas?.ds_nome_grupo ?? 'Sem tipo';
		},
	},
	{
		accessorKey: 'is_ativo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			return (
				<Badge variant={row.getValue('is_ativo') ? 'success' : 'destructive'} className='cursor-default'>
					{row.getValue('is_ativo') ? 'Ativo' : 'Inativo'}
				</Badge>
			);
		},
	},
];
