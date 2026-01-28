import Head from 'next/head';
import Link from 'next/link';

import PageLayout from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/layout/icons';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/component';
import { GetServerSidePropsContext } from 'next';
import { createClient as createServerClient } from '@/utils/supabase/server-props';
import { deleteAllCookies } from '@/hooks/use-delete-user-data';

export default function AuthenticationPage() {
	return (
		<>
			<Head>
				<title>Entrar</title>
			</Head>
			<PageLayout>
				<div className='grid h-dvh flex-col items-center justify-center p-8'>
					<div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
						<div className='flex flex-col space-y-2 text-center'>
							<h1 className='text-2xl font-semibold tracking-tight'>Bem vindo!</h1>
							<p className='text-muted-foreground text-sm'>Insira seu email para continuar</p>
						</div>

						<UserAuthForm />
						<p className='text-muted-foreground px-4 text-center text-sm'>
							Clicando em continuar, você concorda com nossos{' '}
							<Link href='/terms' className='hover:text-primary underline underline-offset-4'>
								Termos de Serviço
							</Link>{' '}
							e{' '}
							<Link href='/privacy' className='hover:text-primary underline underline-offset-4'>
								Política de privacidade
							</Link>
							.
						</p>
					</div>
				</div>
			</PageLayout>
		</>
	);
}
type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

function UserAuthForm({ className, ...props }: UserAuthFormProps) {
	const supabase = createClient();

	const [isLoading, setIsLoading] = useState(false);
	const [credentials, setCredentials] = useState({ email: '', password: '' });
	const [errorMessage, setErrorMessage] = useState('');
	const [signInLabel, setSignInLabel] = useState('Entrar');
	const [emaiSent, setEmailSent] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCredentials({ ...credentials, [e.target.id]: e.target.value });
	};

	const logIn = async () => {
		setIsLoading(true);
		setErrorMessage('');

		deleteAllCookies(['USER_COLOR_PREFERENCE']);

		if (!credentials.email) {
			setErrorMessage('O campo email é obrigatório.');
			setIsLoading(false);
			return;
		}

		const { error } = await supabase.auth.signInWithOtp({
			email: credentials.email,
			options: {
				emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL || '',
				shouldCreateUser: false,
			},
		});

		setIsLoading(false);

		if (error) {
			if (error.code === 'otp_disabled') {
				setErrorMessage('Não existe uma conta ao email informado.');
				return;
			}
			setErrorMessage(error.message);
			return;
		}

		toast.success('Email enviado com sucesso.');
		setEmailSent(true);
		setSignInLabel('Reenviar email');
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		logIn();
	};

	return (
		<div className={cn('grid gap-6', className)} {...props}>
			<form onSubmit={handleSubmit} autoComplete='off'>
				<div className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='email'>Email</Label>
						<Input id='email' type='email' autoComplete='email' onChange={handleChange} disabled={isLoading || emaiSent} />
					</div>
					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}
					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Enviando email...' : signInLabel}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</div>
			</form>
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const supabase = createServerClient(context);
	const { data, error } = await supabase.auth.getUser();

	if (error == null || data.user != null) {
		return {
			redirect: {
				destination: '/',
				permanent: false,
			},
		};
	}

	return {
		props: {},
	};
}
