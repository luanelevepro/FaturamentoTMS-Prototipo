import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useState } from 'react';
import { INfe } from './tableNFe';

interface IProps {
	invoice: INfe[];
	setInvoice: React.Dispatch<React.SetStateAction<INfe[]>>;
}

export default function DrawerDocuments({ invoice, setInvoice }: IProps) {
	const [open, setOpen] = useState(false);

	const clicAddNF = () => {
		setInvoice([
			{
				id: '1',
				nf: '156518161981198161516895498456181656161',
				remetente: 'Rementente ABCD',
				destinatario: 'Destinatário ABCD',
				valorTotal: 10000,
				peso: 550,
			},
			{
				id: '2',
				nf: '156518161981198161516895498456181656162',
				remetente: 'Rementente ABCD',
				destinatario: 'Destinatário ABCD',
				valorTotal: 10000,
				peso: 720,
			},
			{
				id: '3',
				nf: '156518161981198161516895498456181656163',
				remetente: 'Rementente ABCD',
				destinatario: 'Destinatário ABCD',
				valorTotal: 10000,
				peso: 720,
			},
			{
				id: '4',
				nf: '156518161981198161516895498456181656164',
				remetente: 'Rementente ABCD',
				destinatario: 'Destinatário ABCD',
				valorTotal: 10000,
				peso: 720,
			},
		]);
	};
	const clicRemoveNF = () => {
		setInvoice([]);
	};
	
	return (
		<>
			<Drawer open={open} onOpenChange={setOpen} dismissible={false}>
				<DrawerTrigger className='hover:bg-muted flex h-22 items-center justify-center gap-1 rounded-xl border'>
					<strong className='font-semibold'>{'Clique aqui '}</strong>
					<p>{' para selecionar documentos para o percurso'}</p>
				</DrawerTrigger>

				<DrawerContent inert={!open} className='top-0 mt-0! rounded-none! [&>div.bg-muted]:hidden'>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground 9 text-start text-sm'>Selecionar</p>
									<p className='text-start text-xl font-semibold'>Documentos</p>
								</div>
								<div className='flex gap-4'>
									<Button variant='secondary' onClick={() => setOpen(!open)}>
										Fechar
									</Button>

									<Button disabled={invoice.length < 1} type='button' onClick={() => setOpen(!open)}>
										Salvar
									</Button>
								</div>
							</div>
							<DrawerDescription></DrawerDescription>
						</DrawerTitle>
					</DrawerHeader>
					<div className='p-8'>
						<h1 className='font-medium'>Selecione todos os documentos que deseja utilizar nessa viagem:</h1>
						<div className='flex justify-around bg-red-500'>
							<button onClick={clicAddNF}>Adicionar</button>
							<button onClick={clicRemoveNF}>Remove</button>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}
