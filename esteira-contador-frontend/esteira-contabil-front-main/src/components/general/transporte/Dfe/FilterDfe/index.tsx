import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IDfesParams, typeDfe } from '@/interfaces';
import { ListFilter } from 'lucide-react';

interface IProps {
	filter: IDfesParams;
	setFilter: (filter: IDfesParams) => void;
}

type NewDFeStatus = 'PENDENTE' | 'VINCULADO' | 'PROCESSADO' | 'CANCELADO';

const statusOptions: NewDFeStatus[] = ['PENDENTE', 'VINCULADO', 'PROCESSADO', 'CANCELADO'];

const typeOptions = [
	{ title: 'NFE', value: 'nfe' },
	{ title: 'NFSE', value: 'nfse' },
	{ title: 'CTE', value: 'cte' },
];

export default function FilterDfe({ filter, setFilter }: IProps) {
	const [activeTab, setActiveTab] = useState<'status' | 'tipos'>('status');
	const [selectedStatus, setSelectedStatus] = useState<NewDFeStatus[]>(
		Array.isArray(filter.situacao) ? filter.situacao : filter.situacao ? [filter.situacao] : [],
	);

	const handleStatusToggle = (status: NewDFeStatus, checked: boolean) => {
		const newSelectedStatus = checked ? [...selectedStatus, status] : selectedStatus.filter((s) => s !== status);

		setSelectedStatus(newSelectedStatus);
		setFilter({
			...filter,
			situacao:
				newSelectedStatus.length === 0
					? undefined
					: newSelectedStatus.length === 1
						? newSelectedStatus[0]
						: (newSelectedStatus as NewDFeStatus[]),
		});
	};

	const handleTypeToggle = (typeValue: string, checked: boolean) => {
		if (checked) {
			setFilter({
				...filter,
				type: typeValue as typeDfe,
			});
		} else {
			setFilter({
				...filter,
				type: undefined as typeDfe,
			});
		}
	};

	const handleClearFilters = () => {
		setSelectedStatus([]);
		setFilter({
			...filter,
			type: undefined as typeDfe,
			situacao: undefined,
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='icon' tooltip='Filtrar'>
					<ListFilter className='h-4 w-4' />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align='end' className='w-64 p-0'>
				<div className='flex flex-col'>
					<div className='flex border-b'>
						<button
							type='button'
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setActiveTab('status');
							}}
							className={`flex-1 px-3 py-2 text-sm ${activeTab === 'status' ? 'border-b-2 font-medium' : 'text-muted-foreground'}`}
						>
							Status
						</button>
						<button
							type='button'
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setActiveTab('tipos');
							}}
							className={`flex-1 px-3 py-2 text-sm ${activeTab === 'tipos' ? 'border-b-2 font-medium' : 'text-muted-foreground'}`}
						>
							Tipos
						</button>
					</div>

					{/* Conteúdo da aba */}
					<div className='p-2'>
						{activeTab === 'status' ? (
							<>
								<DropdownMenuLabel>Filtrar Status</DropdownMenuLabel>
								<DropdownMenuSeparator />

								<div className='max-h-64 overflow-auto pr-1'>
									{statusOptions.map((status) => (
										<DropdownMenuItem
											key={`status-${status}`}
											onSelect={(e) => e.preventDefault()}
											className='flex items-center gap-2'
										>
											<Checkbox
												checked={selectedStatus.includes(status)}
												onCheckedChange={(checked) => {
													handleStatusToggle(status, checked as boolean);
												}}
											/>
											<span>{status}</span>
										</DropdownMenuItem>
									))}
								</div>
							</>
						) : (
							<>
								<DropdownMenuLabel>Filtrar Tipos</DropdownMenuLabel>
								<DropdownMenuSeparator />

								<div className='max-h-64 overflow-auto pr-1'>
									{typeOptions.map((opt) => (
										<DropdownMenuItem
											key={`type-${opt.value}`}
											onSelect={(e) => e.preventDefault()}
											className='flex items-center gap-2'
										>
											<Checkbox
												checked={filter.type === opt.value}
												onCheckedChange={(checked) => {
													handleTypeToggle(opt.value, checked as boolean);
												}}
											/>
											<span>{opt.title}</span>
										</DropdownMenuItem>
									))}
								</div>
							</>
						)}

						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								handleClearFilters();
							}}
							className='hover:bg-background text-red-600'
						>
							Limpar todos os filtros
						</DropdownMenuItem>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
