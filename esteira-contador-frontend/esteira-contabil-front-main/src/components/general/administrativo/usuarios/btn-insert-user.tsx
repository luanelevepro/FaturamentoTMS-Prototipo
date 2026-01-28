import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/component';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import { addUsuarioByEmailEmpresa } from '@/services/api/empresas';

export default function HandleInsertUser({
	children,
	onUserChange,
	empresa_id,
}: {
	children: React.ReactNode;
	onUserChange: () => void;
	empresa_id: string;
}) {
	const supabase = createClient();

	const [open, setOpen] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [credentials, setCredentials] = useState({ email: '', name: '' });
	const [errorMessage, setErrorMessage] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCredentials({ ...credentials, [e.target.id]: e.target.value });
	};

	const createNewUser = async (empresa_id: string) => {
		setIsLoading(true);
		setErrorMessage('');

		// fazer verificação se o usuario pode adicionar pessoas (api call que retorna se é superadmin)

		if (!credentials.email || !credentials.name) {
			setErrorMessage('Todos os campos devem ser preenchidos.');
			setIsLoading(false);
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
			setErrorMessage('Por favor, insira um e-mail válido.');
			setIsLoading(false);
			return;
		}

		const { error } = await supabase.auth.signInWithOtp({
			email: credentials.email,
			options: {
				data: { full_name: credentials.name },
				// set this to false if you do not want the user to be automatically signed up
				shouldCreateUser: true,
				emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL || '',
			},
		});

		setIsLoading(false);

		if (error) {
			setErrorMessage(error.message);
			return;
		}

		toast.success('Link de acesso enviado com sucesso.');
		setOpen(false);

		await addUsuarioByEmailEmpresa(empresa_id, credentials.email);

		setCredentials({ email: '', name: '' });
		onUserChange();
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewUser(empresa_id);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Novo usuário</DialogTitle>
					<DialogDescription>Insira os dados do novo usuário.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='name'>Nome</Label>
							<Input
								id='name'
								type='name'
								placeholder='Digite o nome'
								onChange={handleChange}
								autoComplete='name'
								disabled={isLoading}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='Digite o e-mail'
								onChange={handleChange}
								autoComplete='email'
								disabled={isLoading}
							/>
						</div>
						{errorMessage && (
							<p className='text-sm text-red-600' role='alert'>
								{errorMessage}
							</p>
						)}
					</div>
					<Button type='submit' onClick={handleSubmit} disabled={isLoading} className='w-full'>
						{isLoading ? 'Enviando email...' : 'Adicionar usuário'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
