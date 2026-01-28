import { Icons } from '@/components/layout/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SquarePlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { departmentProps } from '.';

interface IProsDep {
	departments: departmentProps[];
}

export default function AddSubDepartament({ departments }: IProsDep) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [name, setName] = useState('');
	const [subName, setSubName] = useState('');
	const [isActive, setIsActive] = useState(false);

	const departmentsWithCategory = departments.filter((dep) => dep.category);

	const createNewEmpresa = async () => {
		setIsLoading(true);

		try {
			console.log('Nome do departamento:', name);
			console.log('Ativo:', isActive);

			toast.success('Departamento adicionado com sucesso.');
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
				<Button variant={'ghost'} className='h-9 max-sm:w-9'>
					<SquarePlus className='h-4 w-4' />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cadastrar Subcategoria</DialogTitle>
					<DialogDescription>Insira os dados da nova subcategoria.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='name' required>
							Nome do Departamento
						</Label>
						<Select value={name} onValueChange={(value) => setName(value)}>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='Selecione' />
							</SelectTrigger>
							<SelectContent>
								{departmentsWithCategory.map((dep) => {
									return (
										<SelectItem key={dep.id} value={dep.id}>
											{dep.category}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='subName' required>
							Nome do Subdepartamento
						</Label>
						<Input
							id='subName'
							type='text'
							placeholder='Digite o nome do subdepartamento'
							value={subName}
							onChange={(e) => setSubName(e.target.value)}
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
						{isLoading ? 'Adicionando...' : 'Adicionar Subdepartamento'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
