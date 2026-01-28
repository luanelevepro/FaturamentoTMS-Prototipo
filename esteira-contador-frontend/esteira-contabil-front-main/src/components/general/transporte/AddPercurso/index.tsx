import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
/* import { InputWithLabel } from '@/pages/faturamento/Components/InputWithLabel';
import { InputDate } from '@/pages/faturamento/Components/InputDate';
import { SelectWithLabel } from '@/pages/faturamento/Components/SelectWithLabel'; */
import { SquarePlus } from 'lucide-react';
import { ObjTrip } from '../../../../pages/faturamento/transporte';

interface IProps {
	idViagem: ObjTrip;
}

export default function AddPercurso({ idViagem }: IProps) {
	const [open, setOpen] = useState(false);
	const cleanFilter = () => setOpen(false);
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		console.log('🚀 ~ handleSubmit:', data);
	};

	return (
		<Drawer open={open} onOpenChange={() => setOpen(true)} dismissible={false}>
			<DrawerTrigger asChild>
				<Button tooltip='Adicionar percurso' variant='ghost' size='icon'>
					<SquarePlus />
				</Button>
			</DrawerTrigger>
			<DrawerContent className='top-0 !mt-0 !rounded-none [&>div.bg-muted]:hidden'>
				<form id='form-vehicle' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-sm'>Adicionar percurso</p>
									<p className='text-start text-xl font-semibold'>{idViagem.id}</p>
								</div>
								<div className='flex gap-4'>
									<Button variant='outline' color='red' onClick={cleanFilter}>
										Cancelar
									</Button>

									<Button>Finalizar</Button>
								</div>
							</div>
							<DrawerDescription></DrawerDescription>
						</DrawerTitle>
					</DrawerHeader>
					<div className='px-8 py-3'>
						<h1 className='bg-red-500'>Form</h1>
						{/* <InputWithLabel id='placa' label='Placa' placeholder='Digite a placa' required />
						<InputWithLabel id='frota' label='Número da Frota' placeholder='Digite o número da frota' />
						<InputDate id='aquisicao' label='Data da aquisição' placeholder='--/--/----' />
						<InputDate id='cancelamento' label='Data do cancelamento' placeholder='--/--/----' />
						<SelectWithLabel
							id='tipo'
							label='Tipo do veículo'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Carro', value: 'carro' },
								{ text: 'Caminhão', value: 'caminhao' },
							]}
							required
						/> */}
						{/* 	linha dois */}
					</div>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
