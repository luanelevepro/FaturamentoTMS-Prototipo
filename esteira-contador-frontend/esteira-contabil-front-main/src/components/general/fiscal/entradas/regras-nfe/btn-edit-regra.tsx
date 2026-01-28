import React, { useEffect, useState } from 'react';
import { Building, CalendarIcon, Code, FileText, Hash, MapPin, Package, Plus, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContentLarge, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectSearch } from '@/components/ui/multi-select-search';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { getSegmentosEmpresas } from '@/services/api/fiscal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { CfopItem, CstItem, OrigemCstItem, RegimeTributario, Segmentos, TipoProdutoItem } from '@/pages/fiscal/entradas/regras-nfe';
import { getCFOP, getCST, getOrigemCST, getRegimesTributarios, getTiposProduto, getUFsGeral } from '@/services/api/sistema';
import { RegrasNfeData, updateRegraNfe } from '@/services/api/regras-nfe';
import { RegraNfe } from '@/pages/fiscal/entradas/regras-nfe';
import { toast } from 'sonner';
import { Icons } from '@/components/layout/icons';

interface FormData {
	ds_descricao: string;
	id_regime_destinatario: string;
	id_segmento_destinatario: string;
	ds_destino_uf: string;
	ds_origem_uf: string;
	dt_vigencia: string;
	js_tipo_produto: string[];
	js_origem_trib: string[];
	js_ncm_produto: string[];
	id_regime_emitente: string;
	js_cfop_origem: string[];
	js_cst_origem: string[];
	id_cfop_entrada: string;
	id_cst_entrada: string;
	id_cfop_gerado?: string;
	id_cst_gerado?: string;
}

const MANTER_CST = '__MANTER_CST__';

function RemovableBadge({ children, onRemove, className = '' }: { children: React.ReactNode; onRemove: () => void; className?: string }) {
	return (
		<Badge
			variant='secondary'
			className={cn(
				'bg-primary-light text-primary hover:bg-primary/10 flex items-center gap-2 rounded-full px-3 py-0.5 text-sm transition-colors',
				className,
			)}
		>
			<span className='truncate select-none'>{children}</span>
			<button
				type='button'
				aria-label='Remover'
				onClick={onRemove}
				className='ml-2 inline-flex items-center justify-center rounded-sm p-0 text-sm opacity-90 hover:opacity-100'
			>
				<X className='h-3 w-3' />
			</button>
		</Badge>
	);
}

function mapToStringArray(input?: unknown[]): string[] {
	if (!Array.isArray(input)) return [];
	return input
		.map((item) => {
			if (item == null) return '';
			if (typeof item === 'string' || typeof item === 'number') return String(item);
			if (typeof item === 'object') {
				const obj = item as Record<string, unknown>;
				return String(
					obj.id ??
						obj.id_cfop ??
						obj.id_sis_origem_cst ??
						obj.id_sis_cst ??
						obj.id_sis_tipos_produto ??
						(obj.sis_tipos_produto && (obj.sis_tipos_produto as Record<string, unknown>).id) ??
						(obj.sis_cfop && (obj.sis_cfop as Record<string, unknown>).id) ??
						'',
				);
			}
			return '';
		})
		.filter(Boolean);
}

export function BtnEditRegra({ regra }: { regra: RegraNfe }) {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState<FormData>({
		ds_descricao: '',
		id_regime_destinatario: '',
		id_segmento_destinatario: '',
		ds_destino_uf: '',
		ds_origem_uf: '',
		dt_vigencia: '',
		js_tipo_produto: [],
		js_origem_trib: [],
		js_ncm_produto: [],
		id_regime_emitente: '',
		js_cfop_origem: [],
		js_cst_origem: [],
		id_cfop_entrada: '',
		id_cst_entrada: MANTER_CST,
		id_cfop_gerado: '', // CFOP gerado is optional
		id_cst_gerado: MANTER_CST,
	});
	const [newInputs, setNewInputs] = useState({ js_ncm_produto: '', js_cfop_origem: '', js_cst_origem: '' });

	const {
		data: dataSegmentos,
		isLoading: isLoadingSegmentos,
		error: errorSegmentos,
	} = useQuery({
		queryKey: ['get-segmentos-empresa'],
		queryFn: () => getSegmentosEmpresas(),
		enabled: !!state,
	});
	const {
		data: dataRegimes,
		isLoading: isLoadingRegimes,
		error: errorRegimes,
	} = useQuery({
		queryKey: ['get-regimes-tributarios'],
		queryFn: () => getRegimesTributarios(),
		enabled: !!state,
	});
	const {
		data: dataTipoProduto,
		isLoading: isLoadingTipoProduto,
		error: errorTipoProduto,
	} = useQuery({
		queryKey: ['get-tipos-produtos'],
		queryFn: () => getTiposProduto(),
		enabled: !!state,
	});
	const {
		data: dataOrigemCST,
		isLoading: isLoadingOrigemCST,
		error: errorOrigemCST,
	} = useQuery({
		queryKey: ['get-origem-cst'],
		queryFn: () => getOrigemCST(),
		enabled: !!state,
	});
	const {
		data: dataCFOP,
		isLoading: isLoadingCFOP,
		error: errorCFOP,
	} = useQuery({
		queryKey: ['get-cfop'],
		queryFn: () => getCFOP(),
		enabled: !!state,
	});
	const {
		data: dataCST,
		isLoading: isLoadingCST,
		error: errorCST,
	} = useQuery({
		queryKey: ['get-cst'],
		queryFn: () => getCST(),
		enabled: !!state,
	});
	const {
		data: dataUFs,
		isLoading: isLoadingUFs,
		error: errorUFs,
	} = useQuery({
		queryKey: ['ufs', state],
		queryFn: () => getUFsGeral(),
		enabled: !!state,
	});

	// Build options that mirror the creator: prefer loaded data arrays, but
	// if an item is selected and missing from the loaded data, fall back to
	// extracting the label from the original `regra` payload so the UI shows
	// the same human-readable labels instead of raw ids.
	const tipoOptions = React.useMemo(() => {
		const regraRec = regra as unknown as Record<string, unknown> | undefined;
		const base: { label: string; value: string }[] = Array.isArray(dataTipoProduto)
			? (dataTipoProduto as TipoProdutoItem[]).map((item) => ({
					label: item.ds_codigo ?? String(item.ds_descricao),
					value: String(item.id),
				}))
			: [];
		if (regraRec && Array.isArray(regraRec.js_tipos_produto)) {
			(regraRec.js_tipos_produto as unknown[]).forEach((t) => {
				const tRec = t as Record<string, unknown>;
				const v = String(tRec.id ?? tRec.id_sis_tipos_produto ?? tRec);
				const label = String(
					(tRec.sis_tipos_produto && (tRec.sis_tipos_produto as Record<string, unknown>).ds_codigo) ??
						tRec.ds_codigo ??
						tRec.ds_descricao ??
						v,
				);
				if (v && !base.find((b) => b.value === v)) base.push({ value: v, label });
			});
		}
		return base;
	}, [dataTipoProduto, regra]);

	const origemCstOptions = React.useMemo(() => {
		const regraRec = regra as unknown as Record<string, unknown> | undefined;
		const base: { label: string; value: string }[] = Array.isArray(dataOrigemCST)
			? (dataOrigemCST as OrigemCstItem[]).map((o) => ({ label: o.ds_codigo, value: String(o.id) }))
			: [];
		if (regraRec && Array.isArray(regraRec.js_origem_trib)) {
			(regraRec.js_origem_trib as unknown[]).forEach((o) => {
				const oRec = o as Record<string, unknown>;
				const v = String(
					oRec.id ?? oRec.id_sis_origem_cst ?? (oRec.sis_origem_cst && (oRec.sis_origem_cst as Record<string, unknown>).id) ?? '',
				);
				const label = String(
					(oRec.sis_origem_cst && (oRec.sis_origem_cst as Record<string, unknown>).ds_codigo) ?? oRec.ds_codigo ?? v,
				);
				if (v && !base.find((b) => b.value === v)) base.push({ value: v, label });
			});
		}
		return base;
	}, [dataOrigemCST, regra]);

	const cfopOptions = React.useMemo(() => {
		const regraRec = regra as unknown as Record<string, unknown> | undefined;
		const base: { label: string; value: string }[] = Array.isArray(dataCFOP)
			? (dataCFOP as CfopItem[]).map((c) => ({ label: c.ds_codigo, value: String(c.id) }))
			: [];
		if (regraRec && Array.isArray(regraRec.js_cfop_origem)) {
			(regraRec.js_cfop_origem as unknown[]).forEach((c) => {
				const cRec = c as Record<string, unknown>;
				const v = String(cRec.id ?? cRec.id_cfop ?? (cRec.sis_cfop && (cRec.sis_cfop as Record<string, unknown>).id) ?? '');
				const label = String((cRec.sis_cfop && (cRec.sis_cfop as Record<string, unknown>).ds_codigo) ?? cRec.ds_codigo ?? v);
				if (v && !base.find((b) => b.value === v)) base.push({ value: v, label });
			});
		}
		return base;
	}, [dataCFOP, regra]);

	const cstOptions = React.useMemo(() => {
		const regraRec = regra as unknown as Record<string, unknown> | undefined;
		const base: { label: string; value: string }[] = Array.isArray(dataCST)
			? (dataCST as CstItem[]).map((c) => ({ label: c.ds_codigo, value: String(c.id) }))
			: [];
		if (regraRec && Array.isArray(regraRec.js_cst_origem)) {
			(regraRec.js_cst_origem as unknown[]).forEach((c) => {
				const cRec = c as Record<string, unknown>;
				const v = String(cRec.id ?? cRec.id_sis_cst ?? (cRec.sis_cst && (cRec.sis_cst as Record<string, unknown>).id) ?? '');
				const label = String((cRec.sis_cst && (cRec.sis_cst as Record<string, unknown>).ds_codigo) ?? cRec.ds_codigo ?? v);
				if (v && !base.find((b) => b.value === v)) base.push({ value: v, label });
			});
		}
		return base;
	}, [dataCST, regra]);

	useEffect(() => {
		if (open && regra) {
			setFormData({
				ds_descricao: regra.ds_descricao ?? '',
				id_regime_destinatario: regra.id_regime_destinatario ?? '',
				id_segmento_destinatario: regra.id_segmento_destinatario ?? '',
				ds_destino_uf: regra.ds_destino_uf ?? '',
				ds_origem_uf: regra.ds_origem_uf ?? '',
				dt_vigencia: regra.dt_vigencia ?? '',
				js_tipo_produto: mapToStringArray(
					((regra as unknown as Record<string, unknown>).js_tipos_produto as unknown[]) ||
						((regra as unknown as Record<string, unknown>).js_tipo_produto as unknown[]),
				),
				js_origem_trib: mapToStringArray((regra as unknown as Record<string, unknown>).js_origem_trib as unknown[]),
				js_ncm_produto: mapToStringArray((regra as unknown as Record<string, unknown>).js_ncm_produto as unknown[]),
				id_regime_emitente: regra.id_regime_emitente ?? '',
				js_cfop_origem: mapToStringArray((regra as unknown as Record<string, unknown>).js_cfop_origem as unknown[]),
				js_cst_origem: mapToStringArray((regra as unknown as Record<string, unknown>).js_cst_origem as unknown[]),
				id_cfop_entrada: regra.id_cfop_entrada ?? '',
				id_cst_entrada: regra.id_cst_entrada ?? MANTER_CST,
				id_cfop_gerado: (regra as RegraNfe).id_cfop_gerado ?? '',
				id_cst_gerado: (regra as RegraNfe).id_cst_gerado ?? MANTER_CST,
			});
		}
	}, [open, regra]);

	const resetForm = () => {
		setFormData({
			ds_descricao: '',
			id_regime_destinatario: '',
			id_segmento_destinatario: '',
			ds_destino_uf: '',
			ds_origem_uf: '',
			dt_vigencia: '',
			js_tipo_produto: [],
			js_origem_trib: [],
			js_ncm_produto: [],
			id_regime_emitente: '',
			js_cfop_origem: [],
			js_cst_origem: [],
			id_cfop_entrada: '',
			id_cst_entrada: MANTER_CST,
		});
		setNewInputs({ js_ncm_produto: '', js_cfop_origem: '', js_cst_origem: '' });
		setErrors({});
	};

	const handleInputChange = (field: keyof FormData, value: string | string[]) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleArrayAdd = (field: 'js_ncm_produto' | 'js_cfop_origem' | 'js_cst_origem', value: string) => {
		if (value.trim() && !formData[field].includes(value.trim())) handleInputChange(field, [...formData[field], value.trim()]);
	};

	const handleArrayRemove = (field: 'js_ncm_produto' | 'js_cfop_origem' | 'js_cst_origem', index: number) => {
		setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, field: 'js_ncm_produto' | 'js_cfop_origem' | 'js_cst_origem') => {
		if (e.key === 'Enter') {
			e.preventDefault();
			const inputField = field as keyof typeof newInputs;
			const value = (newInputs[inputField] as string) || '';
			if (typeof value === 'string' && value.trim()) {
				handleArrayAdd(field, value);
				setNewInputs((prev) => ({ ...prev, [inputField]: '' }));
			}
		}
	};

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		if (!formData.ds_descricao) newErrors.ds_descricao = 'Descrição é obrigatória.';
		if (!formData.dt_vigencia) newErrors.dt_vigencia = 'Data de vigência é obrigatória.';
		else {
			const parsed = parseISO(formData.dt_vigencia);
			if (isNaN(parsed.getTime())) newErrors.dt_vigencia = 'Data de vigência inválida.';
			else if (parsed > new Date()) newErrors.dt_vigencia = 'Data de vigência não pode ser maior que a data atual.';
		}
		if (!formData.ds_origem_uf) newErrors.ds_origem_uf = 'UF de origem é obrigatória.';
		if (!formData.ds_destino_uf) newErrors.ds_destino_uf = 'UF de destino é obrigatória.';
		if (!formData.id_regime_destinatario) newErrors.id_regime_destinatario = 'Regime tributário do destinatário é obrigatório.';
		if (!formData.id_regime_emitente) newErrors.id_regime_emitente = 'Regime tributário do emitente é obrigatório.';
		if (!formData.id_segmento_destinatario) newErrors.id_segmento_destinatario = 'Atividade do destinatário é obrigatória.';
		if (!formData.id_cfop_entrada) newErrors.id_cfop_entrada = 'CFOP de entrada é obrigatório.';
		if (!formData.id_cst_entrada) newErrors.id_cst_entrada = 'CST de entrada é obrigatório.';
		return newErrors;
	};

	const handleUpdate = async () => {
		setIsLoading(true);
		setErrors({});
		const validationErrors = validateFields();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsLoading(false);
			return;
		}

		const resolveSisId = (value: string, kind: 'tipo' | 'origem' | 'cfop' | 'cst') => {
			if (!regra) return value;
			try {
				const arr = (regra as unknown as Record<string, unknown>)[
					kind === 'tipo'
						? 'js_tipos_produto'
						: kind === 'origem'
							? 'js_origem_trib'
							: kind === 'cfop'
								? 'js_cfop_origem'
								: 'js_cst_origem'
				] as unknown[] | undefined;
				if (!Array.isArray(arr)) return value;
				for (const entry of arr) {
					const e = entry as Record<string, unknown>;
					if (String(e.id) === String(value)) {
						if (kind === 'tipo')
							return String(
								e.id_sis_tipos_produto ?? (e.sis_tipos_produto && (e.sis_tipos_produto as Record<string, unknown>).id) ?? value,
							);
						if (kind === 'origem')
							return String(e.id_sis_origem_cst ?? (e.sis_origem_cst && (e.sis_origem_cst as Record<string, unknown>).id) ?? value);
						if (kind === 'cfop') return String(e.id_cfop ?? (e.sis_cfop && (e.sis_cfop as Record<string, unknown>).id) ?? value);
						if (kind === 'cst') return String(e.id_sis_cst ?? (e.sis_cst && (e.sis_cst as Record<string, unknown>).id) ?? value);
					}
					// If the form value already equals the sis id fields, keep it
					if (
						kind === 'tipo' &&
						(String(e.id_sis_tipos_produto) === String(value) ||
							(e.sis_tipos_produto && String((e.sis_tipos_produto as Record<string, unknown>).id) === String(value)))
					)
						return value;
					if (
						kind === 'origem' &&
						(String(e.id_sis_origem_cst) === String(value) ||
							(e.sis_origem_cst && String((e.sis_origem_cst as Record<string, unknown>).id) === String(value)))
					)
						return value;
					if (
						kind === 'cfop' &&
						(String(e.id_cfop) === String(value) ||
							(e.sis_cfop && String((e.sis_cfop as Record<string, unknown>).id) === String(value)))
					)
						return value;
					if (
						kind === 'cst' &&
						(String(e.id_sis_cst) === String(value) ||
							(e.sis_cst && String((e.sis_cst as Record<string, unknown>).id) === String(value)))
					)
						return value;
				}
			} catch {
				return value;
			}
			return value;
		};

		const transformedData = {
			...formData,
			js_tipo_produto: formData.js_tipo_produto?.map((v) => resolveSisId(v, 'tipo')) ?? [],
			js_origem_trib: formData.js_origem_trib?.map((v) => resolveSisId(v, 'origem')) ?? [],
			js_cfop_origem: formData.js_cfop_origem?.map((v) => resolveSisId(v, 'cfop')) ?? [],
			js_cst_origem: formData.js_cst_origem?.map((v) => resolveSisId(v, 'cst')) ?? [],
			id_cfop_gerado: formData.id_cfop_gerado,
			id_cst_gerado: formData.id_cst_gerado,
			id_cst_entrada: formData.id_cst_entrada,
			id_cfop_entrada: formData.id_cfop_entrada,
		};

		try {
			const payload: RegrasNfeData = { ...transformedData } as RegrasNfeData;
			if (typeof payload.id_cst_gerado === 'string') {
				if (payload.id_cst_gerado === MANTER_CST || payload.id_cst_gerado === '' || payload.id_cst_gerado === '__MANTER_CST__') {
					payload.id_cst_gerado = 'MANTER_CST';
				}
			}
			if (typeof payload.id_cst_entrada === 'string') {
				if (payload.id_cst_entrada === MANTER_CST || payload.id_cst_entrada === '' || payload.id_cst_entrada === '__MANTER_CST__') {
					payload.id_cst_entrada = 'MANTER_CST';
				}
			}
			// Remove id_cfop_gerado if falsy
			if (!payload.id_cfop_gerado) {
				delete payload.id_cfop_gerado;
			}
			await updateRegraNfe(regra.id, payload);
			toast.success('Regra atualizada com sucesso.');
			setOpen(false);
			resetForm();
		} catch (error) {
			console.error('Error updating:', error);
			toast.error('Erro ao atualizar regra.');
		} finally {
			setIsLoading(false);
			queryClient.invalidateQueries({ queryKey: ['regras-nfe', state] });
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='ghost' size='icon' aria-label='Editar regra'>
					<Edit className='h-4 w-4' />
				</Button>
			</DialogTrigger>
			<DialogContentLarge className='overflow-auto'>
				<div className='space-y-4 overflow-auto'>
					<DialogHeader>
						<DialogTitle>Editar Regra NFe</DialogTitle>
					</DialogHeader>
					<Separator className='my-4' />
					<div className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle className='text-foreground flex items-center gap-2 text-base'>
									<FileText className='text-primary h-4 w-4' />
									Identificação
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div className='space-y-1 md:col-span-2'>
										<Label htmlFor='ds_descricao' className='text-muted-foreground text-sm font-medium'>
											Descrição
										</Label>
										<Input
											id='ds_descricao'
											placeholder='Digite uma descrição da regra...'
											value={formData.ds_descricao}
											onChange={(e) => handleInputChange('ds_descricao', e.target.value)}
											className='w-full'
											aria-invalid={!!errors.ds_descricao}
										/>
										{errors.ds_descricao && (
											<p className='mt-1 text-sm text-red-600' role='alert'>
												{errors.ds_descricao}
											</p>
										)}
									</div>

									<div className='space-y-2 md:col-span-1'>
										<Label className='text-muted-foreground text-sm font-medium'>Data de Vigência</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant='outline'
													className={cn(
														'w-full justify-start text-left font-normal',
														!formData.dt_vigencia && 'text-muted-foreground',
													)}
													aria-invalid={!!errors.dt_vigencia}
												>
													<CalendarIcon className='mr-2 h-4 w-4' />
													{formData.dt_vigencia ? (
														format(parseISO(formData.dt_vigencia), 'dd/MM/yyyy', { locale: ptBR })
													) : (
														<span>Insira uma data de vigência</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-auto p-0'>
												<Calendar
													mode='single'
													selected={formData.dt_vigencia ? parseISO(formData.dt_vigencia) : undefined}
													onSelect={(date) =>
														setFormData((prev) => ({ ...prev, dt_vigencia: date ? format(date as Date, 'yyyy-MM-dd') : '' }))
													}
													locale={ptBR}
												/>
												<div className='p-2'>
													<Button
														variant='ghost'
														size='sm'
														className='w-full'
														onClick={() => setFormData((prev) => ({ ...prev, dt_vigencia: '' }))}
													>
														Limpar
													</Button>
												</div>
											</PopoverContent>
										</Popover>
										{errors.dt_vigencia && (
											<p className='mt-1 text-sm text-red-600' role='alert'>
												{errors.dt_vigencia}
											</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* reuse same layout for other fields (trimmed for brevity but kept essential fields) */}
						<Card>
							<CardHeader>
								<CardTitle className='text-foreground flex items-center gap-2 text-base'>
									<Building className='text-primary h-4 w-4' />
									Dados do Sistema
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<Label className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
											<Code className='h-4 w-4' />
											Regime Tributário do Recebedor
										</Label>
										<Select
											value={formData.id_regime_destinatario}
											onValueChange={(v) => handleInputChange('id_regime_destinatario', v)}
										>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.id_regime_destinatario}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione o regime' />
												</SelectTrigger>
											</div>
											<SelectContent>
												{isLoadingRegimes ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
												) : errorRegimes ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar regimes</div>
												) : Array.isArray(dataRegimes) && dataRegimes.length > 0 ? (
													(dataRegimes as RegimeTributario[]).map((r) => (
														<SelectItem key={r.id} value={r.id}>
															{r.ds_descricao}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhum regime encontrado</div>
												)}
											</SelectContent>
										</Select>
										{errors.id_regime_destinatario && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.id_regime_destinatario}
											</p>
										)}
									</div>

									<div className='space-y-2'>
										<Label className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
											<Package className='h-4 w-4' />
											Atividade do Recebedor
										</Label>
										<Select
											value={formData.id_segmento_destinatario}
											onValueChange={(v) => handleInputChange('id_segmento_destinatario', v)}
										>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.id_segmento_destinatario}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione a atividade' />
												</SelectTrigger>
											</div>
											<SelectContent>
												{isLoadingSegmentos ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
												) : errorSegmentos ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar atividades</div>
												) : Array.isArray(dataSegmentos) && dataSegmentos.length > 0 ? (
													(dataSegmentos as Segmentos[]).map((s) => (
														<SelectItem key={s.id} value={s.id}>
															{s.ds_descricao}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhuma atividade encontrada</div>
												)}
											</SelectContent>
										</Select>
										{errors.id_segmento_destinatario && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.id_segmento_destinatario}
											</p>
										)}
									</div>

									<div className='space-y-2'>
										<Label className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
											<MapPin className='h-4 w-4' />
											UF do Recebedor
										</Label>
										<Select value={formData.ds_destino_uf} onValueChange={(value) => handleInputChange('ds_destino_uf', value)}>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.ds_destino_uf}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<button
													type='button'
													aria-label='Limpar UF'
													onClick={() => handleInputChange('ds_destino_uf', '')}
													className={cn(
														'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
														formData.ds_destino_uf
															? 'text-muted-foreground hover:text-destructive'
															: 'text-muted-foreground/40',
													)}
												>
													<X className='h-3 w-3' />
												</button>
											</div>
											<SelectContent>
												{isLoadingUFs ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando UFs...</div>
												) : errorUFs ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar UFs</div>
												) : Array.isArray(dataUFs) && dataUFs.length > 0 ? (
													dataUFs.map((uf: { ds_uf: string; ds_state: string }) => (
														<SelectItem key={uf.ds_uf} value={uf.ds_uf}>
															{uf.ds_uf} - {uf.ds_state}
														</SelectItem>
													))
												) : Array.isArray(dataUFs?.ufs) && dataUFs.ufs.length > 0 ? (
													dataUFs.ufs.map((uf: { ds_uf: string; ds_state: string }) => (
														<SelectItem key={uf.ds_uf} value={uf.ds_uf}>
															{uf.ds_uf} - {uf.ds_state}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhuma UF encontrada</div>
												)}
											</SelectContent>
										</Select>
										{errors.ds_destino_uf && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.ds_destino_uf}
											</p>
										)}
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
									<div className='space-y-2 md:col-span-3'>
										<Label className='text-muted-foreground text-sm font-medium'>Origem CFOP</Label>
										<Select value={formData.ds_origem_uf} onValueChange={(v) => handleInputChange('ds_origem_uf', v)}>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.ds_origem_uf}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
											</div>
											<SelectContent>
												<SelectItem value='DENTRO'>Dentro do Estado</SelectItem>
												<SelectItem value='FORA'>Fora do Estado</SelectItem>
											</SelectContent>
										</Select>
										{errors.ds_origem_uf && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.ds_origem_uf}
											</p>
										)}
									</div>

									<div className='md:col-span-6'>
										{isLoadingTipoProduto ? (
											<div className='text-muted-foreground p-2 text-sm'>Carregando tipos de item...</div>
										) : errorTipoProduto ? (
											<div className='p-2 text-sm text-red-600'>Erro ao carregar tipos de item</div>
										) : (
											<MultiSelectSearch
												label='Tipos de Item'
												placeholder='Adicione tipos de item'
												options={tipoOptions}
												values={formData.js_tipo_produto}
												onChange={(vals) => handleInputChange('js_tipo_produto', vals)}
												className='w-full'
											/>
										)}
									</div>
								</div>

								{/* NCM e origens */}
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										{isLoadingOrigemCST ? (
											<div className='text-muted-foreground p-2 text-sm'>Carregando origens CST...</div>
										) : errorOrigemCST ? (
											<div className='p-2 text-sm text-red-600'>Erro ao carregar origens CST</div>
										) : (
											<MultiSelectSearch
												label='Origem CST'
												placeholder='Adicione origens CST'
												options={origemCstOptions}
												values={formData.js_origem_trib}
												onChange={(vals) => handleInputChange('js_origem_trib', vals)}
												className='w-full'
											/>
										)}
									</div>

									<div className='space-y-2'>
										<Label className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
											<Hash className='h-4 w-4' />
											Códigos NCM
										</Label>
										<Input
											placeholder='Digite NCM'
											value={newInputs.js_ncm_produto}
											onChange={(e) => setNewInputs((prev) => ({ ...prev, js_ncm_produto: e.target.value }))}
											onKeyDown={(e) => handleKeyPress(e, 'js_ncm_produto')}
											className='focus:border-primary/50 focus:ring-primary/20 border-2 transition-all duration-200 focus:ring-2'
										/>
										<div className='mt-3 flex flex-wrap gap-2'>
											{formData.js_ncm_produto.map((ncm, index) => (
												<RemovableBadge key={index} onRemove={() => handleArrayRemove('js_ncm_produto', index)}>
													{ncm}
												</RemovableBadge>
											))}
										</div>
									</div>
								</div>

								{/* CFOP/CST emitente and importacao fields */}
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<Label className='text-muted-foreground text-sm font-medium'>Regime Tributário do Emitente</Label>
										<Select value={formData.id_regime_emitente} onValueChange={(v) => handleInputChange('id_regime_emitente', v)}>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.id_regime_emitente}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione o regime' />
												</SelectTrigger>
											</div>
											<SelectContent>
												{isLoadingRegimes ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
												) : errorRegimes ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar regimes</div>
												) : Array.isArray(dataRegimes) && dataRegimes.length > 0 ? (
													(dataRegimes as RegimeTributario[]).map((r) => (
														<SelectItem key={r.id} value={r.id}>
															{r.ds_descricao}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhum regime encontrado</div>
												)}
											</SelectContent>
										</Select>
										{errors.id_regime_emitente && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.id_regime_emitente}
											</p>
										)}
									</div>

									<div className='space-y-2'>
										<MultiSelectSearch
											label='CFOP do Emitente'
											placeholder='Insira os CFOPs'
											options={cfopOptions}
											values={formData.js_cfop_origem}
											onChange={(vals) => handleInputChange('js_cfop_origem', vals)}
											className='w-full'
										/>
									</div>

									<div className='space-y-2'>
										<MultiSelectSearch
											label='CST do Emitente'
											placeholder='Insira os CSTs'
											options={cstOptions}
											values={formData.js_cst_origem}
											onChange={(vals) => handleInputChange('js_cst_origem', vals)}
											className='w-full'
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='text-foreground flex items-center gap-2 text-base'>
									<Code className='text-primary h-4 w-4' />
									Importação XML
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div className='space-y-2'>
										<Label className='text-muted-foreground text-sm font-medium'>CFOP Entrada</Label>
										<Select value={formData.id_cfop_entrada} onValueChange={(v) => handleInputChange('id_cfop_entrada', v)}>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.id_cfop_entrada}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<button
													type='button'
													aria-label='Limpar CFOP entrada'
													onClick={() => handleInputChange('id_cfop_entrada', '')}
													className={cn(
														'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
														formData.id_cfop_entrada
															? 'text-muted-foreground hover:text-destructive'
															: 'text-muted-foreground/40',
													)}
												>
													<X className='h-3 w-3' />
												</button>
											</div>
											<SelectContent>
												{isLoadingCFOP ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
												) : errorCFOP ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar CFOP</div>
												) : Array.isArray(dataCFOP) && dataCFOP.length > 0 ? (
													(dataCFOP as CfopItem[]).map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.ds_codigo}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhum CFOP encontrado</div>
												)}
											</SelectContent>
										</Select>
										{errors.id_cfop_entrada && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.id_cfop_entrada}
											</p>
										)}
									</div>

									<div className='space-y-2'>
										<Label className='text-muted-foreground text-sm font-medium'>CST Entrada</Label>
										<Select value={formData.id_cst_entrada} onValueChange={(v) => handleInputChange('id_cst_entrada', v)}>
											<div className='relative'>
												<SelectTrigger
													aria-invalid={!!errors.id_cst_entrada}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<button
													type='button'
													aria-label='Limpar CST entrada'
													onClick={() => handleInputChange('id_cst_entrada', MANTER_CST)}
													className={cn(
														'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
														formData.id_cst_entrada
															? 'text-muted-foreground hover:text-destructive'
															: 'text-muted-foreground/40',
													)}
												>
													<X className='h-3 w-3' />
												</button>
											</div>
											<SelectContent>
												<SelectItem key={MANTER_CST} value={MANTER_CST}>
													Manter CST da nota
												</SelectItem>
												{isLoadingCST ? (
													<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
												) : errorCST ? (
													<div className='p-2 text-sm text-red-600'>Erro ao carregar CST</div>
												) : Array.isArray(dataCST) && dataCST.length > 0 ? (
													(dataCST as CstItem[]).map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.ds_codigo}
														</SelectItem>
													))
												) : (
													<div className='text-muted-foreground p-2 text-sm'>Nenhum CST encontrado</div>
												)}
											</SelectContent>
										</Select>
										{errors.id_cst_entrada && (
											<p className='text-sm text-red-600' role='alert'>
												{errors.id_cst_entrada}
											</p>
										)}
									</div>
								</div>

								{/* Gerado fields inline with Importação XML */}
								<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div className='space-y-2'>
										<Label className='text-muted-foreground text-sm font-medium'>CFOP Gerado</Label>
										<div className='relative'>
											<Select value={formData.id_cfop_gerado} onValueChange={(v) => handleInputChange('id_cfop_gerado', v)}>
												<SelectTrigger
													aria-invalid={!!errors.id_cfop_gerado}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<SelectContent>
													{Array.isArray(dataCFOP) && dataCFOP.length > 0 ? (
														(dataCFOP as CfopItem[]).map((c) => (
															<SelectItem key={c.id} value={c.id}>
																{c.ds_codigo}
															</SelectItem>
														))
													) : (
														<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
													)}
												</SelectContent>
											</Select>
											<button
												type='button'
												aria-label='Limpar CFOP gerado'
												onClick={() => handleInputChange('id_cfop_gerado', '')}
												className={cn(
													'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
													formData.id_cfop_gerado
														? 'text-muted-foreground hover:text-destructive'
														: 'text-muted-foreground/40',
												)}
											>
												<X className='h-3 w-3' />
											</button>
										</div>
										{errors.id_cfop_gerado && <p className='text-sm text-red-600'>{errors.id_cfop_gerado}</p>}
									</div>

									<div className='space-y-2'>
										<Label className='text-muted-foreground text-sm font-medium'>CST Gerado</Label>
										<div className='relative'>
											<Select value={formData.id_cst_gerado} onValueChange={(v) => handleInputChange('id_cst_gerado', v)}>
												<SelectTrigger
													aria-invalid={!!errors.id_cst_gerado}
													className='focus:border-primary/50 w-full border-2 pr-8 transition-colors'
												>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem key={MANTER_CST} value={MANTER_CST}>
														Manter CST da nota
													</SelectItem>
													{isLoadingCST ? (
														<div className='text-muted-foreground p-2 text-sm'>Carregando...</div>
													) : errorCST ? (
														<div className='p-2 text-sm text-red-600'>Erro ao carregar CST</div>
													) : Array.isArray(dataCST) && dataCST.length > 0 ? (
														(dataCST as CstItem[]).map((c) => (
															<SelectItem key={c.id} value={c.id}>
																{c.ds_codigo}
															</SelectItem>
														))
													) : (
														<div className='text-muted-foreground p-2 text-sm'>Nenhum CST encontrado</div>
													)}
												</SelectContent>
											</Select>
											<button
												type='button'
												aria-label='Manter CST da nota'
												onClick={() => handleInputChange('id_cst_gerado', MANTER_CST)}
												className={cn(
													'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
													formData.id_cst_gerado ? 'text-muted-foreground hover:text-destructive' : 'text-muted-foreground/40',
												)}
											>
												<X className='h-3 w-3' />
											</button>
										</div>
										{errors.id_cst_gerado && <p className='text-sm text-red-600'>{errors.id_cst_gerado}</p>}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setOpen(false);
								resetForm();
							}}
						>
							<X className='mr-2 h-4 w-4' />
							<span className='hidden sm:inline'>Cancelar</span>
						</Button>
						<Button onClick={handleUpdate} disabled={isLoading}>
							<Plus className='mr-2 h-4 w-4' />
							{isLoading ? 'Atualizando...' : 'Salvar Alterações'}
							{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
						</Button>
					</DialogFooter>
				</div>
			</DialogContentLarge>
		</Dialog>
	);
}

export default BtnEditRegra;
