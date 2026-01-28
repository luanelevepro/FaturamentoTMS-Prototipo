import { AlertCircle, ArrowRight, Building, CheckCircle, Circle, RefreshCw, ScrollText, SearchIcon, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/page-layout';
import { createClient } from '@/utils/supabase/server-props';
import { GetServerSidePropsContext } from 'next';
import type { User } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import Head from 'next/head';
import { useCompanyContext } from '@/context/company-context';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Company } from '@/pages/administracao/empresas';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { deleteAllCookies } from '@/hooks/use-delete-user-data';
import { createClient as createComponentClient } from '@/utils/supabase/component';
import { useRouter } from 'next/router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EmptyState from '@/components/states/empty-state';
import { Icons } from '@/components/layout/icons';
import { getEmpresasUsuario } from '@/services/api/usuarios';

export default function WelcomePage({ user }: { user: User }) {
	const queryClient = useQueryClient();
	// useColorPreference();
	const { state, updateState } = useCompanyContext();
	const [company, setCompany] = useState<string>(state);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const supabase = createComponentClient();
	const router = useRouter();

	const {
		data: companies,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-empresas-usuario', user.id],
		queryFn: () => getEmpresasUsuario(user.id),
		staleTime: 1000 * 60 * 5,
	});

	if (isError) {
		toast.error(error?.message);
	}

	useEffect(() => {
		setCompany(state);
	}, [state]);

	function handleChange(value: string): void {
		setCompany(value);
	}

	function updateCompanyContext(): void {
		updateState(company);
		queryClient.invalidateQueries();
		toast.success('Empresa selecionada com sucesso');
		router.push('/');
	}

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error logging out:', error.message);
			return;
		}
		deleteAllCookies(['USER_COLOR_PREFERENCE']);
		router.push('/login');
	}

	const filteredCompanies = useMemo(() => {
		if (!searchTerm) return companies;

		return companies?.filter((company: Company) => {
			const normalizedSearchTerm = searchTerm.toLowerCase().trim();

			// Divide a busca em termos com base no espaço
			const terms = normalizedSearchTerm.split(' ');

			return terms.every((term) => {
				// Verifica se o termo segue o formato "chave:valor"
				const [key, ...valueParts] = term.split(':');
				const value = valueParts.join(':').trim().toLowerCase();

				if (value) {
					// Filtro específico para campos definidos
					switch (key) {
						case 'uf':
							return company.ds_uf?.toLowerCase().includes(value);
						case 'razao':
							return company.ds_razao_social?.toLowerCase().includes(value);
						case 'fantasia':
							return company.ds_fantasia?.toLowerCase().includes(value);
						case 'cnae':
							return company.ds_cnae?.toLowerCase().includes(value);
						default:
							// Ignora chaves não reconhecidas
							return false;
					}
				} else {
					// Filtro geral para buscas sem chave
					return (
						company.ds_razao_social?.toLowerCase().includes(term) ||
						company.ds_fantasia?.toLowerCase().includes(term) ||
						company.ds_apelido?.toLowerCase().includes(term) ||
						company.ds_documento?.toLowerCase().includes(term) ||
						formatCnpjCpf(company.ds_documento)?.includes(term) ||
						company.ds_uf?.toLowerCase().includes(term) ||
						company.ds_cnae?.toLowerCase().includes(term)
					);
				}
			});
		});
	}, [companies, searchTerm]);

	return (
		<>
			<Head>
				<title>Seleção de empresa</title>
			</Head>
			<PageLayout className='p-4'>
				<div className='m-auto grid h-dvh max-w-[30rem] content-center gap-6'>
					<Label className='px-1 pt-4'>Seleção de empresa</Label>
					<div className='flex gap-2'>
						<div className='relative h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar empresas...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
					</div>
					<ScrollArea className='max-h-[500px]'>
						<RadioGroup
							onValueChange={handleChange}
							defaultValue={company}
							className={`relative grid items-start gap-4 ${companies?.length >= 1 ? 'p-1' : 'p-0'}`}
						>
							{filteredCompanies?.length === 0 && companies?.length >= 1 && (
								<EmptyState label='Não foi encontrado nenhuma empresa.' />
							)}
							{filteredCompanies?.map((c_data: Company) => <CompanyCard key={c_data.id} {...c_data} />)}
							<Alert hidden={companies?.length >= 1}>
								<AlertCircle className='h-4 w-4' />
								<AlertTitle>Sem acesso</AlertTitle>
								<AlertDescription>Você fez login com {user.email}. Solicite acesso a uma ou mais empresas.</AlertDescription>
							</Alert>
						</RadioGroup>
					</ScrollArea>
					<Button
						size={'lg'}
						className={`${(companies?.length < 1 || !companies) && 'hidden'}`}
						disabled={!company || isFetching}
						onClick={updateCompanyContext}
					>
						Prosseguir
						{isFetching ? <Icons.spinner className='h-4 w-4 animate-spin' /> : <ArrowRight className='h-4 w-4' />}
					</Button>
					<Button className={`${companies?.length >= 1 && 'hidden'}`} variant={'outline'} onClick={handleSignOut}>
						Sair
					</Button>
				</div>
			</PageLayout>
		</>
	);
}

function CompanyCard(company: Company) {
	return (
		<Label className='[&:has([data-state=checked])>div]:outline-primary grid cursor-pointer [&:has([data-state=checked])_svg.check-icon]:block [&:has([data-state=checked])_svg.circle-icon]:hidden [&:has([data-state=checked])>div]:outline-2 [&:not(:has([data-state=checked]))_svg.check-icon]:hidden [&:not(:has([data-state=checked]))_svg.circle-icon]:block'>
			<RadioGroupItem value={company.id} className='sr-only' id={`radio-${company.ds_razao_social}`} />
			<Card className='outline-border border-0 shadow-none outline'>
				<CardHeader>
					<div className='flex items-center gap-4'>
						<div className='flex aspect-square size-10 items-center justify-center rounded-lg border'>
							{company.id_externo === '0' ? (
								<ShieldAlert className='size-5' />
							) : company.is_escritorio ? (
								<ScrollText className='size-5' />
							) : (
								<Building className='size-5' />
							)}
						</div>
						<div className='flex flex-1 flex-col items-start gap-2'>
							<div className='flex flex-wrap items-center gap-2'>
								<p className='line-clamp-1'>{company.ds_fantasia}</p>
								<p className='text-muted-foreground text-xs'>({formatCnpjCpf(company.ds_documento)})</p>
							</div>
							<p className='text-muted-foreground line-clamp-1 text-xs' title={company.ds_razao_social}>
								{company.ds_razao_social}
							</p>
							<Badge variant={'outline'}>
								{company.id_externo === '0' ? 'Sistema' : company.is_escritorio ? 'Escritório' : 'Empresa'}
							</Badge>
						</div>

						<CheckCircle className='check-icon text-primary hidden size-4' />
						<Circle className='circle-icon text-border size-4' />
					</div>
				</CardHeader>
			</Card>
		</Label>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const supabase = createClient(context);
	const { data, error } = await supabase.auth.getUser();

	if (error || !data) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	}

	return {
		props: {
			user: data.user,
		},
	};
}
