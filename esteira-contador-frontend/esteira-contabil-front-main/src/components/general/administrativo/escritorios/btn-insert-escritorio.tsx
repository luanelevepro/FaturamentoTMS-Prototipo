import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Icons } from '@/components/layout/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmpresas } from '@/services/api/empresas';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Company } from '@/pages/administracao/empresas';
import { setAsEscritorio } from '@/services/api/sistema';
import { toast } from 'sonner';

export default function HandleInsertEscritorio({ children, onChange }: { children: React.ReactNode; onChange: () => void }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [popover, setPopover] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [value, setValue] = useState('');

	const { data: companies, isFetching } = useQuery({
		queryKey: ['get-all-empresas'],
		queryFn: getEmpresas,
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	const sendConfirmation = async () => {
		setIsLoading(true);
		try {
			await setAsEscritorio(value);
			toast.success('Empresa atualizada com sucesso.');
			queryClient.invalidateQueries({ queryKey: ['get-all-empresas'] });
			setValue('');
			setOpen(false);
		} catch (error) {
			console.error('Error updating:', error);
			toast.error('Erro ao atualizar.');
		} finally {
			setIsLoading(false);
		}

		onChange();
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		sendConfirmation();
	};

	function handleModalOpenChange(isOpen: boolean) {
		setOpen(isOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleModalOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Novo escritório</DialogTitle>
					<DialogDescription>Selecione uma empresa para transformar em escritório.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<Popover modal={true} open={popover} onOpenChange={setPopover}>
						<PopoverTrigger asChild>
							<Button variant='outline' disabled={isFetching} role='combobox' aria-expanded={open} className='justify-between'>
								{value
									? companies.find((empresa: Company) => empresa.id === value)?.ds_fantasia
									: isFetching
										? 'Carregando...'
										: 'Selecione uma empresa...'}
								<ChevronsUpDown className='opacity-50' />
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
							<Command
								filter={(value, search) => {
									if (
										companies
											.find((company: Company) => company.id === value)
											?.ds_fantasia?.toLowerCase()
											.includes(search)
									)
										return 1;

									return 0;
								}}
							>
								<CommandInput placeholder='Selecione uma empresa...' />
								<CommandList>
									<CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
									<CommandGroup>
										{companies?.map((empresa: Company) => (
											<CommandItem
												key={empresa.id}
												value={empresa.id}
												onSelect={(currentValue) => {
													setValue(currentValue === value ? '' : currentValue);
													setPopover(false);
												}}
											>
												{empresa.ds_fantasia}
												<Check className={cn('ml-auto', value === empresa.id ? 'opacity-100' : 'opacity-0')} />
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					<Button type='submit' onClick={handleSubmit} disabled={isFetching || isLoading} className='w-full'>
						{isLoading ? 'Confirmando...' : 'Confirmar'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
