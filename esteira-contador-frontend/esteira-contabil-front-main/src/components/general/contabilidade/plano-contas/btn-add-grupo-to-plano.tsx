import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useCompanyContext } from '@/context/company-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getGrupoContasByEmpresaID } from '@/services/api/grupo-contas';
import { PlanoConta } from '@/pages/contabilidade/plano-contas';
import { DataTableRef } from '@/components/ui/data-table';
import { linkPlanoGrupo } from '@/services/api/plano-contas';

type HandleInsertGrupoToPlanoProps = {
	open: boolean;
	pageParameters: {
		page: number;
		pageSize: number;
		orderBy: string;
		search: string;
		status: string | null;
	};
	onChange: () => void;
	onOpenChange: (open: boolean) => void;
	tableRef: React.RefObject<DataTableRef<PlanoConta> | null>;
};

export default function HandleInsertGrupoToPlano({
	open,
	onChange,
	onOpenChange,
	tableRef,
	pageParameters,
}: HandleInsertGrupoToPlanoProps) {
	const [popover, setPopover] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [selectedGrupo, setSelectedGrupo] = useState<string>('');

	const { data: grupos, isFetching } = useQuery<Array<{ id: string; ds_nome_grupo: string }>>({
		queryKey: ['get-grupo-contas', state],
		queryFn: () => getGrupoContasByEmpresaID(state),
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	async function handlePlanoChange(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			const selectedPlanos = tableRef.current?.getSelectedRows() || [];
			if (selectedPlanos.length === 0) {
				toast.error('Selecione pelo menos uma conta.');
				return;
			}
			const possuiTipoInvalido = selectedPlanos.some((plano) => plano.ds_tipo_cta !== 'A');
			if (possuiTipoInvalido) {
				toast.error('Selecione apenas contas Analíticas.');
				return;
			}
			toast.promise(
				(async () => {
					await linkPlanoGrupo(selectedPlanos, selectedGrupo);
					await queryClient.invalidateQueries({ queryKey: ['get-plano-contas-paginado', pageParameters, state] });
					tableRef.current?.clearSelectedRows();
				})(),
				{
					loading: 'Atualizando o grupo do(s) plano(s)...',
					success: () => `${selectedPlanos.length} plano(s) atualizado(s) com sucesso.`,
				},
			);
		} catch (error) {
			console.error('Error linking grupo to plano:', error);
			toast.error('Erro ao vincular grupo ao plano.');
		} finally {
			await onChange();
			setSelectedGrupo('');
			onOpenChange(false);
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Vincular Grupo</DialogTitle>
						<DialogDescription>Escolha o grupo que quer vincular.</DialogDescription>
					</DialogHeader>

					<form onSubmit={handlePlanoChange} className='grid gap-4'>
						<div className='grid gap-2'>
							<Label>Grupos de Contas</Label>
							<Popover modal={true} open={popover} onOpenChange={setPopover}>
								<PopoverTrigger asChild>
									<Button variant='outline' disabled={isFetching} role='combobox' aria-expanded={open} className='justify-between'>
										{selectedGrupo
											? grupos?.find((item) => item.id === selectedGrupo)?.ds_nome_grupo
											: isFetching
												? 'Carregando...'
												: 'Selecione um grupo...'}
										<ChevronsUpDown className='opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
									<Command>
										<CommandInput placeholder='Selecione um grupo...' />
										<CommandList>
											<CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
											<CommandGroup>
												{grupos?.map((g) => (
													<CommandItem
														key={g.id}
														value={g.id}
														onSelect={(currentValue) => {
															setSelectedGrupo(currentValue);
															setPopover(false);
														}}
													>
														{g.ds_nome_grupo}
														<Check className={cn('ml-auto', selectedGrupo === g.id ? 'opacity-100' : 'opacity-0')} />
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						<Button type='submit' className='w-full'>
							Adicionar Grupo de Contas
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
