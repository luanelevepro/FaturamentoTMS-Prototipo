import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { RegraNfe } from '@/pages/fiscal/entradas/regras-nfe';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BtnEditRegra from '@/components/general/fiscal/entradas/regras-nfe/btn-edit-regra';
import BtnDeleteRegra from '@/components/general/fiscal/entradas/regras-nfe/btn-delete-regra';
import { CircleAlert, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { duplicateRegraNfe } from '@/services/api/regras-nfe';
import { toast } from 'sonner';

function RegraActions({
	regra,
	currentCompanyId,
	onDuplicated,
	onDeleted,
}: {
	regra: RegraNfe;
	currentCompanyId?: string;
	onDuplicated?: () => void;
	onDeleted?: () => void;
}) {
	const isRegraFromDifferentCompany =
		regra.fis_empresas?.id_sis_empresas && currentCompanyId && regra.fis_empresas.id_sis_empresas !== currentCompanyId;

	const [isDuplicating, setIsDuplicating] = useState(false);

	return (
		<div className='flex justify-end gap-2'>
			{isRegraFromDifferentCompany ? (
				<Button className='text-muted-foreground' variant='ghost' size='icon' tooltip='Regra Padrão'>
					<CircleAlert className='h-4 w-4' />
				</Button>
			) : (
				<>
					<Button
						variant='ghost'
						size='icon'
						tooltip={isDuplicating ? 'Duplicando...' : 'Duplicar Regra'}
						disabled={isDuplicating}
						onClick={async () => {
							try {
								setIsDuplicating(true);
								await duplicateRegraNfe(String(regra.id));
								toast.success('Regra duplicada com sucesso');
								onDuplicated?.();
							} catch (error) {
								toast.error(`Erro ao duplicar regra: ${String(error)}`);
							} finally {
								setIsDuplicating(false);
							}
						}}
					>
						{isDuplicating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Copy className='h-4 w-4' />}
					</Button>
					<BtnEditRegra regra={regra} />
					<BtnDeleteRegra id={regra.id} onDeleted={onDeleted} />
				</>
			)}
		</div>
	);
}

export function getColumns(currentCompanyId?: string, opts?: { onDuplicated?: () => void; onDeleted?: () => void }): ColumnDef<RegraNfe>[] {
	return [
		{
			accessorKey: 'ds_descricao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
			cell: ({ row }) => row.getValue('ds_descricao'),
		},
		{
			accessorKey: 'dt_vigencia',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Data de Vigência' />,
			cell: ({ row }) => {
				const dateRaw = row.getValue('dt_vigencia') as string | Date | undefined | null;
				if (!dateRaw) return '—';
				let dateObj: Date;
				if (typeof dateRaw === 'string') {
					const datePrefixMatch = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
					if (datePrefixMatch) {
						const y = Number(datePrefixMatch[1]);
						const m = Number(datePrefixMatch[2]) - 1;
						const d = Number(datePrefixMatch[3]);
						dateObj = new Date(y, m, d);
					} else {
						dateObj = new Date(dateRaw);
					}
				} else if (dateRaw instanceof Date) {
					dateObj = new Date(dateRaw.getFullYear(), dateRaw.getMonth(), dateRaw.getDate());
				} else {
					dateObj = new Date(String(dateRaw));
					dateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
				}
				return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
			},
		},
		{
			accessorKey: 'ds_origem_uf',
			header: ({ column }) => <DataTableColumnHeader column={column} title='UF Origem' />,
			cell: ({ row }) => (
				<Badge variant='outline' className='font-mono'>
					{row.getValue('ds_origem_uf')}
				</Badge>
			),
		},
		{
			accessorKey: 'ds_destino_uf',
			header: ({ column }) => <DataTableColumnHeader column={column} title='UF Destino' />,
			cell: ({ row }) => (
				<Badge variant='outline' className='font-mono'>
					{row.getValue('ds_destino_uf')}
				</Badge>
			),
		},
		{
			accessorKey: 'fis_segmentos.ds_descricao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Segmento' />,
			cell: ({ row }) => {
				const { fis_segmentos } = row.original;
				return fis_segmentos?.ds_descricao ?? 'Sem segmento';
			},
		},
		{
			accessorKey: 'sis_regime_tributario.ds_descricao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Regime Destinatário' />,
			cell: ({ row }) => {
				const { sis_regime_tributario } = row.original;
				return sis_regime_tributario?.ds_descricao ?? 'Não definido';
			},
		},
		{
			accessorKey: 'sis_regime_tributario_emit.ds_descricao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Regime Emitente' />,
			cell: ({ row }) => {
				const { sis_regime_tributario_emit } = row.original;
				return sis_regime_tributario_emit?.ds_descricao ?? 'Não definido';
			},
		},
		{
			accessorKey: 'sis_cfop_gerado',
			header: ({ column }) => <DataTableColumnHeader column={column} title='CFOP Gerado' />,
			cell: ({ row }) => {
				const { sis_cfop_gerado } = row.original as RegraNfe;
				return sis_cfop_gerado ? (
					<div className='flex flex-col'>
						<span className='font-mono text-sm'>{sis_cfop_gerado.ds_codigo}</span>
						<span className='text-muted-foreground max-w-[200px] truncate text-xs'>{sis_cfop_gerado.ds_descricao}</span>
					</div>
				) : (
					'Não definido'
				);
			},
		},
		{
			accessorKey: 'sis_cst_gerado',
			header: ({ column }) => <DataTableColumnHeader column={column} title='CST Gerado' />,
			cell: ({ row }) => {
				const { sis_cst_gerado } = row.original as RegraNfe;
				if (sis_cst_gerado) {
					return (
						<div className='flex flex-col'>
							<span className='font-mono text-sm'>{sis_cst_gerado.ds_codigo}</span>
							<span className='text-muted-foreground max-w-[200px] truncate text-xs'>{sis_cst_gerado.ds_descricao}</span>
						</div>
					);
				}
				// When no sis_cst_gerado is provided, treat it as "Manter CST da nota"
				return (
					<div className='flex flex-col'>
						<span className='font-mono text-sm'>Manter CST da nota</span>
						<span className='text-muted-foreground max-w-[200px] truncate text-xs'>Manter o CST presente na nota</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'js_ncm_produto',
			header: ({ column }) => <DataTableColumnHeader column={column} title='NCM Produtos' />,
			cell: ({ row }) => {
				const ncms = row.getValue('js_ncm_produto') as number[];
				return ncms && ncms.length > 0 ? (
					<div className='flex flex-wrap gap-1'>
						{ncms.slice(0, 3).map((ncm, index) => (
							<Badge key={index} variant='secondary' className='text-xs'>
								{ncm}
							</Badge>
						))}
						{ncms.length > 3 && (
							<Badge variant='outline' className='text-xs'>
								+{ncms.length - 3}
							</Badge>
						)}
					</div>
				) : (
					'Nenhum NCM'
				);
			},
		},
		{
			accessorKey: 'js_origem_trib',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Origens CST' />,
			cell: ({ row }) => {
				const origens = row.original.js_origem_trib;
				return origens && origens.length > 0 ? (
					<div className='flex flex-wrap gap-1'>
						{origens.slice(0, 2).map((origem, index) => (
							<Badge key={index} variant='secondary' className='text-xs'>
								{origem.sis_origem_cst?.ds_codigo}
							</Badge>
						))}
						{origens.length > 2 && (
							<Badge variant='outline' className='text-xs'>
								+{origens.length - 2}
							</Badge>
						)}
					</div>
				) : (
					'Nenhuma origem'
				);
			},
		},
		{
			accessorKey: 'js_tipos_produto',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tipos Produto' />,
			cell: ({ row }) => {
				const tipos = row.original.js_tipos_produto;
				return tipos && tipos.length > 0 ? (
					<div className='flex flex-wrap gap-1'>
						{tipos.slice(0, 2).map((tipo, index) => (
							<Badge key={index} variant='secondary' className='text-xs'>
								{tipo.sis_tipos_produto?.ds_codigo}
							</Badge>
						))}
						{tipos.length > 2 && (
							<Badge variant='outline' className='text-xs'>
								+{tipos.length - 2}
							</Badge>
						)}
					</div>
				) : (
					'Nenhum tipo'
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<RegraActions
					regra={row.original}
					currentCompanyId={currentCompanyId}
					onDuplicated={opts?.onDuplicated}
					onDeleted={opts?.onDeleted}
				/>
			),
		},
		// {
		// 	id: 'actions',
		// 	cell: ({ row }) => {
		// 		const regra = row.original;
		// 		return (
		// 			<div className='flex justify-end gap-2'>
		// 				{/* <HandleUpdateRegra data={row.original} onChange={() => refetch()}>
		// 					<Button tooltip='Editar' variant='ghost' size='icon'>
		// 						<Pencil />
		// 					</Button>
		// 				</HandleUpdateRegra>
		// 				<HandleDelete regra={row.original} />
		// 				<div className='flex justify-end gap-2'>
		// 					<HandleDeactivateRegra regra={regra} />
		// 				</div> */}
		// 			</div>
		// 		);
		// 	},
		// },
	];
}
