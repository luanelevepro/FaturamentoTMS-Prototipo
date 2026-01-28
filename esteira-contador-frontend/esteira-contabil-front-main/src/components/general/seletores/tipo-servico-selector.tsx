import { getTiposServico } from '@/services/api/sistema';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/layout/icons';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { TipoServicoData } from '@/pages/cadastros/tipos-servico';

export function TipoServicoSelector({
	onChange,
	defaultValue,
	disabled,
}: {
	onChange: (e: string) => void;
	defaultValue?: string;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(defaultValue || '');

	const { data, isFetching } = useQuery({
		queryKey: ['get-tipos-servicos'],
		queryFn: getTiposServico,
		staleTime: 1000 * 60 * 5,
		enabled: open || (defaultValue !== undefined && defaultValue !== ''),
	});

	useEffect(() => {
		setValue(defaultValue || '');
	}, [defaultValue]);

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button variant='outline' disabled={disabled} role='combobox' aria-expanded={open} className='w-full justify-between truncate'>
					{isFetching
						? 'Carregando...'
						: value
							? data?.find((tipo: TipoServicoData) => tipo.id === value)?.ds_descricao
							: 'Selecione o tipo de serviço'}
					{isFetching ? <Icons.spinner className='animate-spin' /> : <ChevronDown className='opacity-50' />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
				<Command
					filter={(value, search) => {
						if (
							data
								?.find((t: TipoServicoData) => t.id === value)
								?.ds_descricao?.toLowerCase()
								.includes(search)
						)
							return 1;
						else if (
							data
								?.find((t: TipoServicoData) => t.id === value)
								?.ds_codigo?.toLowerCase()
								.includes(search)
						)
							return 1;
						return 0;
					}}
				>
					<CommandInput placeholder='Pesquise...' />
					<CommandList>
						<CommandEmpty>{isFetching ? 'Carregando...' : 'Nenhum tipo de serviço encontrado.'}</CommandEmpty>
						<CommandGroup>
							{data?.map((tipo: TipoServicoData) => (
								<CommandItem
									key={tipo.id}
									value={tipo.id}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue);
										onChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
								>
									<Check className={cn('mr-2 h-4 w-4', value === tipo.id ? 'opacity-100' : 'opacity-0')} />
									{tipo.ds_codigo} - {tipo.ds_descricao}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
