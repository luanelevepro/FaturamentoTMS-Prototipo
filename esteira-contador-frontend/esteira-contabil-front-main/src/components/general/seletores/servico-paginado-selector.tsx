import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/layout/icons';
import { getProdutosEmpresasPaginado } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';
import { ProdutosData } from '@/pages/fiscal/produtos';

export function ServicoPaginadoSelector({ onChange, defaultValue }: { onChange: (e: string) => void; defaultValue?: string }) {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const [value, setValue] = useState(defaultValue || '');
	const [search, setSearch] = useState(defaultValue || '');
	const [pageParameters, setPageParameters] = useState({
		page: 1,
		pageSize: 10,
		orderBy: 'asc',
		orderColumn: '',
		search: search,
		tipo: 'servico',
		status: [],
		tipo_item: [],
	});

	const { data: servicos, isFetching } = useQuery({
		queryKey: ['get-servicos-paginado', pageParameters, state],
		queryFn: () => getProdutosEmpresasPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search, page: 1 }));
		}, 300);

		return () => clearTimeout(handler);
	}, [search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between truncate'>
					{isFetching
						? 'Carregando...'
						: value
							? servicos?.produtos.find((servico: ProdutosData) => servico.id === value)?.ds_nome
							: 'Selecione um serviço'}
					{isFetching ? <Icons.spinner className='animate-spin' /> : <ChevronDown className='opacity-50' />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
				<Command shouldFilter={false}>
					<CommandInput
						onInput={(e) => {
							setSearch(e.currentTarget.value);
						}}
						placeholder='Pesquise um serviço...'
					/>
					<CommandList>
						<CommandEmpty>{isFetching ? 'Carregando...' : 'Nenhum serviço encontrado.'}</CommandEmpty>
						<CommandGroup>
							{servicos?.produtos.map((servico: ProdutosData) => (
								<CommandItem
									key={servico.id}
									value={servico.id.toString()}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue);
										onChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
								>
									<Check className={cn('mr-2 h-4 w-4', value === servico.id.toString() ? 'opacity-100' : 'opacity-0')} />
									{servico.id_externo} - {servico.ds_nome}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
