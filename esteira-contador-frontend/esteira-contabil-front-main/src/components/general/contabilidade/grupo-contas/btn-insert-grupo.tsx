import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useCompanyContext } from '@/context/company-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTipoGrupoByEmpresaID } from '@/services/api/tipo-grupo';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createGrupoContas } from '@/services/api/grupo-contas';

type GrupoContas = {
	ds_nome_grupo?: string | null;
	ds_classificacao_grupo?: string | null;
	ds_tipo?: string | null;
	is_ativo?: boolean | null;
	con_tipo_grupo?: {
		ds_nome_tipo?: string | null;
	};
};

type GrupoContasWithTipoGrupo = GrupoContas & {
	id_tipo_grupo?: string;
	id_con_empresas?: string;
};

type HandleInsertGrupoProps = {
	children: React.ReactNode;
	onChange: () => void;
	data?: GrupoContasWithTipoGrupo;
};

export default function HandleInsertGrupo({ children, onChange, data }: HandleInsertGrupoProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const { state } = useCompanyContext();
	const { ...rest } = data ?? {};
	const [popover, setPopover] = useState(false);
	const [information, setInformation] = useState<GrupoContas>(
		rest ?? {
			ds_nome_grupo: '',
			ds_classificacao_grupo: '',
			ds_tipo: '',
			is_ativo: true,
			con_tipo_grupo: {
				ds_nome_tipo: null,
			},
		},
	);
	const [selectedTipoGrupo, setSelectedTipoGrupo] = useState<string>('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	/**
	 * Const para formatar a classificação do grupo, limitando para o máximo de 9.9.9 por meio de regra de negócio.
	 * Funcionamento {
	 *	Entrada: 311 -> Saída: 3.1.1;
	 *	ou
	 *	Entrada 25 -> Saída: 2.5;
	 *  }
	 * @param value - Valor digitado pelo usuário(string)
	 * @returns Valor formatado no padrão "x.x.x"
	 */
	const patternMask = (value: string) => {
		const digits = value.replace(/\D/g, '');
		return digits.replace(/^(\d{1})(\d)/, '$1.$2').replace(/^(\d{1})\.(\d{1})(\d).*/, '$1.$2.$3');
	};

	const { data: tipos, isFetching } = useQuery({
		queryKey: ['get-tipo-grupo', state],
		queryFn: () => getTipoGrupoByEmpresaID(),
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});
	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		if (!selectedTipoGrupo) {
			newErrors.id_tipo_grupo = 'Campo obrigatório.';
			toast.error('Selecione um tipo de grupo.');
		}
		if (!information.ds_nome_grupo) newErrors.ds_nome_grupo = 'Campo obrigatório.';
		if (!information.ds_classificacao_grupo) newErrors.ds_classificacao_grupo = 'Campo obrigatório.';
		if (!information.ds_tipo) newErrors.ds_tipo = 'Campo obrigatório.';
		return newErrors;
	};

	const createNewGrupo = async () => {
		setIsLoading(true);
		setErrors({});

		const validationErrors = validateFields();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsLoading(false);
			return;
		}
		try {
			await createGrupoContas(state, information, selectedTipoGrupo);
			toast.success('Grupo adicionado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-grupo-contas', state] });
			await queryClient.invalidateQueries({ queryKey: ['get-plano-contas', state] });
			setOpen(false);
			onChange();
		} catch (error) {
			console.error('Error inserting:', error);
			toast.error('Erro ao adicionar grupo.');
		} finally {
			setIsLoading(false);
			setInformation({
				ds_nome_grupo: '',
				ds_classificacao_grupo: '',
				ds_tipo: '',
				con_tipo_grupo: {
					ds_nome_tipo: '',
				},
			});
			setSelectedTipoGrupo('');
			setOpen(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewGrupo();
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Novo Grupo</DialogTitle>
						<DialogDescription>Insira os dados do novo grupo.</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='grid gap-4'>
						<div className='grid gap-2'>
							<Label>Nome do Grupo</Label>
							<Input
								id='ds_nome_grupo'
								type='text'
								placeholder='Digite o nome do grupo'
								value={information.ds_nome_grupo || ''}
								onChange={(e) => setInformation({ ...information, ds_nome_grupo: e.target.value })}
								disabled={isLoading}
							/>
							{errors.ds_nome_grupo && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_nome_grupo}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label>Classificação do Grupo</Label>
							<Input
								id='ds_classificacao_grupo'
								type='text'
								placeholder='Digite a classificação do grupo'
								value={information.ds_classificacao_grupo || ''}
								onChange={(e) => {
									const masked = patternMask(e.target.value);
									setInformation({ ...information, ds_classificacao_grupo: masked });
								}}
								disabled={isLoading}
							/>
							{errors.ds_classificacao_grupo && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_classificacao_grupo}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label>Tipo do grupo</Label>
							<Input
								id='ds_tipo'
								type='text'
								placeholder='Digite o tipo (A/S)'
								value={information.ds_tipo || ''}
								onChange={(e) => {
									const valor = e.target.value.toUpperCase();
									if (valor === 'A' || valor === 'S' || valor === '') {
										setInformation({ ...information, ds_tipo: valor });
									}
								}}
								disabled={isLoading}
							/>
							{errors.ds_tipo && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_tipo}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label>Tipo de Grupo</Label>
							<Popover modal={true} open={popover} onOpenChange={setPopover}>
								<PopoverTrigger asChild>
									<Button
										id='id_tipo_grupo'
										variant='outline'
										disabled={isFetching || isLoading}
										role='combobox'
										aria-expanded={open}
										className='justify-between'
									>
										{selectedTipoGrupo
											? tipos?.find((item: { id: string; ds_nome_tipo: string }) => item.id === selectedTipoGrupo)?.ds_nome_tipo
											: isFetching
												? 'Carregando...'
												: 'Selecione um tipo...'}
										<ChevronsUpDown className='opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
									<Command>
										<CommandInput placeholder='Selecione um tipo...' />
										<CommandList>
											<CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
											<CommandGroup>
												{tipos?.map((g: { id: string; ds_nome_tipo: string }) => (
													<CommandItem
														key={g.id}
														value={g.id!}
														onSelect={(currentValue) => {
															setSelectedTipoGrupo(currentValue);
															setPopover(false);
														}}
													>
														{g.ds_nome_tipo}
														<Check className={cn('ml-auto', selectedTipoGrupo === g.id ? 'opacity-100' : 'opacity-0')} />
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						<Button type='submit' disabled={isLoading} className='w-full'>
							{isLoading ? 'Adicionando...' : 'Adicionar Grupo de Contas'}
							{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
