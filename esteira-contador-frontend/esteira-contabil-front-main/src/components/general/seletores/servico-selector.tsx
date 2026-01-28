import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/layout/icons';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getServicosEmpresas } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';
import { ProdutosData } from '@/pages/fiscal/produtos';

export function ServicoSelector({ onChange, defaultValue }: { onChange: (e: string) => void; defaultValue?: string }) {
	const { state } = useCompanyContext();
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(defaultValue || '');

	const { data, isFetching } = useQuery({
		queryKey: ['get-servicos-empresa', state],
		queryFn: getServicosEmpresas,
		staleTime: 1000 * 60 * 5,
		enabled: open || (defaultValue !== undefined && defaultValue !== ''),
	});

	useEffect(() => {
		setValue(defaultValue || '');
	}, [defaultValue]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between truncate'>
					{isFetching
						? 'Carregando...'
						: value
							? data?.find((tipo: ProdutosData) => tipo.id === value)?.ds_nome
							: 'Selecione um serviço'}
					{isFetching ? <Icons.spinner className='animate-spin' /> : <ChevronDown className='opacity-50' />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
				<Command
					filter={(value, search) => {
						if (
							data
								?.find((t: ProdutosData) => t.id === value)
								?.ds_nome?.toLowerCase()
								.includes(search)
						)
							return 1;
						else if (
							data
								?.find((t: ProdutosData) => t.id === value)
								?.id_externo?.toLowerCase()
								.includes(search)
						)
							return 1;
						return 0;
					}}
				>
					<CommandInput placeholder='Pesquise...' />
					<CommandList>
						<CommandEmpty>{isFetching ? 'Carregando...' : 'Nenhum serviço encontrado.'}</CommandEmpty>
						<CommandGroup>
							{data?.map((s: ProdutosData) => (
								<CommandItem
									key={s.id}
									value={s.id}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue);
										onChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
								>
									<Check className={cn('mr-2 h-4 w-4', value === s.id ? 'opacity-100' : 'opacity-0')} />
									{s.id_externo} - {s.ds_nome}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
