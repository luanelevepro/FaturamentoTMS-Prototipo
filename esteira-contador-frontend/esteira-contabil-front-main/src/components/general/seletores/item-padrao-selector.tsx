import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/layout/icons';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getPadraoSegmento } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';
import { ProdutosData } from '@/pages/fiscal/produtos';
import { ProdutoPadraoSegmentoData } from '@/pages/cadastros/itens-padroes';

export function ItemPadraoSelector({ onChange, defaultValue }: { onChange: (e: string, i: string) => void; defaultValue?: string }) {
	const { state } = useCompanyContext();
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(defaultValue || '');
	const [filteredData, setFilteredData] = useState<ProdutoPadraoSegmentoData[]>([]);

	const { data, isFetching } = useQuery({
		queryKey: ['get-itens-padroes-segmento', state],
		queryFn: getPadraoSegmento,
		staleTime: 1000 * 60 * 5,
		enabled: open || (defaultValue !== undefined && defaultValue !== ''),
	});

	useEffect(() => {
		if (data) {
			setFilteredData(data.filter((item: ProdutoPadraoSegmentoData) => item.id_sis_tipos_servico !== null));
		}
	}, [data]);

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
							? data?.find((item: ProdutosData) => item.id === value)?.ds_descricao
							: 'Selecione um item padrão'}
					{isFetching ? <Icons.spinner className='animate-spin' /> : <ChevronDown className='opacity-50' />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
				<Command
					filter={(value, search) => {
						if (
							data
								?.find((t: ProdutoPadraoSegmentoData) => t.id === value)
								?.ds_descricao?.toLowerCase()
								.includes(search)
						)
							return 1;
						return 0;
					}}
				>
					<CommandInput placeholder='Pesquise...' />
					<CommandList>
						<CommandEmpty>{isFetching ? 'Carregando...' : 'Nenhum item padrão encontrado.'}</CommandEmpty>
						<CommandGroup>
							{filteredData?.map((s: ProdutoPadraoSegmentoData) => (
								<CommandItem
									key={s.id}
									value={s.id}
									onSelect={(currentValue) => {
										setValue(currentValue === value ? '' : currentValue);
										onChange(currentValue === value ? '' : currentValue, s.id_sis_tipos_servico || '');
										setOpen(false);
									}}
								>
									<Check className={cn('mr-2 h-4 w-4', value === s.id ? 'opacity-100' : 'opacity-0')} />
									{s.ds_descricao}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
