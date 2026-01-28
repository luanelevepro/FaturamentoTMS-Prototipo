import { Icons } from '@/components/layout/icons';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Company } from '@/pages/administracao/empresas';
import { setAsEmpresa } from '@/services/api/sistema';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BtnDeleteEscritorio({ empresa }: { empresa: Company }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function handleDelete() {
		setLoading(true);
		try {
			await setAsEmpresa(empresa.id);
			toast.success('Escritorio removido com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-escritorios'] });
			await queryClient.invalidateQueries({ queryKey: ['get-all-empresas'] });
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar.');
		} finally {
			setOpen(false);
			setLoading(false);
		}
	}
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button tooltip='Excluir escritório' variant='ghost' disabled={loading} size='icon'>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
					<Trash className={loading ? 'hidden' : undefined} />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirmar?</DialogTitle>
					<DialogDescription>Essa ação irá remover a permissão de escritório dessa empresa.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button disabled={loading} variant='outline'>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={handleDelete} disabled={loading} variant='destructive'>
						Continuar
						{loading && <Icons.spinner className='h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
