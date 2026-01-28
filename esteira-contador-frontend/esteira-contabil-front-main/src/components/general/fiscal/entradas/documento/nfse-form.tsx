import { useQueryClient } from '@tanstack/react-query';
import { CardServicosDocumentos } from './card-servicos';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { createNotaFiscalServico, updateNotaFiscalServico } from '@/services/api/documentos-fiscais';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { CardPrestadorDocumentos } from './card-prestador';
import { CardRetencoesFederaisDocumentos } from './card-retencoes-federais';
import { CardValoresTotaisDocumentos } from './card-valores-totais';
import Link from 'next/link';

export interface GenericSetterFormProps {
	setForm: React.Dispatch<React.SetStateAction<NFSeData>>;
	form: NFSeData;
}

export interface ServicoData {
	id: string;
	id_servico: string; // id da tabela de servico
	id_item_padrao: string; // id do item padrão da tabela de item padrão
	id_tipo_servico: string; // id do tipo de serviço da tabela de tipo de serviço

	ds_valor_unitario: string;
	ds_quantidade: string;
	ds_valor_total: string;
	ds_discriminacao: string; // descrição do serviço

	ds_base_calculo: string;
	ds_aliquota: string;
	ds_valor_iss: string;
	ds_valor_deducoes: string;
	ds_valor_descontos: string;

	is_iss_retido: boolean;
	ds_exigibilidade_iss: string;
	ds_municipio_incidencia: string; // enviar codigo de IBGE

	ds_valor_pis: string;
	ds_valor_cofins: string;
	ds_valor_inss: string;
	ds_valor_ir: string;
	ds_valor_csll: string;
	ds_outras_retencoes: string;

	use_item_padrao: boolean; // se o serviço é um item padrão ou não
}

export interface NFSeData {
	id?: string;
	ds_numero: string;
	dt_emissao: Date | undefined;
	dt_competencia: Date | undefined;
	ds_codigo_verificacao: string;
	id_fis_fornecedor: string;

	fis_fornecedor?: {
		id: string;
		ds_nome: string;
		ds_documento: string;
		ds_inscricao_municipal: string;
		ds_ibge: string;
	};

	is_optante_simples_nacional: boolean;

	js_servicos: ServicoData[];

	ds_discriminacao?: string;
	ds_valor_liquido_nfse: string;
	ds_valor_servicos: string;
	ds_valor_retencoes: string;
	ds_valor_descontos: string;
	ds_valor_pis: string;
	ds_valor_cofins: string;
	ds_valor_inss: string;
	ds_valor_ir: string;
	ds_valor_csll: string;
	ds_outras_retencoes: string;
}

const emptyNFSeData: NFSeData = {
	ds_numero: '',
	dt_emissao: undefined,
	dt_competencia: undefined,
	ds_codigo_verificacao: '',
	id_fis_fornecedor: '',
	is_optante_simples_nacional: false,
	js_servicos: [
		{
			id: Math.random().toString(36).substring(7),
			id_servico: '',
			ds_discriminacao: '',
			id_item_padrao: '',
			id_tipo_servico: '',
			ds_valor_unitario: '',
			ds_quantidade: '1',
			ds_valor_total: '',
			ds_base_calculo: '',
			ds_aliquota: '',
			ds_valor_iss: '',
			ds_valor_deducoes: '',
			ds_valor_descontos: '',
			is_iss_retido: false,
			ds_exigibilidade_iss: '1',
			ds_municipio_incidencia: '',
			ds_valor_pis: '',
			ds_valor_cofins: '',
			ds_valor_inss: '',
			ds_valor_ir: '',
			ds_valor_csll: '',
			ds_outras_retencoes: '',
			use_item_padrao: false,
		},
	],
	ds_valor_liquido_nfse: '',
	ds_valor_servicos: '',
	ds_valor_retencoes: '',
	ds_valor_descontos: '',
	ds_valor_pis: '',
	ds_valor_cofins: '',
	ds_valor_inss: '',
	ds_valor_ir: '',
	ds_valor_csll: '',
	ds_outras_retencoes: '',
};

export function NFSEForm({ defaultData }: { defaultData?: NFSeData }) {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState<NFSeData>(defaultData || emptyNFSeData);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleChange = (field: string, value: string) => {
		let formattedValue = value;

		if (field === 'ds_codigo_verificacao') {
			formattedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
			// formattedValue = value
			// 	.replace(/[^a-zA-Z0-9]/g, '')
			// 	.slice(0, 9)
			// 	.toUpperCase();
		}

		setFormData((prev) => ({ ...prev, [field]: formattedValue }));
		setErrors({ ...errors, [field]: '' });
	};

	const handleDateChange = (field: string, value: Date | undefined) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors({ ...errors, [field]: '' });
	};

	const getValues = useCallback(
		(field: string) => {
			const value = formData.js_servicos.reduce((acc, servico) => {
				if (field === 'ds_valor_liquido_nfse') {
					return (
						acc +
						parseFloat(servico.ds_valor_total || '0') -
						(parseFloat(servico.ds_valor_cofins || '0') +
							parseFloat(servico.ds_valor_pis || '0') +
							parseFloat(servico.ds_valor_iss || '0') +
							parseFloat(servico.ds_valor_inss || '0') +
							parseFloat(servico.ds_valor_ir || '0') +
							parseFloat(servico.ds_valor_csll || '0') +
							parseFloat(servico.ds_outras_retencoes || '0')) -
						parseFloat(servico.ds_valor_descontos || '0')
					);
				}
				return acc;
			}, 0);
			return value;
		},
		[formData.js_servicos],
	);

	const handleCheckboxChange = (checked: boolean) => {
		setFormData((prev) => ({ ...prev, is_optante_simples_nacional: checked }));

		setFormData((prev) => ({
			...prev,
			ds_valor_pis: '0',
			ds_valor_cofins: '0',
			ds_valor_inss: '0',
			ds_valor_ir: '0',
			ds_valor_csll: '0',
			ds_outras_retencoes: '0',
			ds_valor_liquido_nfse: getValues('ds_valor_liquido_nfse').toString(),
			js_servicos: prev.js_servicos.map((servico) => ({
				...servico,
				ds_valor_pis: '0',
				ds_valor_cofins: '0',
				ds_valor_inss: '0',
				ds_valor_ir: '0',
				ds_valor_csll: '0',
				ds_outras_retencoes: '0',
			})),
		}));
	};

	const adicionarServico = () => {
		const novoServico: ServicoData = {
			id: Math.random().toString(36).substring(7),
			id_servico: '',
			ds_discriminacao: '',
			id_item_padrao: '',
			id_tipo_servico: '',
			ds_valor_unitario: '',
			ds_quantidade: '1',
			ds_valor_total: '',
			ds_base_calculo: '',
			ds_aliquota: '',
			ds_valor_iss: '',
			ds_valor_deducoes: '',
			ds_valor_descontos: '',
			is_iss_retido: false,
			ds_exigibilidade_iss: '1',
			ds_municipio_incidencia: '',
			ds_valor_pis: '',
			ds_valor_cofins: '',
			ds_valor_inss: '',
			ds_valor_ir: '',
			ds_valor_csll: '',
			ds_outras_retencoes: '',
			use_item_padrao: false,
		};

		setFormData((prev) => ({ ...prev, js_servicos: [...prev.js_servicos, novoServico] }));
	};

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		Object.entries(formData).forEach(([key, value]) => {
			if (!value && ['ds_numero', 'ds_codigo_verificacao', 'dt_competencia', 'dt_emissao'].includes(key)) {
				newErrors[key] = 'Campo obrigatório.';
			}
		});
		if (!formData.id_fis_fornecedor) {
			newErrors.id_fis_fornecedor = 'O prestador é obrigatório.';
		}

		if (formData.js_servicos.length === 0) {
			newErrors.js_servicos = 'Campo obrigatório.';
		} else {
			// check if servico has a id_servico and ds_valor_unitario is empty
			formData.js_servicos.forEach((servico) => {
				if (servico.use_item_padrao) {
					if (!servico.id_item_padrao || servico.id_item_padrao === '') {
						newErrors.js_servicos = 'Serviço obrigatório.';
					}
				} else {
					if (!servico.id_servico || servico.id_servico === '') {
						newErrors.js_servicos = 'Serviço obrigatório.';
					}
					if (!servico.id_tipo_servico || servico.id_tipo_servico === '') {
						newErrors.js_servicos = 'Tipo de serviço obrigatório.';
					}
				}
				if (!servico.ds_valor_unitario || servico.ds_valor_unitario === '' || servico.ds_valor_unitario === '0') {
					newErrors.js_servicos = 'Valor do serviço obrigatório.';
				}
			});
		}

		return newErrors;
	};

	async function sendInformation() {
		setErrors({});
		const validationErrors = validateFields();

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsLoading(true);

		try {
			if (defaultData && defaultData.id) {
				await updateNotaFiscalServico(defaultData.id, formData);
				await queryClient.invalidateQueries({ queryKey: ['get-notas-fiscais-servico', defaultData.id] });
			} else {
				await createNotaFiscalServico(formData);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-notas-fiscais-servico'] });
			if (defaultData && defaultData.id) {
				toast.success('Nota fiscal atualizada com sucesso.');
			} else {
				toast.success('Salvo com sucesso.');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			if (!defaultData) {
				// Preserve filters when navigating back after creating a new document
				const preserveFilters = localStorage.getItem('fiscal-entradas-filters');
				if (preserveFilters) {
					const filters = JSON.parse(preserveFilters);
					const urlParams = new URLSearchParams();

					// Preserve month/year (competency)
					if (filters.date) {
						urlParams.set('date', filters.date);
					}

					// Preserve status filters
					if (filters.status && filters.status.length > 0) {
						filters.status.forEach((status: string) => {
							urlParams.append('status', status);
						});
					}

					// Preserve type filters
					if (filters.tipos && filters.tipos.length > 0) {
						filters.tipos.forEach((tipo: string) => {
							urlParams.append('tipos', tipo);
						});
					}

					// Preserve search term
					if (filters.search) {
						urlParams.set('search', filters.search);
					}

					// Preserve page
					if (filters.page && filters.page > 1) {
						urlParams.set('page', filters.page.toString());
					}

					const queryString = urlParams.toString();
					router.push(`/fiscal/entradas${queryString ? `?${queryString}` : ''}`);
				} else {
					router.push('/fiscal/entradas');
				}
			}
		}
	}

	return (
		<div className='mx-auto w-full max-w-5xl space-y-4'>
			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Documento (NFs-e)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
						<div className='space-y-2'>
							<Label htmlFor='ds_numero' className='text-sm font-medium'>
								Número
							</Label>
							<Input
								id='ds_numero'
								type='tel'
								maxLength={15}
								name='ds_numero'
								value={formData.ds_numero}
								onChange={(e) => handleChange('ds_numero', e.target.value)}
							/>
							{errors.ds_numero && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_numero}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='dt_emissao' className='text-sm font-medium'>
								Data Emissão
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											'w-full justify-start truncate text-left font-normal',
											!formData.dt_emissao && 'text-muted-foreground',
										)}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{formData.dt_emissao ? format(formData.dt_emissao, 'dd/MM/yyyy') : <span>Selecione uma data</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={formData.dt_emissao}
										onSelect={(date) => {
											if (date) handleDateChange('dt_emissao', date);
											else handleDateChange('dt_emissao', undefined);
										}}
										locale={ptBR}
									/>
								</PopoverContent>
							</Popover>
							{errors.dt_emissao && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.dt_emissao}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='dt_competencia' className='truncate text-sm font-medium'>
								Data Competência
							</Label>
							<MonthYearSelector
								showCurrentMonthButton
								showClearButton
								className={cn(!formData.dt_competencia && 'text-muted-foreground')}
								selected={formData.dt_competencia ? new Date(formData.dt_competencia) : undefined}
								onSelect={(date) => {
									if (date) handleDateChange('dt_competencia', date);
									else handleDateChange('dt_competencia', undefined);
								}}
							/>
							{errors.dt_competencia && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.dt_competencia}
								</p>
							)}
						</div>

						<div className='filled col-span-1 space-y-2 md:col-span-3'>
							<div className='space-y-2'>
								<Label htmlFor='ds_codigo_verificacao' className='truncate text-sm font-medium'>
									Código Verificação
								</Label>
								<Input
									id='ds_codigo_verificacao'
									// maxLength={9}
									name='ds_codigo_verificacao'
									value={formData.ds_codigo_verificacao}
									onChange={(e) => handleChange('ds_codigo_verificacao', e.target.value)}
								/>
								{errors.ds_codigo_verificacao && (
									<p className='text-sm text-red-600' role='alert'>
										{errors.ds_codigo_verificacao}
									</p>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Prestador de Serviço</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4'>
						<CardPrestadorDocumentos setForm={setFormData} form={formData} />
						{errors.id_fis_fornecedor && (
							<p className='text-sm text-red-600' role='alert'>
								{errors.id_fis_fornecedor}
							</p>
						)}
						<div className='flex items-center gap-2'>
							<Checkbox
								id='is_optante_simples_nacional'
								checked={formData.is_optante_simples_nacional}
								onCheckedChange={handleCheckboxChange}
							/>
							<Label htmlFor='is_optante_simples_nacional' className='text-sm font-medium'>
								Simples Nacional
							</Label>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Serviços Prestados</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-[2fr_2fr_1fr_auto_auto]'>
							<div className='text-sm font-medium'>Serviço</div>
							<div className='text-sm font-medium'>Tipo de serviço</div>
							<div className='text-sm font-medium'>Valor</div>
							<div className='w-9'></div>
							<div className='w-9'></div>
						</div>

						{formData.js_servicos.map((s, i) => (
							<CardServicosDocumentos key={i} {...s} setForm={setFormData} isSN={formData.is_optante_simples_nacional} />
						))}

						<div className='flex items-center justify-between pt-2'>
							<p className='text-sm text-red-600' role='alert'>
								{errors.js_servicos}
							</p>
							<Button variant='outline' onClick={adicionarServico} className='flex items-center gap-2'>
								<Plus className='h-4 w-4' />
								Adicionar Serviço
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<CardRetencoesFederaisDocumentos form={formData} setForm={setFormData} />
			<CardValoresTotaisDocumentos form={formData} setForm={setFormData} />

			<div className='sticky flex justify-end gap-2 pt-2'>
				<Button disabled={isLoading} asChild variant='outline'>
					<Link href='/fiscal/entradas'>Cancelar</Link>
				</Button>
				<Button disabled={isLoading} onClick={sendInformation} variant='outline'>
					Salvar
				</Button>
			</div>
		</div>
	);
}
