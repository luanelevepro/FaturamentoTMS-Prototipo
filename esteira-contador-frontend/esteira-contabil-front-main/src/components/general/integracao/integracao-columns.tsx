import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Integration } from '@/services/api/integracao';
import IntegrationConfigModal from './btn-insert-dados-integracao';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import HandleUpdateIntegracao from './btn-delete-integracao';

export const getIntegrationColumns = (): ColumnDef<Integration>[] => [
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Integração' />,
	},
	{
		accessorKey: 'ds_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
	},
	{
		id: 'tipo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo' />,
		accessorFn: (row) => row.js_tipo_integracao.ds_nome,
		cell: ({ row }) => <span>{row.getValue('tipo')}</span>,
	},
	{
		accessorKey: 'fl_is_para_escritorio',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Visibilidade' />,
		cell: ({ row }) => {
			const isOffice = row.getValue('fl_is_para_escritorio') as boolean;
			return <Badge variant='outline'>{isOffice ? 'Escritório' : 'Pública'}</Badge>;
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<div className='flex justify-end gap-2'>
					<HandleUpdateIntegracao integracaoId={row.original.id} />
					<IntegrationConfigModal integracaoId={row.original.id} is_view={true}>
						<Button tooltip='Visualizar' variant='ghost' size='icon'>
							<ArrowRight />
						</Button>
					</IntegrationConfigModal>
				</div>
			);
		},
	},
];
