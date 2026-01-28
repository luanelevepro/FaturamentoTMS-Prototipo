import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SquarePlus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { InputWithLabel } from '@/components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '@/components/general/faturamento/SelectWithLabel';

export default function RegisterApolice() {
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
				<Button>
					<SquarePlus />
					Cadastrar
				</Button>
			</DrawerTrigger>
			<DrawerContent className='top-0 !mt-0 !rounded-none [&>div.bg-muted]:hidden'>
				<form id='form-vehicle' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-start text-sm'>Cadastrar</p>
									<p className='text-xl font-semibold'>Apólice de Seguros</p>
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

					<div className='grid max-h-[calc(100dvh-80px)] grid-cols-2 gap-4 overflow-y-auto px-8 pt-10 lg:grid-cols-4'>
						{/* 	linha um */}
						<InputWithLabel id='nome' required label='Nome da apólice' placeholder='Digite o nome da apólice' />
						<SelectWithLabel
							id='seguradora'
							label='Seguradora'
							placeholder='Selecione uma seguradora'
							options={[
								{ text: 'Seguradora-1', value: 'Seguradora-1' },
								{ text: 'Seguradora-2', value: 'Seguradora-2' },
							]}
							required
						/>
						<SelectWithLabel
							id='reponsavel'
							label='Responsável'
							placeholder='Selecione uma responsável'
							options={[
								{ text: 'Responsavel-1', value: 'Responsavel-1' },
								{ text: 'Responsavel-2', value: 'Responsavel-2' },
							]}
							required
						/>
						<InputWithLabel id='numeroApolice' required label='Número da apólice' placeholder='Digite o número da apólice' />
						{/* 	linha dois */}
						<InputWithLabel id='obs' label='Observação' placeholder='Digite o número da apólice' className='col-span-4' />

						{/* linha três */}
					</div>
					<h6 className='text-foreground py-6 pl-8 font-medium'>Paramêtros de Averbação</h6>
					<div className='flex gap-4 px-8'>
						<SelectWithLabel
							id='empresa'
							className='max-w-[564px]'
							label='Empresa'
							placeholder='Selecione uma empresa'
							options={[
								{ text: 'Empresa um', value: 'Empresa um' },
								{ text: 'Empresa dois', value: 'Empresa dois' },
							]}
						/>
						<InputWithLabel
							id='webServer'
							label='Web server'
							placeholder='Digite a URL do Web Server'
							className='w-full max-w-[564px]'
						/>
						<InputWithLabel id='Usuário' label='Usuário' placeholder='Digite o usuário' className='w-full max-w-[200px]' />
						<InputWithLabel id='senha' type='password' label='Senha' placeholder='Digite a senha' className='w-full max-w-[200px]' />
						<InputWithLabel id='codigoatm' label='Código ATM' placeholder='Digite p código ATM' className='w-full max-w-[200px]' />
					</div>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
