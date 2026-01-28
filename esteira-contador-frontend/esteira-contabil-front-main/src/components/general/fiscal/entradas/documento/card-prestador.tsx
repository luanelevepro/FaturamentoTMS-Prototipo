import { useState } from 'react';
import { GenericSetterFormProps } from './nfse-form';
import { useQuery } from '@tanstack/react-query';
import { getFornecedores } from '@/services/api/fiscal';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FornecedoresData } from '@/pages/fiscal/fornecedores';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { Icons } from '@/components/layout/icons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCompanyContext } from '@/context/company-context';
import { EditFornecedorModal } from './edit-fornecedor-modal';

type Fornecedor = {
	id: string;
	ds_documento: string;
	ds_nome: string;
	ds_inscricao_municipal: string;
	ds_ibge: number;
	ds_cep: string;
	ds_inscricao: string;
	ds_endereco?: string;
	ds_telefone?: string;
	ds_bairro?: string;
	ds_email?: string;
	ds_codigo_municipio?: number;
	ds_complemento?: string;
	ds_codigo_uf?: string;
};

export function CardPrestadorDocumentos({ setForm, form }: GenericSetterFormProps) {
	const { state } = useCompanyContext();
	const [popover, setPopover] = useState(false);
	const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);

	const handleChange = (field: string, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const clearFornecedorSelection = () => {
		setFornecedor(null);
		setForm((prev) => ({
			...prev,
			id_fis_fornecedor: '',
		}));
	};

	const { data: fornecedores, isFetching } = useQuery({
		queryKey: ['get-fornecedores-empresa', state],
		queryFn: () => getFornecedores(),
		staleTime: 1000 * 60 * 5,
	});

	return (
		<div className='grid gap-3 sm:grid-cols-4'>
			<div className='col-span-2 grid gap-2'>
				<div className='flex items-center justify-between'>
					<Label htmlFor='cnpjPrestador' className='text-sm font-medium'>
						Prestador
					</Label>
				</div>

				<Popover modal={true} open={popover} onOpenChange={setPopover}>
					<PopoverTrigger asChild>
						<Button variant='outline' disabled={isFetching} role='combobox' className='justify-between truncate'>
							<span>
								{isFetching
									? 'Carregando...'
									: form.id_fis_fornecedor
										? fornecedores?.find((s: FornecedoresData) => s.id === form.id_fis_fornecedor)
											? fornecedores?.find((s: FornecedoresData) => s.id === form.id_fis_fornecedor)?.ds_nome
											: 'Não encontrado'
										: 'Selecione um prestador...'}
							</span>

							{isFetching ? <Icons.spinner className='animate-spin' /> : <Search className='opacity-50' />}
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
						<Command
							filter={(value, search) => {
								if (
									fornecedores
										?.find((p: FornecedoresData) => p.ds_documento === value)
										?.ds_nome?.toLowerCase()
										.includes(search)
								)
									return 1;
								if (
									formatCnpjCpf(
										fornecedores?.find((p: FornecedoresData) => p.ds_documento === value)?.ds_documento?.toLowerCase(),
									).includes(search)
								)
									return 1;
								if (
									fornecedores
										?.find((p: FornecedoresData) => p.ds_documento === value)
										?.ds_documento?.toLowerCase()
										.includes(search)
								)
									return 1;
								return 0;
							}}
						>
							<CommandInput placeholder='Selecione um prestador...' />
							<CommandList>
								<CommandEmpty> {isFetching ? 'Carregando...' : 'Nenhum prestador encontrada.'}</CommandEmpty>
								<CommandGroup>
									{(fornecedores ?? []).map((s: FornecedoresData) => (
										<CommandItem
											key={s.id}
											value={s.ds_documento || ''}
											onSelect={(currentValue) => {
												handleChange('id_fis_fornecedor', s.id ?? '');
												setFornecedor({
													id: s.id ?? '',
													ds_documento: currentValue,
													ds_nome: s.ds_nome,
													ds_inscricao_municipal: s.ds_inscricao_municipal || '',
													ds_ibge: s.ds_ibge || 0,
													ds_cep: s.ds_cep || '',
													ds_inscricao: s.ds_inscricao || '',
													ds_endereco: s.ds_endereco || '',
													ds_telefone: s.ds_telefone || '',
													ds_bairro: s.ds_bairro || '',
													ds_email: s.ds_email || '',
													ds_codigo_municipio: s.ds_codigo_municipio || 0,
													ds_complemento: s.ds_complemento || '',
													ds_codigo_uf: s.ds_codigo_uf || '',
												});
												setPopover(false);
											}}
										>
											{s.ds_nome}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
			<div className='grid gap-2 max-sm:col-span-2'>
				<Label htmlFor='fis_fornecedor.ds_documento' className='text-sm font-medium'>
					CNPJ
				</Label>
				<Input
					id='fis_fornecedor.ds_documento'
					name='ds_documento'
					className='bg-muted'
					readOnly
					value={formatCnpjCpf(fornecedor?.ds_documento ?? '')}
				/>
			</div>

			<div className='grid gap-2 max-sm:col-span-2'>
				<div className='flex items-center justify-between'>
					<Label htmlFor='fis_fornecedor.ds_inscricao_municipal' className='text-sm font-medium'>
						Inscrição Municipal
					</Label>
				</div>
				<div className='flex items-center gap-3'>
					<Input
						id='fis_fornecedor.ds_inscricao_municipal'
						maxLength={15}
						name='ds_inscricao_municipal'
						className='bg-muted'
						readOnly
						value={fornecedor?.ds_inscricao_municipal || ''}
					/>
					{/* Botão de edição - só aparece quando tem fornecedor selecionado */}
					{form.id_fis_fornecedor && fornecedor && (
						<EditFornecedorModal fornecedor={fornecedor} disabled={isFetching} onFornecedorUpdated={clearFornecedorSelection} />
					)}
				</div>
			</div>
		</div>
	);
}
