import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Funcionario } from '@/pages/recursos-humanos/funcionarios';
import { Badge } from '@/components/ui/badge';

export const getFuncionarioColumns = (): ColumnDef<Funcionario>[] => [
	{
		accessorKey: 'id_externo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'ds_situacao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Situação' />,
		cell: ({ row }) => {
			const situacao = row.getValue('ds_situacao');

			// cor dos badges
			const situacaoEstilos = {
				Trabalhando: 'bg-green-200 text-green-950 border-green-300 ',
				Férias: 'bg-yellow-200 text-yellow-950 border-yellow-300',
				Afastado: 'bg-orange-200 text-orange-950 border-orange-300',
				Demitido: 'bg-red-200 text-red-950 border-red-300',
			};

			return (
				<Badge variant={'outline'} className={`cursor-default text-white ${situacaoEstilos[situacao as keyof typeof situacaoEstilos]}`}>
					{situacao as string}
				</Badge>
			);
		},
	},
	{
		id: 'departamento',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Departamento' />,
		accessorFn: (row) => row.rh_departamento?.ds_nome || 'Sem Departamento',
		cell: ({ row }) => <span>{row.getValue('departamento')}</span>,
	},
	{
		id: 'centro_custos',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Centro de Custos' />,
		accessorFn: (row) => row.rh_centro_custos?.ds_nome || 'Sem Centro de Custos',
		cell: ({ row }) => <span>{row.getValue('centro_custos')}</span>,
	},
	{
		accessorKey: 'ds_jornada_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Jornada' />,
	},
	{
		id: 'cargo_nivel',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Cargo' />,
		accessorFn: (row) => {
			const cargo = row.rh_cargos?.ds_nome || 'Sem Cargo';

			return `${cargo}`;
		},
		cell: ({ row }) => <span>{row.getValue('cargo_nivel')}</span>,
	},
];
