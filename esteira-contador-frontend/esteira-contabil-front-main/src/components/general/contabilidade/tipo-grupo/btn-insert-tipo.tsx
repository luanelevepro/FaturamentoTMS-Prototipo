import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Icons } from '@/components/layout/icons';
import { createTipoGrupo } from '@/services/api/tipo-grupo';
import { useCompanyContext } from '@/context/company-context';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';

type TipoGrupoInformation = {
	ds_nome_tipo: string;
};

type HandleInsertEmpresaProps = {
	children: React.ReactNode;
	onChange: () => void;
};
export default function HandleInsertGrupo({ children, onChange }: HandleInsertEmpresaProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { state } = useCompanyContext();
	const queryClient = useQueryClient();
	const [information, setInformation] = useState<TipoGrupoInformation>({ ds_nome_tipo: '' });
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		Object.entries(information).forEach(([key, value]) => {
			if (!value && ['ds_nome_tipo'].includes(key)) {
				newErrors[key] = 'Campo obrigatório.';
			}
		});
		return newErrors;
	};

	const createNewGrupo = async () => {
		setIsLoading(true);
		setErrors({});

		const validationErrors = validateFields();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsLoading(false);
			return;
		}
		try {
			await queryClient.invalidateQueries({ queryKey: ['get-tipo-grupo', state] });
			await createTipoGrupo(information.ds_nome_tipo);
			toast.success('Tipo adicionado com sucesso.');
			setOpen(false);
			onChange();
		} catch (error) {
			console.error('Error inserting:', error);
			toast.error('Erro ao adicionar tipo.');
		} finally {
			setIsLoading(false);
			setInformation({ ds_nome_tipo: '' });
			setOpen(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewGrupo();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Novo Tipo</DialogTitle>
					<DialogDescription>Insira os dados do novo tipo.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					{['ds_nome_tipo'].map((field) => (
						<div key={field} className='grid gap-2'>
							<Label>Nome do Tipo</Label>
							<Input
								id={field}
								type='text'
								placeholder={`Digite o ${field.replace('ds_', '').replace('_', ' ').toLowerCase()}`}
								value={
									information[field as keyof TipoGrupoInformation] ? String(information[field as keyof TipoGrupoInformation]) : ''
								}
								onChange={(e) => setInformation({ ...information, [field]: e.target.value })}
								disabled={isLoading}
							/>
							{errors[field] && (
								<p className='text-sm text-red-600' role='alert'>
									{errors[field]}
								</p>
							)}
						</div>
					))}
					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Adicionando...' : 'Adicionar Tipo de Grupo'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
