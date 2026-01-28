import * as React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Button } from './button';

interface CompanyFilterProps {
	companies: { id: string; ds_fantasia: string }[];
	initialSelectedIds?: string[];
	onChange?: (ids: string[]) => void;
}

export function CompanyFilter({ companies, initialSelectedIds = [], onChange }: CompanyFilterProps) {
	const [open, setOpen] = React.useState(false);
	const [selectedIds, setSelectedIds] = React.useState<string[]>(initialSelectedIds);
	const [search, setSearch] = React.useState('');

	React.useEffect(() => {
		onChange?.(selectedIds);
	}, [selectedIds, onChange]);

	const toggle = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	const selected = companies.filter((c) => selectedIds.includes(c.id));
	const total = companies.length;
	const label =
		selected.length === 0
			? 'Nenhuma empresa'
			: selected.length === total
				? 'Todas as empresas'
				: selected.length === 1
					? selected[0].ds_fantasia
					: `${selected.length} selecionadas`;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<div className='flex flex-col space-y-1'>
				{/* trigger como pill */}
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						size='sm'
						className='inline-flex h-6 items-center gap-1 rounded-full px-2 focus:ring-2 focus:ring-red-500'
					>
						{/* bullet */}
						<span className='block h-2 w-2 rounded-full bg-black dark:bg-white' />
						<span className='text-sm tracking-tight'>{label}</span>
						<ChevronsUpDown className='h-4 w-4 stroke-current' />
					</Button>
				</PopoverTrigger>

				{/* legenda */}
				{/* <span className='text-xs text-gray-400'>Filtro de Empresas</span> */}
			</div>

			{/* popover de seleção */}
			<PopoverContent side='bottom' align='start' className='w-64 p-0'>
				<Command>
					<CommandInput placeholder='Pesquisar empresas...' value={search} onValueChange={setSearch} />
					<CommandList>
						<CommandEmpty>Nenhum resultado.</CommandEmpty>
						<CommandGroup>
							{companies
								.filter((c) => c.ds_fantasia.toLowerCase().includes(search.toLowerCase()))
								.map((c) => (
									<CommandItem key={c.id} onSelect={() => toggle(c.id)} className='flex items-center justify-between px-2 py-1'>
										<span>{c.ds_fantasia}</span>
										{selectedIds.includes(c.id) && <span className='text-green-500'>✓</span>}
									</CommandItem>
								))}
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup>
							<CommandItem
								onSelect={() => {
									// seleciona todos os IDs
									setSelectedIds(companies.map((c) => c.id));
									setSearch('');
								}}
								className='px-2 py-1 text-sm hover:bg-gray-100'
							>
								Selecionar todos os registros
							</CommandItem>
							<CommandItem
								onSelect={() => {
									setSelectedIds([]);
									setSearch(''); // reseta também a busca, opcional
								}}
								className='px-2 py-1 text-sm text-red-500 hover:bg-red-50'
							>
								Limpar seleção
							</CommandItem>
						</CommandGroup>

						<CommandSeparator />
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
