import { Icons } from '@/components/layout/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AddDepartament() {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 👇 estados controlados
	const [name, setName] = useState('');
	const [isActive, setIsActive] = useState(false);

	const createNewEmpresa = async () => {
		setIsLoading(true);

		try {
			console.log('Nome do departamento:', name);
			console.log('Ativo:', isActive);

			toast.success('Departamento adicionado com sucesso.');
			// onChange(); // se quiser atualizar a lista externa
		} catch (error) {
			console.error('Error inserting:', error);
			toast.error('Erro ao adicionar departamento.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewEmpresa();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={'outline'} className='h-9 max-sm:w-9'>
					<Plus className='h-4 w-4 sm:hidden' />
					<p className='max-sm:hidden'>Adicionar</p>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cadastrar Departamento</DialogTitle>
					<DialogDescription >Insira os dados do novo departamento.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='name' required>
							Nome do departamento
						</Label>
						<Input
							id='name'
							type='text'
							placeholder='Digite o nome do departamento'
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isLoading}
						/>
					</div>

					<div className='flex items-center gap-2'>
						<Switch id='active' checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} />
						<p
							className={`${isActive ? 'bg-green-300 text-green-800' : 'bg-gray-300 text-gray-800'} rounded-lg px-2 py-0.5 text-sm font-medium`}
						>
							{isActive ? 'Ativo' : 'Inativo'}
						</p>
					</div>

					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Adicionando...' : 'Adicionar Departamento'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
