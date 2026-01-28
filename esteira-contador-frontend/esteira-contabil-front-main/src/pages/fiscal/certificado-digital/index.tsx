import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon, Trash, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
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
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import { createCertificado, getCertificados, deleteCertificado } from '@/services/api/fiscal';

export interface CertificadoDigitalData {
	id?: string;
	dt_expiracao?: string;
	ds_arquivo: string;
	ds_senha: string;
	ds_nome_arquivo: string;
}

const columns: ColumnDef<CertificadoDigitalData>[] = [
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'dt_expiracao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Validade' />,
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<div className='flex justify-end'>
					<HandleDelete data={row.original} />
				</div>
			);
		},
	},
];

export default function CertificadosPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-certificados'],
		queryFn: getCertificados,
		staleTime: 1000 * 60 * 5,
	});

	const filteredData = useMemo(() => {
		return data?.filter((item: { [s: string]: unknown } | ArrayLike<unknown>) =>
			Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os certificados.');
	}

	return (
		<>
			<Head>
				<title>Certificados Digitais | Esteira</title>
			</Head>
			<DashboardLayout title='Certificado Digital' description='Cadastro e gerenciamento de certificados digitais.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleInsert>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsert>
					</div>
					{filteredData?.length === 0 ? (
						isFetching ? (
							<EmptyState label='Carregando...' />
						) : (
							<EmptyState label='Nenhum registro encontrado.' />
						)
					) : (
						<DataTable columns={columns} data={filteredData || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: CertificadoDigitalData }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [info, setInfo] = useState<CertificadoDigitalData>(data ?? { ds_arquivo: '', ds_senha: '', ds_nome_arquivo: '' });
	const [errorMessage, setErrorMessage] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInfo({ ...info, [e.target.id]: e.target.value });
	};

	const toBase64 = (file: File) => {
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader();

			fileReader.readAsDataURL(file);

			fileReader.onload = () => {
				resolve(fileReader.result);
			};

			fileReader.onerror = (error) => {
				reject(error);
			};
		});
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			const file = event.target.files[0];

			const fileBase64 = await toBase64(file);
			setInfo({ ...info, ds_arquivo: fileBase64 as string, ds_nome_arquivo: file.name });
		}
	};

	const handleSelectCertificate = async () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	async function sendInformation() {
		setErrorMessage('');

		if (!info.ds_arquivo) {
			setErrorMessage('O certificado é obrigatório.');
			return;
		}

		if (!info.ds_senha) {
			setErrorMessage('A senha é obrigatória.');
			return;
		}

		setIsLoading(true);

		try {
			await createCertificado(info);
			await queryClient.invalidateQueries({ queryKey: ['get-certificados'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			setInfo(data ?? { ds_arquivo: '', ds_senha: '', ds_nome_arquivo: '' });
			setOpen(false);
		}
	}

	useEffect(() => {
		setInfo(data ?? { ds_arquivo: '', ds_senha: '', ds_nome_arquivo: '' });
	}, [data]);

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		sendInformation();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar certificado</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='name'>Certificado</Label>
							<Button type='button' variant={'outline'} onClick={handleSelectCertificate} className='w-full truncate'>
								<UploadCloud className='h-3 w-3' />
								{info.ds_nome_arquivo ? info.ds_nome_arquivo.slice(0, 30) + '...' : 'Enviar certificado'}
								<input accept='.pfx' hidden={true} ref={fileInputRef} type='file' onChange={handleFileChange} />
							</Button>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='name'>Senha</Label>
							<Input
								id='ds_senha'
								autoComplete='off'
								defaultValue={info.ds_senha}
								type='password'
								className='text-'
								onChange={handleChange}
								disabled={isLoading}
							/>
						</div>
					</div>
					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}
					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Salvando...' : 'Salvar'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: CertificadoDigitalData }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!data?.id) {
			toast.error('Erro ao deletar.');
			return;
		}
		try {
			await deleteCertificado(data?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-certificados'] });
			toast.success('Registro removido com sucesso.');
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar.');
		} finally {
			setLoading(false);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button tooltip='Excluir' variant='ghost' size='icon'>
					<Trash />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Deletar certificado?</DialogTitle>
					<DialogDescription>Isso irá deletar o certificado, essa ação é irreversivel.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button disabled={loading} variant='outline'>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={DeleteData} disabled={loading} variant='destructive'>
						Continuar
						{loading && <Icons.spinner className='h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
