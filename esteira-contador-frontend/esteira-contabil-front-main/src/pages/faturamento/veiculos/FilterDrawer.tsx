import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListFilter } from 'lucide-react';
import { IFilterVehicles } from '.';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface IProps {
	filter?: IFilterVehicles;
	setFilter?: (x: IFilterVehicles) => void;
	children: ReactNode;
}

export default function FilterDrawer({ filter, setFilter, children }: IProps) {
	const [open, setOpen] = useState(false);

	const cleanFilter = () => {
		setOpen(false);
	};
	console.log('TCL: FilterDrawer -> filter, setFilter', filter, setFilter);

	return (
		<Drawer direction='right' open={open} onOpenChange={() => setOpen(true)}>
			<DrawerTrigger asChild>
				<Button tooltip='Filtros' variant='outline'>
					<ListFilter />
					<p>Filtros</p>
				</Button>
			</DrawerTrigger>
			<DrawerContent className='w-full max-w-[608px] rounded-l-4xl'>
				<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
					<DrawerTitle>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<ListFilter size={20} />
								<p className='text-xl font-semibold'>Filtros</p>
							</div>
							<div className='flex gap-4'>
								<Button variant='outline' onClick={() => setOpen(false)}>
									Fechar
								</Button>
								<Button variant='outline' color='red' onClick={cleanFilter}>
									Limpar filtros
								</Button>

								<Button>Salvar</Button>
							</div>
						</div>
						<DrawerDescription></DrawerDescription>
					</DrawerTitle>
				</DrawerHeader>
				<div className='px-8 py-10'>{children}</div>
			</DrawerContent>
		</Drawer>
	);
}
