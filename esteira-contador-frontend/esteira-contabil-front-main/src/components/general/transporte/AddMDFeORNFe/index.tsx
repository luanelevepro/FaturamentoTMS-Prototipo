import { useState } from 'react';
import { SquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Icons } from '@/components/layout/icons';

interface IProps {
	setOpenDrawerCte: VoidFunction;
	setOpenDrawerNFe: VoidFunction;
}

export default function AddMDFeOrNFe({ setOpenDrawerCte, setOpenDrawerNFe }: IProps) {
	const [open, setOpen] = useState(false);

	function handleOpen() {
		setOpen(!open);
	}

	function handleCte() {
		setOpenDrawerCte();
		setOpen(!open);
	}

	function handleNfe() {
		setOpenDrawerNFe();
		setOpen(!open);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button>
					<SquarePlus />
					Cadastrar MDFe
				</Button>
			</DialogTrigger>
			<DialogContent className='max-h-screen overflow-auto sm:max-w-[523px]'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<SquarePlus color='#717171' size={20} /> Cadastrar MDFe
					</DialogTitle>
					<DialogDescription>Selecione o tipo de documento que deseja fazer a MDFe:</DialogDescription>
				</DialogHeader>

				<button onClick={handleCte} className='flex items-center gap-4 rounded-xl border p-3'>
					<Icons.Receipt1 />
					<div className='text-start'>
						<p className='text-sm font-semibold'>Via CTe</p>
						<p className='text-[13px]'>Conhecimento de Transporte Eletrônico</p>
					</div>
				</button>
				<button onClick={handleNfe} className='flex items-center gap-4 rounded-xl border p-3'>
					<Icons.Receipt1 />
					<div className='text-start'>
						<p className='text-sm font-semibold'>Via NFe</p>
						<p className='text-[13px]'>Nota Fiscal Eletrônica</p>
					</div>
				</button>
			</DialogContent>
		</Dialog>
	);
}
