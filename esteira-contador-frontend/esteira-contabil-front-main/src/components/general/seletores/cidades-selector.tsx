import { getCidades } from '@/services/api/sistema';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/layout/icons';
import { Check, MapPin } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function CidadesSelector({ onCityChange, defaultValue }: { onCityChange: (e: string) => void; defaultValue?: string }) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(defaultValue || '');
	const [search, setSearch] = useState(defaultValue || '');
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({
		page: 1,
		pageSize: 10,
		orderBy: 'asc',
		search: search,
	});

	const { data: cidades, isFetching } = useQuery({
		queryKey: ['get-cidades', pageParameters],
		queryFn: () => getCidades(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search, page: 1 }));
		}, 300);

		return () => clearTimeout(handler);
	}, [search]);

	const cidade = cidades?.cities.find((c: ESTEIRA.RAW.SisIgbeCity) => c.id.toString() === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between'>
					{isFetching ? 'Carregando...' : cidade ? cidade?.ds_city + ' - ' + cidade?.js_uf.ds_uf : 'Selecione uma cidade...'}
					{isFetching ? <Icons.spinner className='animate-spin' /> : <MapPin className='opacity-50' />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
				<Command shouldFilter={false}>
					<CommandInput
						onInput={(e) => {
							setSearch(e.currentTarget.value);
						}}
						placeholder='Pesquise a cidade...'
					/>
					<CommandList>
						<CommandEmpty>{isFetching ? 'Carregando...' : 'Nenhuma cidade encontrada.'}</CommandEmpty>
						<CommandGroup>
							{cidades?.cities.map((cidade: ESTEIRA.RAW.SisIgbeCity) => (
								<CommandItem
									key={cidade.id}
									value={cidade.id.toString()}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue);
										onCityChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
								>
									<Check className={cn('mr-2 h-4 w-4', value === cidade.id.toString() ? 'opacity-100' : 'opacity-0')} />
									{cidade.ds_city} - {cidade.js_uf.ds_uf}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
