import { Icons } from '@/components/layout/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FornecedoresData } from '@/pages/fiscal/fornecedores';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { CidadesSelector } from '../../seletores/cidades-selector';
import { CalendarIcon, Search } from 'lucide-react';
import { createFornecedores, updateFornecedores } from '@/services/api/fiscal';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { DropdownNavProps, DropdownProps } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ptBR } from 'date-fns/locale';

export default function HandleInsertFornecedores({ children, data }: { children: React.ReactNode; data?: FornecedoresData }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [info, setInfo] = useState<FornecedoresData>(
		data ?? {
			ds_nome: '',
			ds_endereco: '',
			ds_cep: '',
			ds_inscricao: '',
			ds_telefone: '',
			ds_inscricao_municipal: '',
			ds_bairro: '',
			ds_email: '',
			ds_codigo_municipio: 0,
			ds_complemento: '',
			ds_documento: '',
			dt_cadastro: null,
			ds_ibge: 0,
		},
	);

	function formatField(id: string, value: string): string {
		if (value === undefined) return '';
		if (value === null) return '';
		if (value === '') return '';

		let formattedValue = value;

		if (id === 'ds_documento') {
			formattedValue = value
				.replace(/\D/g, '')
				.replace(/^(\d{2})(\d)/, '$1.$2')
				.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
				.replace(/\.(\d{3})(\d)/, '.$1/$2')
				.replace(/(\d{4})(\d)/, '$1-$2')
				.slice(0, 18);
		}
		if (id === 'ds_cep') {
			formattedValue = value
				.replace(/\D/g, '')
				.replace(/^(\d{5})(\d)/, '$1-$2')
				.slice(0, 10);
		}
		if (id === 'ds_telefone') {
			formattedValue = value
				.replace(/\D/g, '')
				.replace(/^(\d{2})(\d)/, '($1) $2')
				.replace(/(\d{4})(\d)/, '$1-$2')
				.replace(/(\d{5})(\d)/, '$1-$2')
				.slice(0, 15);
		}
		if (id === 'ds_inscricao_municipal') {
			formattedValue = value.replace(/\D/g, '').slice(0, 15);
		}
		if (id === 'ds_codigo_uf') {
			formattedValue = value.replace(/\D/g, '').slice(0, 2);
		}
		if (id === 'ds_ibge') {
			formattedValue = value.replace(/\D/g, '').slice(0, 7);
		}
		if (id === 'ds_codigo_municipio') {
			formattedValue = value.replace(/\D/g, '').slice(0, 7);
		}
		if (id === 'ds_inscricao') {
			formattedValue = value.replace(/\D/g, '').slice(0, 15);
		}
		if (id === 'ds_email') {
			formattedValue = value.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 50);
		}
		return formattedValue;
	}

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		Object.entries(info).forEach(([key, value]) => {
			if (!value && ['ds_nome', 'ds_documento', 'ds_inscricao_municipal', 'ds_codigo_uf', 'ds_ibge'].includes(key)) {
				newErrors[key] = 'Campo obrigatório.';
			}
		});
		if (info.ds_documento && info.ds_documento.replace(/\D/g, '').length !== 14) {
			newErrors.ds_documento = 'CNPJ inválido. Deve conter 14 dígitos.';
		}

		if (info.dt_cadastro === null || info.dt_cadastro === undefined) {
			newErrors.dt_cadastro = 'Campo obrigatório.';
		}
		return newErrors;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		const formattedValue = formatField(id, value);
		setInfo({ ...info, [id]: formattedValue });
	};

	async function sendInformation() {
		setIsLoading(true);
		setErrors({});

		const validationErrors = validateFields();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsLoading(false);
			return;
		}

		try {
			if (data?.id) {
				await updateFornecedores(data?.id, info);
			} else {
				await createFornecedores(info);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-fornecedores-empresa-paginado'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar fornecedor.';
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
			setInfo({
				ds_nome: '',
				ds_endereco: '',
				ds_cep: '',
				ds_inscricao: '',
				ds_telefone: '',
				ds_inscricao_municipal: '',
				ds_bairro: '',
				ds_email: '',
				ds_codigo_municipio: 0,
				ds_complemento: '',
				ds_documento: '',
				dt_cadastro: null,
				ds_ibge: 0,
			});
			setOpen(false);
		}
	}

	async function getCNPJData(cnpj: string) {
		setIsLoading(true);
		setErrors({});

		try {
			const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Erro ao buscar dados do CNPJ.');
			}

			const data = await response.json();
			setInfo({
				...info,
				ds_nome: data.razao_social,
				ds_documento: formatField('ds_documento', data.cnpj),
				ds_inscricao: formatField('ds_inscricao', data.inscricao_estadual),
				ds_email: formatField('ds_email', data.email),
				ds_telefone: formatField('ds_telefone', data.ddd_telefone_1),
				ds_complemento: data.complemento,
				ds_inscricao_municipal: formatField('ds_inscricao_municipal', data.inscricao_municipal),
				ds_endereco: data.logradouro,
				ds_bairro: data.bairro,
				ds_cep: formatField('ds_cep', data.cep),
				dt_cadastro: new Date(data.data_inicio_atividade),
				ds_ibge: Number(data.codigo_municipio_ibge),
			});
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao buscar dados do CNPJ.');
		} finally {
			setIsLoading(false);
		}
	}

	const handleCalendarChange = (_value: string | number, _e: React.ChangeEventHandler<HTMLSelectElement>) => {
		const _event = {
			target: {
				value: String(_value),
			},
		} as React.ChangeEvent<HTMLSelectElement>;
		_e(_event);
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		sendInformation();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-h-dvh overflow-auto'>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} fornecedor</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-4'>
						<div className='grid gap-2 sm:grid-cols-3'>
							<div className='grid gap-2 sm:col-span-2'>
								<Label>Documento</Label>
								<div className='flex items-center gap-2'>
									<Input id='ds_documento' type='text' onChange={handleChange} value={info.ds_documento} disabled={isLoading} />
									<Button
										type='button'
										variant='outline'
										size='icon'
										disabled={isLoading}
										onClick={() => {
											if (info.ds_documento.length < 14) {
												toast.error('CNPJ inválido.');
												return;
											}
											getCNPJData(info.ds_documento.replace(/\D/g, ''));
										}}
									>
										<Search className={`h-4 w-4 ${isLoading && 'hidden'}`} />
										<Icons.spinner className={`h-4 w-4 animate-spin ${!isLoading && 'hidden'}`} />
									</Button>
								</div>
								{errors.ds_documento && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_documento}
									</p>
								)}
							</div>
							<div className='grid gap-2 self-start'>
								<Label htmlFor='dt_cadastro'>Data de Abertura</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant='outline'
											disabled={isLoading}
											className={cn('justify-start text-left font-normal', !info.dt_cadastro && 'text-muted-foreground')}
										>
											<CalendarIcon className='mr-2 h-4 w-4' />
											{info.dt_cadastro ? format(info.dt_cadastro, 'dd/MM/yyyy') : <span>Insira uma data</span>}
										</Button>
									</PopoverTrigger>
									<PopoverContent className='w-auto p-0'>
										<Calendar
											mode='single'
											locale={ptBR}
											selected={info.dt_cadastro || new Date()}
											onSelect={(date) => setInfo({ ...info, dt_cadastro: date || new Date() })}
											classNames={{
												month_caption: 'mx-0',
											}}
											captionLayout='dropdown'
											defaultMonth={new Date()}
											hideNavigation
											footer={
												<Button
													variant='ghost'
													size='sm'
													className='w-full'
													onClick={() => setInfo({ ...info, dt_cadastro: null })}
												>
													Limpar
												</Button>
											}
											components={{
												DropdownNav: (props: DropdownNavProps) => {
													return <div className='flex w-full items-center gap-2'>{props.children}</div>;
												},
												Dropdown: (props: DropdownProps) => {
													return (
														<Select
															value={String(props.value)}
															onValueChange={(value) => {
																if (props.onChange) {
																	handleCalendarChange(value, props.onChange);
																}
															}}
														>
															<SelectTrigger className='h-8 w-fit font-medium first:grow'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent className='max-h-[min(26rem,var(--radix-select-content-available-height))]'>
																{props.options?.map((option) => (
																	<SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
																		{option.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													);
												},
											}}
										/>
									</PopoverContent>
								</Popover>
								{errors.dt_cadastro && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.dt_cadastro}
									</p>
								)}
							</div>
						</div>
						<div className='grid gap-2'>
							<Label>Nome</Label>
							<Input id='ds_nome' type='text' onChange={handleChange} value={info.ds_nome} disabled={isLoading} />

							{errors.ds_nome && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_nome}
								</p>
							)}
						</div>
						<div className='grid gap-2 sm:grid-cols-2'>
							<div className='grid gap-2'>
								<Label>Inscrição</Label>
								<Input id='ds_inscricao' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_inscricao} />
								{errors.ds_inscricao && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_inscricao}
									</p>
								)}
							</div>
							<div className='grid gap-2'>
								<Label>Inscrição Municipal</Label>
								<Input
									id='ds_inscricao_municipal'
									type='text'
									value={info.ds_inscricao_municipal}
									onChange={handleChange}
									disabled={isLoading}
								/>
								{errors.ds_inscricao_municipal && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_inscricao_municipal}
									</p>
								)}
							</div>
						</div>
						<div className='grid gap-2 sm:grid-cols-3'>
							<div className='grid gap-2 sm:col-span-1'>
								<Label>Telefone</Label>
								<Input id='ds_telefone' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_telefone} />
								{errors.ds_telefone && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_telefone}
									</p>
								)}
							</div>
							<div className='grid gap-2 sm:col-span-2'>
								<Label>Email</Label>
								<Input id='ds_email' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_email} />
								{errors.ds_email && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_email}
									</p>
								)}
							</div>
						</div>
						<Label>Endereço</Label>
						<div className='grid gap-2'>
							<Label>Cidade</Label>
							<CidadesSelector
								key={info.ds_ibge}
								onCityChange={(e) => {
									setInfo({ ...info, ds_ibge: Number(e) });
								}}
								defaultValue={String(info.ds_ibge)}
							/>
							{errors.ds_ibge && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_ibge}
								</p>
							)}
						</div>
						<div className='grid gap-2 sm:grid-cols-3'>
							<div className='grid gap-2'>
								<Label>CEP</Label>
								<Input id='ds_cep' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_cep} />
							</div>
							<div className='grid gap-2 sm:col-span-2'>
								<Label>Logradouro</Label>
								<Input id='ds_endereco' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_endereco} />
							</div>
						</div>
						<div className='grid gap-2 sm:grid-cols-3'>
							<div className='grid gap-2'>
								<Label>Bairro</Label>
								<Input id='ds_bairro' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_bairro} />
							</div>
							<div className='grid gap-2 sm:col-span-2'>
								<Label>Complemento</Label>
								<Input id='ds_complemento' type='text' onChange={handleChange} disabled={isLoading} value={info.ds_complemento} />
							</div>
						</div>
					</div>

					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Salvando...' : 'Salvar'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
