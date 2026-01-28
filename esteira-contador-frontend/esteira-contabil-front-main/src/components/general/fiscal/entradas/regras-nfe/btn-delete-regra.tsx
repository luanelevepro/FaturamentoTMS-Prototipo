import React, { useState } from 'react';
import { Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteRegraNfe } from '@/services/api/regras-nfe';
import { Icons } from '@/components/layout/icons';

export function BtnDeleteRegra({ id, onDeleted }: { id: string | number; onDeleted?: () => void }) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			await deleteRegraNfe(String(id));
			toast.success('Regra removida com sucesso.');
			setOpen(false);
			onDeleted?.();
		} catch (err) {
			console.error('Erro ao excluir regra', err);
			toast.error('Erro ao excluir regra.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='ghost' size='icon' aria-label='Excluir regra'>
					<Trash className='text-destructive h-4 w-4' />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirmar exclusão</DialogTitle>
				</DialogHeader>
				<div className='py-4'>
					<p className='text-muted-foreground text-sm'>Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.</p>
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={() => setOpen(false)} disabled={isLoading}>
						<X className='mr-2 h-4 w-4' />
						Cancelar
					</Button>
					<Button className='bg-destructive' onClick={handleDelete} disabled={isLoading}>
						{isLoading ? 'Excluindo...' : 'Excluir'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default BtnDeleteRegra;
