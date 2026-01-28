import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { IntegrationType } from '@/pages/integracao/tipos'

export const getIntegrationTypeColumns = (): ColumnDef<IntegrationType>[] => [
  {
    accessorKey: 'ds_nome',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo de Integração' />
  },
  {
    accessorKey: 'dt_created',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Criado em' />,
    cell: ({ row }) => new Date(row.getValue('dt_created')).toLocaleDateString()
  },
  {
    accessorKey: 'dt_updated',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Atualizado em' />,
    cell: ({ row }) => new Date(row.getValue('dt_updated')).toLocaleDateString()
  }
]
