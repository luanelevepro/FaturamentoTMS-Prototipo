import { useState } from 'react';

import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Company } from '@/pages/administracao/empresas';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/layout/icons';
import { getEmpresa, insertApiKey } from '@/services/api/empresas';
import { Skeleton } from '@/components/ui/skeleton';

export default function BtnHandleInsertAPI({ empresa }: { empresa: Company }) {
	const [open, setOpen] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [apiKey, setApiKey] = useState('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [loading, setLoading] = useState(false);

	async function fetchData(): Promise<void> {
		setErrorMessage('');
		try {
			setLoading(true);
			const response = await getEmpresa(empresa.id);
			setApiKey(response.ds_integration_key || '');
		} catch (error) {
			toast.error(String(error));
		} finally {
			setLoading(false);
		}
	}

	async function handleInsertKey() {
		setIsSending(true);
		setErrorMessage('');

		if (!apiKey) {
			setErrorMessage('O campo não pode ser vazio.');
			setIsSending(false);
			return;
		}

		try {
			await insertApiKey(empresa.id, apiKey);
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsSending(false);
			setOpen(false);
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setApiKey(e.target.value);
	};

	function handleModalOpenChange(isOpen: boolean) {
		setOpen(isOpen);
		if (isOpen) {
			fetchData();
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleModalOpenChange}>
			<DialogTrigger asChild>
				<Button tooltip='Configurar Chave' variant='ghost' size='icon'>
					<KeyRound />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Chave de API</DialogTitle>
					<DialogDescription>Chave de integração para a contabilidade.</DialogDescription>
				</DialogHeader>
				<div className='grid gap-2'>
					{loading ? (
						<Skeleton className='h-9' />
					) : (
						<Input
							id='Key'
							type='Key'
							value={apiKey}
							placeholder='Digite a chave da API'
							onChange={handleChange}
							autoComplete='name'
							disabled={isSending}
						/>
					)}
				</div>
				{errorMessage && (
					<p className='text-sm text-red-600' role='alert'>
						{errorMessage}
					</p>
				)}
				<DialogFooter>
					{loading && (
						<>
							<div className='text-muted-foreground flex flex-1 animate-pulse items-center gap-1 max-sm:hidden'>
								<Icons.spinner className='text-muted-foreground size-4 animate-spin' />
								<p className='text-sm'>Atualizando...</p>
							</div>
						</>
					)}
					<Button variant='ghost' onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleInsertKey} disabled={loading || isSending}>
						{isSending ? 'Salvando...' : 'Salvar'}
						{isSending && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
