import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import { useCompanyContext } from '@/context/company-context';
import { useQueryClient } from '@tanstack/react-query';
import { updateTipoGrupo } from '@/services/api/tipo-grupo';
import { toast } from 'sonner';
type TipoGrupo = {
	id: string;
	ds_nome_tipo: string;
};

type HandleUpdateTipoProps = {
	children: React.ReactNode;
	onChange: () => void;
	data?: TipoGrupo;
};

export default function HandleUpdateTipo({ children, onChange, data }: HandleUpdateTipoProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const { state } = useCompanyContext();
	const { ...rest } = data;
	const [information, setInformation] = useState<TipoGrupo>(
		rest ?? {
			id: '',
			ds_nome_tipo: '',
		},
	);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		if (!information.ds_nome_tipo) newErrors.ds_nome_tipo = 'Campo obrigatório.';
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
			await updateTipoGrupo(information.id, information.ds_nome_tipo);
			toast.success('Tipo atualizado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-tipo-grupo', state] });
			setOpen(false);
			onChange();
		} catch (error) {
			console.error('Error inserting:', error);
			toast.error('Erro ao atualizar grupo.');
		} finally {
			setIsLoading(false);
			setInformation({
				id: '',
				ds_nome_tipo: '',
			});
			setOpen(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewGrupo();
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Atualizar Tipo</DialogTitle>
						<DialogDescription>Insira os dados do tipo.</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='grid gap-4'>
						<div className='grid gap-2'>
							<Label>Nome do Tipo</Label>
							<Input
								id='ds_nome_tipo'
								type='text'
								placeholder='Digite o nome do tipo'
								value={information.ds_nome_tipo || ''}
								onChange={(e) => setInformation({ ...information, ds_nome_tipo: e.target.value })}
								disabled={isLoading}
							/>
							{errors.ds_nome_tipo && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_nome_tipo}
								</p>
							)}
						</div>
						<Button type='submit' disabled={isLoading} className='w-full'>
							{isLoading ? 'Atualizando...' : 'Atualizar Tipo de Grupo'}
							{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
