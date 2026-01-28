import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent, PopoverContentLarge } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContentLarge, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Building, Package, Search, Loader2, Check, Plus, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { updateDtSaidaEntregaNfe } from '@/services/api/documentos-fiscais';
import { NFEItem } from '@/services/api/nfe-items';
import { toast } from 'sonner';
import { useCompanyContext } from '@/context/company-context';
import { getItensNfe, insertItensAlterNfe } from '@/services/api/documentos-fiscais';
import { executeRegrasNfe } from '@/services/api/regras-nfe';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProdutosAtivosEmpresas } from '@/services/api/fiscal';
import BtnInsertProduto from '@/components/general/fiscal/btn-insert-produto';

type RuleNotAppliedReason =
	| 'DESTINO_UF'
	| 'ORIGEM_UF'
	| 'SEGMENTO_DEST'
	| 'REGIME_DEST'
	| 'REGIME_SEGMENTO_DEST'
	| 'REGIME_MISSING'
	| 'SEGMENTO_MISSING'
	| 'CRT_EMITENTE_MISSING'
	| 'CRT_EMITENTE_INCOMPATIVEL'
	| 'CFOP_INCOMPATIVEL'
	| 'CST_INCOMPATIVEL'
	| 'NCM_INCOMPATIVEL'
	| 'ORIGEM_TRIB_INCOMPATIVEL'
	| 'TIPO_PRODUTO_INCOMPATIVEL';

interface RuleExecutionItemResult {
	itemId: string;
	regraAplicada: string | null;
	pontuacao: number;
	motivoNaoAplicacao?: RuleNotAppliedReason;
}

interface RuleExecutionDocResult {
	documentoId: string;
	itens: RuleExecutionItemResult[];
}

interface RuleExecutionResponse {
	processados: number;
	itensProcessados: number;
	resultados: RuleExecutionDocResult[];
	docsNotFullyAppliedCount: number;
}
interface ItemSystemData {
	id_produto: string;
	cd_produto: string;
	ds_nome_produto: string;
	cd_cfop: string;
	ds_origem: string;
	cd_cst: string;
	ds_unidade: string;
	ds_tipo_item: string;
	cd_tipo_item: string;
	fl_conversao: boolean;
	ds_fator_conversao: string;
	ds_unidade_convertida: string;
}

interface Product {
	id: string;
	id_externo: string;
	ds_nome: string;
	cd_ncm?: string;
	ds_unidade?: string;
	ds_tipo_item?: string | number;
	descricao_tipo_item?: string;
	cd_tipo_item?: string | number;
}

interface ProductSearchProps {
	value: string;
	onSelect: (product: Product) => void;
	placeholder?: string;
	filterNcm?: string | null;
	filterTipo?: string | null; // 'produto' ou 'servico'
}

interface NFEItemsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nfeId?: string | null;
	headerData: {
		supplier: string;
		supplierUf: string;
		supplierMunicipio: string;
		supplierCrt?: string;
		nfeKey: string;
		invoiceNumber: string | number;
		series: string | number;
		issueDate: string;
		entryDate: string;
		ds_status: string;
	};
	onSaved?: () => void;
}

// componente de busca de produtos
const ProductSearch = React.memo<ProductSearchProps>(
	({ value, onSelect, placeholder = 'Buscar produto...', filterNcm = null, filterTipo = null }) => {
		const [searchTerm, setSearchTerm] = useState('');
		const [products, setProducts] = useState<Product[]>([]);
		const [loading, setLoading] = useState(false);
		const [open, setOpen] = useState(false);
		const { state } = useCompanyContext();
		const { data: dataProdutos, isFetching: isFetchingProdutos } = useQuery<Product[]>({
			queryKey: ['get-produtos-empresa', state, filterNcm ?? null, filterTipo ?? null],
			queryFn: () => getProdutosAtivosEmpresas(filterNcm ?? undefined, filterTipo ?? 'produto'),
			// Enabled when we have company state and either a filterNcm is provided OR the caller explicitly requests tipo 'servico'
			enabled: !!state && (filterNcm !== null || filterTipo === 'servico'),
		});

		const searchProducts = useCallback(
			async (search: string) => {
				setLoading(true);
				try {
					let filtered: Product[];

					const produtosBase = dataProdutos || [];

					if (!search.trim()) {
						filtered = produtosBase;
					} else {
						const searchLower = search.toLowerCase();
						filtered = produtosBase.filter((product) => {
							const nome = String(product.ds_nome || '').toLowerCase();
							const idExterno = String(product.id_externo || '').toLowerCase();
							const id = String((product as Product).id || '').toLowerCase();
							const ncm = String(product.cd_ncm || '').toLowerCase();
							return (
								nome.includes(searchLower) ||
								idExterno.includes(searchLower) ||
								id.includes(searchLower) ||
								ncm.includes(searchLower)
							);
						});
					}

					setProducts(filtered);
				} catch {
					toast.error('Erro ao buscar produtos');
					setProducts([]);
				} finally {
					setLoading(false);
				}
			},
			[dataProdutos],
		);

		useEffect(() => {
			if (open) {
				searchProducts(searchTerm);
			} else {
				setProducts([]);
			}
		}, [searchTerm, searchProducts, open]);

		const handleSelect = (product: Product) => {
			onSelect(product);
			setOpen(false);
			setSearchTerm('');
		};

		return (
			<Popover open={open} onOpenChange={setOpen} modal={true}>
				<PopoverTrigger asChild>
					<div className='flex gap-2'>
						<Input value={value} readOnly placeholder={placeholder} className='cursor-pointer' onClick={() => setOpen(true)} />
						<Button
							type='button'
							variant='outline'
							size='icon'
							onClick={() => setOpen(true)}
							disabled={isFetchingProdutos}
							title={isFetchingProdutos ? 'Carregando produtos...' : 'Buscar produto'}
						>
							{isFetchingProdutos ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
						</Button>
					</div>
				</PopoverTrigger>
				<PopoverContentLarge className='z-[100] overflow-hidden p-0' align='start'>
					<div className='flex h-96 flex-col'>
						{/* campo de busca */}
						<div className='bg-background flex-shrink-0 border-b p-4'>
							<div className='relative'>
								<Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
								<Input
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder='Digite para buscar produtos...'
									className='pl-10'
									autoFocus
								/>
							</div>
						</div>
						{/* resultados */}
						<div
							className='flex-1 overflow-y-auto scroll-smooth'
							style={{
								scrollbarWidth: 'thin',
								scrollbarColor: 'hsl(var(--border)) transparent',
								overscrollBehavior: 'contain',
							}}
							onWheel={(e) => {
								e.stopPropagation();
							}}
						>
							{loading ? (
								<div className='flex items-center justify-center p-6'>
									<Loader2 className='h-4 w-4 animate-spin' />
									<span className='text-muted-foreground ml-2 text-sm'>Buscando produtos...</span>
								</div>
							) : products.length > 0 ? (
								<div className='p-2'>
									{products.map((product) => (
										<div
											key={product.id}
											className='hover:bg-muted cursor-pointer rounded-md p-3 transition-colors'
											onClick={() => handleSelect(product)}
										>
											<div className='flex items-start justify-between'>
												<div className='flex-1'>
													<div className='flex items-center gap-2'>
														<span className='text-sm font-medium'>{product.ds_nome}</span>
														<Badge variant='secondary' className='text-xs'>
															{product.id_externo}
														</Badge>
													</div>
													{product.cd_ncm && <p className='text-muted-foreground mt-1 text-xs'>NCM: {product.cd_ncm}</p>}
													<div className='mt-2 flex gap-2'>
														{product.ds_unidade && (
															<Badge variant='outline' className='text-xs'>
																{product.ds_unidade}
															</Badge>
														)}
														{(product.descricao_tipo_item || product.ds_tipo_item) && (
															<Badge variant='outline' className='text-xs'>
																{product.cd_tipo_item
																	? `${product.cd_tipo_item} - ${product.descricao_tipo_item ?? product.ds_tipo_item}`
																	: (product.descricao_tipo_item ?? product.ds_tipo_item)}
															</Badge>
														)}
													</div>
												</div>
												<Check className='text-muted-foreground h-4 w-4 opacity-0 group-hover:opacity-100' />
											</div>
										</div>
									))}
								</div>
							) : searchTerm ? (
								<div className='flex flex-col items-center justify-center p-6 text-center'>
									<Package className='text-muted-foreground mb-2 h-8 w-8' />
									<p className='text-muted-foreground text-sm'>Nenhum produto encontrado</p>
									<p className='text-muted-foreground mt-1 text-xs'>Tente buscar por nome, código ou descrição</p>
								</div>
							) : (dataProdutos || []).length === 0 ? (
								<div className='flex flex-col items-center justify-center p-6 text-center'>
									<Package className='text-muted-foreground mb-2 h-8 w-8' />
									<p className='text-muted-foreground text-sm'>Nenhum produto cadastrado</p>
									<p className='text-muted-foreground mt-1 text-xs'>Cadastre produtos para visualizá-los aqui</p>
								</div>
							) : (
								<div className='flex items-center justify-center p-6'>
									<Loader2 className='h-4 w-4 animate-spin' />
									<span className='text-muted-foreground ml-2 text-sm'>Carregando produtos...</span>
								</div>
							)}
						</div>
					</div>
				</PopoverContentLarge>
			</Popover>
		);
	},
);

ProductSearch.displayName = 'ProductSearch';

// alterações de itens
interface NfeAlterEntry {
	id_nfe_item: string;
	id_regra_nfe_entrada: string | null;
	id_cfop_alterado: string | null;
	ds_codigo_cfop_alterado: string | null;
	id_cst_gerado: string | null;
	ds_codigo_cst_gerado: string | null;
	id_produto_alterado: string;
	cd_produto_alterado: string;
	fl_conversao?: boolean;
	ds_conversao?: string; // fator de conversão
	ds_quantidade_alterada?: string;
	fis_produtos?: Product | null;
}

export function NFEItemsModal({ open, onOpenChange, nfeId, headerData, onSaved }: NFEItemsModalProps) {
	const { state } = useCompanyContext();
	const [localHeaderData, setLocalHeaderData] = useState(headerData);
	// bloqueia ações quando a NFE estiver em status de conferido/digitado fiscal
	const isStatusLocked =
		headerData?.ds_status === 'DIGITADO_FISCAL' ||
		headerData?.ds_status === 'CONFERIDO_FISCAL' ||
		headerData?.ds_status === 'INTEGRACAO_ESCRITA' ||
		headerData?.ds_status === 'OPERACAO_NAO_REALIZADA' ||
		headerData?.ds_status === 'CANCELADO';
	const [items, setItems] = useState<NFEItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	// estado para feedback visual das ações de regras
	const [applyingRules, setApplyingRules] = useState(false);
	const [itemsSystemData, setItemsSystemData] = useState<Record<string, ItemSystemData>>({});
	const [savingItems, setSavingItems] = useState<Record<string, boolean>>({});
	// armazenar motivos de não aplicação de regras por item
	const [itemsNotAppliedReasons, setItemsNotAppliedReasons] = useState<Record<string, RuleNotAppliedReason | null>>({});

	const {
		data: nfeQueryItems,
		isFetching: isFetchingNfeItems,
		isError: nfeQueryIsError,
		error: nfeQueryError,
	} = useQuery<NFEItem[], Error>({
		queryKey: ['get-itens-nfe', nfeId],
		queryFn: () => getItensNfe(nfeId!),
		enabled: !!state && open && !!nfeId,
	});

	const queryClient = useQueryClient();

	useEffect(() => {
		setLoading(!!isFetchingNfeItems);
	}, [isFetchingNfeItems]);

	useEffect(() => {
		if (nfeQueryIsError && nfeQueryError) {
			toast.error(`Erro ao carregar itens da NFE: ${String(nfeQueryError)}`);
		}
	}, [nfeQueryIsError, nfeQueryError]);

	const prevNfeIdsRef = React.useRef<string>('');
	useEffect(() => {
		const data = (nfeQueryItems as NFEItem[]) || [];

		// build a key that includes not only item ids but also the main fields
		// from the first alteration entry so the effect runs when alters change
		const currentKey = data
			.map((d) => {
				const alter = (d as NFEItem).fis_nfe_itens_alter_entrada?.[0] as NfeAlterEntry | undefined;
				const alterSnapshot = alter
					? JSON.stringify({
							id_regra: alter.id_regra_nfe_entrada,
							ds_codigo_cfop_alterado: alter.ds_codigo_cfop_alterado,
							ds_codigo_cst_gerado: alter.ds_codigo_cst_gerado,
							id_produto_alterado: alter.id_produto_alterado,
							cd_produto_alterado: alter.cd_produto_alterado,
							fl_conversao: alter.fl_conversao,
							ds_conversao: alter.ds_conversao,
						})
					: '';

				return `${d.id}|${alterSnapshot}`;
			})
			.join(';');

		if (currentKey === prevNfeIdsRef.current) return;
		prevNfeIdsRef.current = currentKey;

		setItems(data);

		setItemsSystemData((prev) => {
			const next: Record<string, ItemSystemData> = { ...prev };
			let changed = false;

			(data as NFEItem[]).forEach((item: NFEItem) => {
				const alters = item.fis_nfe_itens_alter_entrada as NfeAlterEntry[];
				if (alters && alters.length > 0) {
					const alter = alters[0];
					const nestedProd = alter.fis_produtos ?? null;
					const prod = nestedProd && nestedProd.id ? nestedProd : undefined;

					const incoming: ItemSystemData = {
						id_produto: alter.id_produto_alterado,
						cd_produto: alter.cd_produto_alterado,
						ds_nome_produto: prod?.ds_nome || '',
						cd_cfop: alter.ds_codigo_cfop_alterado || '',
						ds_origem: item.ds_origem,
						cd_cst: alter.ds_codigo_cst_gerado || '',
						ds_unidade: prod?.ds_unidade || '',
						ds_tipo_item: prod ? String(prod.descricao_tipo_item ?? prod.ds_tipo_item ?? '') : '',
						cd_tipo_item: prod?.cd_tipo_item
							? String(prod.cd_tipo_item)
							: prod && prod.ds_tipo_item && /^\d+$/.test(String(prod.ds_tipo_item))
								? String(prod.ds_tipo_item)
								: '',
						fl_conversao: alter.fl_conversao ?? false,
						ds_fator_conversao: alter.ds_conversao ?? '1',
						ds_unidade_convertida: alter.ds_quantidade_alterada ?? '',
					};

					const existing = prev[item.id];

					const merged: ItemSystemData = {
						id_produto: incoming.id_produto || existing?.id_produto || '',
						cd_produto: incoming.cd_produto || existing?.cd_produto || '',
						ds_nome_produto: existing?.ds_nome_produto || incoming.ds_nome_produto || '',
						cd_cfop: incoming.cd_cfop || existing?.cd_cfop || '',
						ds_origem: incoming.ds_origem || existing?.ds_origem || '',
						cd_cst: incoming.cd_cst || existing?.cd_cst || '',
						ds_unidade: existing?.ds_unidade || incoming.ds_unidade || '',
						ds_tipo_item: existing?.ds_tipo_item || incoming.ds_tipo_item || '',
						cd_tipo_item: existing?.cd_tipo_item || incoming.cd_tipo_item || '',
						fl_conversao: typeof existing?.fl_conversao === 'boolean' ? existing!.fl_conversao : incoming.fl_conversao,
						ds_fator_conversao: existing?.ds_fator_conversao || incoming.ds_fator_conversao || '1',
						ds_unidade_convertida: existing?.ds_unidade_convertida || incoming.ds_unidade_convertida || '',
					};

					const areEqual = JSON.stringify(existing) === JSON.stringify(merged);
					if (!areEqual) {
						next[item.id] = merged;
						changed = true;
					}
				}
			});

			return changed ? next : prev;
		});
	}, [nfeQueryItems]);

	const handleSaveAllItems = async (shouldClose: boolean = true) => {
		if (saving) return;
		setSaving(true);
		const payload = items.map((item) => {
			const system = itemsSystemData[item.id] || ({} as ItemSystemData);
			return {
				id_item: item.id,
				ds_ordem: item.ds_ordem,
				id_produto: system.id_produto || null,
				cd_produto: system.cd_produto || null,
				ds_nome_produto: system.ds_nome_produto || null,
				cd_cfop: system.cd_cfop || null,
				ds_origem: system.ds_origem || null,
				cd_cst: system.cd_cst || null,
				ds_unidade: system.ds_unidade || null,
				ds_tipo_item: system.ds_tipo_item || null,
				cd_tipo_item: system.cd_tipo_item || null,
				fl_conversao: !!system.fl_conversao,
				ds_fator_conversao: system.ds_fator_conversao,
				ds_unidade_convertida: system.ds_unidade_convertida,
			};
		});

		try {
			// inserção de itens na NFe
			await insertItensAlterNfe({ id_nfe: nfeId!, itens: payload });
			toast.success('Todos os itens foram salvos com sucesso!');

			if (shouldClose) {
				await queryClient.invalidateQueries({ queryKey: ['get-itens-nfe', nfeId] });
				onOpenChange(false);
				onSaved?.();
			}
		} catch (err) {
			console.error('Erro ao salvar itens:', err);
			toast.error(`Erro ao salvar itens: ${String(err)}`);
		} finally {
			setSaving(false);
		}
	};
	const handleSaveItem = async (item: NFEItem) => {
		const itemId = item.id;
		if (savingItems[itemId]) return;
		setSavingItems((s) => ({ ...s, [itemId]: true }));

		const system = itemsSystemData[itemId] || ({} as ItemSystemData);
		const payloadItem = {
			id_item: item.id,
			ds_ordem: item.ds_ordem,
			id_produto: system.id_produto || null,
			cd_produto: system.cd_produto || null,
			ds_nome_produto: system.ds_nome_produto || null,
			cd_cfop: system.cd_cfop || null,
			ds_origem: system.ds_origem || null,
			cd_cst: system.cd_cst || null,
			ds_unidade: system.ds_unidade || null,
			ds_tipo_item: system.ds_tipo_item || null,
			cd_tipo_item: system.cd_tipo_item || null,
			fl_conversao: !!system.fl_conversao,
			ds_fator_conversao: system.ds_fator_conversao,
			ds_unidade_convertida: system.ds_unidade_convertida,
		};

		try {
			await insertItensAlterNfe({ id_nfe: nfeId!, itens: [payloadItem] });
			toast.success('Item salvo com sucesso!');
			await queryClient.invalidateQueries({ queryKey: ['get-itens-nfe', nfeId] });
			onSaved?.();
		} catch (err) {
			console.error('Erro ao salvar item:', err);
			toast.error(`Erro ao salvar item: ${String(err)}`);
		} finally {
			setSavingItems((s) => ({ ...s, [itemId]: false }));
		}
	};

	const formatCurrency = (value: string) => {
		const numValue = parseFloat(value) / 100;
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(numValue);
	};

	// const formatQuantity = (quantity: string) => {
	// 	const numValue = parseFloat(quantity) / 100;
	// 	return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
	// };

	const formatQuantity4 = (quantity: string) => {
		const numValue = parseFloat(quantity) / 10000;
		return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
	};

	// Mapear origem conforme regra: 1 -> 2, 6 -> 7. Retorna string pronta para exibição.
	const mapOrigemDisplay = (orig?: string | null) => {
		if (orig === undefined || orig === null) return '';
		if (orig === '1') return '2';
		if (orig === '6') return '7';
		return orig;
	};

	// Traduzir motivo de não aplicação da regra para português
	const translateReasonNotApplied = (reason?: RuleNotAppliedReason | null): string => {
		if (!reason) return '';
		const translations: Record<RuleNotAppliedReason, string> = {
			DESTINO_UF: 'UF de destino incompatível',
			ORIGEM_UF: 'UF de origem incompatível',
			SEGMENTO_DEST: 'Segmento do destinatário incompatível',
			REGIME_DEST: 'Regime tributário do destinatário incompatível',
			REGIME_SEGMENTO_DEST: 'Regime e segmento do destinatário não configurados para a empresa',
			REGIME_MISSING: 'Regime do destinatário não configurado para a empresa',
			SEGMENTO_MISSING: 'Segmento do destinatário não configurado para a empresa',
			CRT_EMITENTE_MISSING: 'CRT do emitente não configurado',
			CRT_EMITENTE_INCOMPATIVEL: 'CRT do emitente incompatível',
			CFOP_INCOMPATIVEL: 'CFOP incompatível — não foi possível encontrar regra para essa UF e regime tributário',
			CST_INCOMPATIVEL: 'CST incompatível — não foi possível encontrar regra para essa UF e regime tributário',
			ORIGEM_TRIB_INCOMPATIVEL: 'Origem tributária incompatível — não foi possível encontrar regra para essa UF e regime tributário',
			NCM_INCOMPATIVEL: 'NCM incompatível',
			TIPO_PRODUTO_INCOMPATIVEL: 'Tipo de produto incompatível — não existe regra para a combinação UF e regime para esse tipo de item',
		};
		return translations[reason] || reason;
	};

	// Mapear CRT do fornecedor para descrição legível
	const mapSupplierCrt = (crt?: string | null) => {
		if (crt === undefined || crt === null) return '';
		const v = String(crt).trim();
		switch (v) {
			case '1':
				return 'Simples Nacional';
			case '2':
				return 'Simples Nacional, excesso sublimite';
			case '3':
				return 'Regime Normal';
			default:
				return v;
		}
	};

	const updateItemSystemData = (itemId: string, field: keyof ItemSystemData, value: string | boolean) => {
		setItemsSystemData((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				[field]: value,
			},
		}));
	};

	const calculateConvertedUnit = (originalQuantity: string, factor: string): string => {
		if (!factor || factor === '0' || factor === '') return '0';
		const quantity = parseFloat(originalQuantity) / 10000;
		const conversionFactor = parseFloat(factor);
		if (isNaN(quantity) || isNaN(conversionFactor)) return '0';
		const converted = quantity * conversionFactor;
		return converted.toLocaleString('pt-BR', { minimumFractionDigits: 4 });
	};

	const getItemSystemData = (itemId: string): ItemSystemData => {
		return (
			itemsSystemData[itemId] || {
				id_produto: '',
				cd_produto: '',
				ds_nome_produto: '',
				cd_cfop: '',
				ds_origem: '',
				cd_cst: '',
				ds_unidade: '',
				ds_tipo_item: '',
				cd_tipo_item: '',
				fl_conversao: false,
				ds_fator_conversao: '1',
				ds_unidade_convertida: '',
			}
		);
	};

	const handleApplyRules = async () => {
		if (applyingRules) return;
		setApplyingRules(true);
		await handleSaveAllItems(false);
		// filtra todos os itens que possuem produto vinculado (não importa se já têm regra)
		const candidateItems = items.filter((item) => {
			const system = itemsSystemData[item.id];
			return !!(system && system.id_produto);
		});

		if (candidateItems.length === 0) {
			toast.error('Nenhum item possui produto vinculado. Vincule produtos aos itens antes de aplicar regras.');
			setApplyingRules(false);
			return;
		}

		// envia os ids da NFE (dedupe caso necessário)
		const nfeIdsToApply = Array.from(new Set(candidateItems.map((i) => i.id_fis_nfe)));

		try {
			const response = await executeRegrasNfe({ nfeIds: nfeIdsToApply });

			// Processar motivos de não aplicação
			let hasNotAppliedItems = false;
			if (response && 'resultados' in response) {
				const typedResponse = response as RuleExecutionResponse;
				const notAppliedMap: Record<string, RuleNotAppliedReason | null> = {};
				typedResponse.resultados.forEach((result: RuleExecutionDocResult) => {
					result.itens.forEach((itemResult: RuleExecutionItemResult) => {
						notAppliedMap[itemResult.itemId] = itemResult.motivoNaoAplicacao || null;
						if (itemResult.motivoNaoAplicacao) {
							hasNotAppliedItems = true;
						}
					});
				});
				setItemsNotAppliedReasons(notAppliedMap);
			}

			if (hasNotAppliedItems) {
				toast.warning('Algumas regras não foram aplicadas. Verifique os motivos indicados em cada item.', { duration: 5000 });
			} else {
				toast.success('Regras aplicadas com sucesso!');
			}
			let freshItems: NFEItem[] | undefined;
			try {
				freshItems = (await queryClient.fetchQuery({
					queryKey: ['get-itens-nfe', nfeId],
					queryFn: () => getItensNfe(nfeId!),
				})) as NFEItem[];
			} catch {
				freshItems =
					(queryClient.getQueryData(['get-itens-nfe', nfeId]) as NFEItem[] | undefined) ||
					(nfeQueryItems as NFEItem[] | undefined) ||
					[];
			}

			if (freshItems && freshItems.length > 0) {
				setItemsSystemData((prev) => {
					const next: Record<string, ItemSystemData> = { ...prev };

					freshItems!.forEach((item) => {
						const alters = item.fis_nfe_itens_alter_entrada as NfeAlterEntry[];
						if (!alters || alters.length === 0) return;
						const alter = alters[0];
						const nestedProd = alter.fis_produtos ?? null;
						const prod = nestedProd && nestedProd.id ? nestedProd : undefined;

						const incoming: ItemSystemData = {
							id_produto: alter.id_produto_alterado,
							cd_produto: alter.cd_produto_alterado,
							ds_nome_produto: prod?.ds_nome || '',
							cd_cfop: alter.ds_codigo_cfop_alterado || '',
							ds_origem: item.ds_origem,
							cd_cst: alter.ds_codigo_cst_gerado || '',
							ds_unidade: prod?.ds_unidade || '',
							ds_tipo_item: prod ? String(prod.descricao_tipo_item ?? prod.ds_tipo_item ?? '') : '',
							cd_tipo_item: prod?.cd_tipo_item
								? String(prod.cd_tipo_item)
								: prod && prod.ds_tipo_item && /^\d+$/.test(String(prod.ds_tipo_item))
									? String(prod.ds_tipo_item)
									: '',
							fl_conversao: alter.fl_conversao ?? false,
							ds_fator_conversao: alter.ds_conversao ?? '1',
							ds_unidade_convertida: alter.ds_quantidade_alterada ?? '',
						};

						const existing = prev[item.id];

						const merged: ItemSystemData = {
							id_produto: existing?.id_produto || incoming.id_produto || '',
							cd_produto: existing?.cd_produto || incoming.cd_produto || '',
							ds_nome_produto: existing?.ds_nome_produto || incoming.ds_nome_produto || '',
							cd_cfop: incoming.cd_cfop || '',
							ds_origem: incoming.ds_origem || '',
							cd_cst: incoming.cd_cst || '',
							ds_unidade: existing?.ds_unidade || incoming.ds_unidade || '',
							ds_tipo_item: existing?.ds_tipo_item || incoming.ds_tipo_item || '',
							cd_tipo_item: existing?.cd_tipo_item || incoming.cd_tipo_item || '',
							fl_conversao: typeof existing?.fl_conversao === 'boolean' ? existing!.fl_conversao : incoming.fl_conversao,
							ds_fator_conversao: existing?.ds_fator_conversao || incoming.ds_fator_conversao || '1',
							ds_unidade_convertida: existing?.ds_unidade_convertida || incoming.ds_unidade_convertida || '',
						};

						next[item.id] = merged;
					});

					return next;
				});
			} else {
				setItemsSystemData((prev) => {
					const next: Record<string, ItemSystemData> = {};
					Object.entries(prev).forEach(([key, v]) => {
						next[key] = {
							id_produto: v?.id_produto ?? '',
							cd_produto: v?.cd_produto ?? '',
							ds_nome_produto: v?.ds_nome_produto ?? '',
							ds_unidade: v?.ds_unidade ?? '',
							ds_tipo_item: v?.ds_tipo_item ?? '',
							cd_tipo_item: v?.cd_tipo_item ?? '',
							cd_cfop: '',
							ds_origem: '',
							cd_cst: '',
							fl_conversao: false,
							ds_fator_conversao: '1',
							ds_unidade_convertida: '',
						};
					});
					return next;
				});
			}

			await queryClient.invalidateQueries({ queryKey: ['get-itens-nfe', nfeId] });
			onSaved?.();
		} catch (error) {
			console.error('Erro ao aplicar regras:', error);
			toast.error(`Erro ao aplicar regras: ${String(error)}`);
		} finally {
			setApplyingRules(false);
		}
	};

	const handleCancel = () => {
		setItemsSystemData({});
		onOpenChange(false);
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContentLarge className='flex max-h-[95vh] max-w-7xl flex-col overflow-hidden'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-xl font-semibold'>
						<FileText className='h-5 w-5' />
						Itens da Nota Fiscal Eletrônica
					</DialogTitle>
				</DialogHeader>

				{loading ? (
					<div className='flex flex-1 items-center justify-center py-20'>
						<div className='flex flex-col items-center gap-4'>
							<Loader2 className='h-8 w-8 animate-spin' />
							<p className='text-muted-foreground'>Carregando itens da NFE...</p>
						</div>
					</div>
				) : (
					<>
						{/* Cabeçalho da NFE */}
						<Card className='bg-muted/30 flex-shrink-0'>
							<CardHeader className='pb-3'>
								<CardTitle className='flex items-center gap-2 text-lg'>
									<Building className='h-5 w-5' />
									Informações da Nota Fiscal
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<div>
											<span className='text-muted-foreground text-sm font-medium'>Fornecedor:</span>
											<p className='font-medium'>{headerData.supplier}</p>
										</div>
										<div>
											<span className='text-muted-foreground text-sm font-medium'>Chave NFE:</span>
											<p className='font-mono text-xs break-all'>{headerData.nfeKey}</p>
										</div>
									</div>
									<div className='space-y-2'>
										<div className='flex gap-4'>
											<div>
												<span className='text-muted-foreground text-sm font-medium'>Número:</span>
												<p className='font-medium'>{headerData.invoiceNumber}</p>
											</div>
											<div>
												<span className='text-muted-foreground text-sm font-medium'>Série:</span>
												<p className='font-medium'>{headerData.series}</p>
											</div>
										</div>
										<div className='flex items-center gap-4'>
											<div>
												<span className='text-muted-foreground text-sm font-medium'>Data Emissão:</span>
												<p className='font-medium'>{headerData.issueDate}</p>
											</div>
											<div className='flex items-center gap-2'>
												<div>
													<span className='text-muted-foreground text-sm font-medium'>Data Entrada:</span>
													<p className='font-medium'>{headerData.entryDate}</p>
												</div>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant='ghost'
															size='icon'
															aria-label='Alterar data de entrada'
															disabled={isStatusLocked}
														>
															<CalendarIcon className='h-4 w-4' />
														</Button>
													</PopoverTrigger>
													<PopoverContent className='w-auto p-0'>
														<UiCalendar
															mode='single'
															locale={ptBR}
															selected={
																localHeaderData?.entryDate
																	? ((): Date | undefined => {
																			const parts = localHeaderData.entryDate.split('/');
																			if (parts.length !== 3) return undefined;
																			const dd = Number(parts[0]);
																			const mm = Number(parts[1]);
																			const yyyy = Number(parts[2]);
																			if (Number.isNaN(dd) || Number.isNaN(mm) || Number.isNaN(yyyy)) return undefined;
																			// construct local date to avoid timezone shifts caused by Date("yyyy-mm-dd") parsing as UTC
																			return new Date(yyyy, mm - 1, dd);
																		})()
																	: undefined
															}
															onSelect={async (date: Date | undefined) => {
																if (!date || !nfeId) return;
																try {
																	const iso = format(date, 'yyyy-MM-dd');
																	await updateDtSaidaEntregaNfe(nfeId, iso);
																	const display = format(date, 'dd/MM/yyyy');
																	setLocalHeaderData((prev) => ({ ...(prev || headerData), entryDate: display }));
																	toast.success('Data de entrada atualizada');
																	onSaved?.();
																} catch (err) {
																	console.error('Erro ao atualizar data de entrada:', err);
																	toast.error(`Erro ao atualizar data: ${String(err)}`);
																}
															}}
														/>
													</PopoverContent>
												</Popover>
											</div>
										</div>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center gap-6'>
											<div>
												<span className='text-muted-foreground text-sm font-medium'>UF:</span>
												<p className='font-medium'>{headerData.supplierUf}</p>
											</div>
											<div>
												<span className='text-muted-foreground text-sm font-medium'>Município:</span>
												<p className='font-medium'>{headerData.supplierMunicipio}</p>
											</div>
										</div>
										<div>
											<span className='text-muted-foreground text-sm font-medium'>CRT:</span>
											<p className='font-medium'>{mapSupplierCrt(headerData.supplierCrt)}</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Informações dos itens */}
						<div className='bg-muted/20 flex flex-shrink-0 items-center justify-between rounded-lg p-3'>
							<div className='flex items-center gap-4'>
								<span className='text-muted-foreground text-sm font-medium'>Total de {items.length} item(s)</span>
								<Badge variant='outline' className='gap-1'>
									<Package className='h-3 w-3' />
									Todos os itens
								</Badge>
							</div>
							<div className='flex gap-2'>
								<Button onClick={handleApplyRules} variant='outline' size='sm' disabled={applyingRules || isStatusLocked}>
									{applyingRules ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Aplicando Regras...
										</>
									) : (
										'Aplicar Regras'
									)}
								</Button>
							</div>
						</div>

						{/* Lista de Itens */}
						<div className='flex-1 space-y-6 overflow-y-auto pr-2'>
							{items.map((item, index) => {
								const systemData = getItemSystemData(item.id);

								// detectar se já existe uma regra aplicada para este item
								const alters = item.fis_nfe_itens_alter_entrada as NfeAlterEntry[] | undefined;
								const hasRuleApplied = !!(alters && alters.length > 0 && alters[0].id_regra_nfe_entrada);

								return (
									<div key={item.id} className='bg-card rounded-lg border p-4'>
										{/* Cabeçalho do Item */}
										<div className='mb-4 flex items-center justify-between border-b pb-2'>
											<div className='flex items-center gap-2'>
												<Badge variant='secondary' className='gap-1'>
													<Package className='h-3 w-3' />
													Item {index + 1}
												</Badge>
												<span className='text-muted-foreground text-sm'>Ordem: {item.ds_ordem}</span>
											</div>
										</div>

										{/* Conteúdo do Item */}
										<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
											{/* Lado Esquerdo - Dados Originais */}
											<Card>
												<CardHeader className='pb-3'>
													<CardTitle className='flex items-center gap-2 text-base'>
														<FileText className='h-4 w-4' />
														Dados Originais do Documento
													</CardTitle>
												</CardHeader>
												<CardContent className='space-y-4'>
													<div className='grid grid-cols-1 gap-4'>
														<div className='flex items-end gap-3'>
															<div className='w-25'>
																<label className='text-muted-foreground text-sm font-medium'>Código</label>
																<Input value={item.ds_codigo ?? ''} readOnly className='bg-muted/50' />
															</div>
															<div className='flex-1'>
																<label className='text-muted-foreground text-sm font-medium'>Nome do Item</label>
																<Input value={item.ds_produto ?? ''} readOnly className='bg-muted/50' />
															</div>
														</div>

														<div className='grid grid-cols-3 gap-3'>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>CFOP</label>
																<Input value={item.cd_cfop ?? ''} readOnly className='bg-muted/50' />
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Origem</label>
																<Input value={mapOrigemDisplay(item.ds_origem)} readOnly className='bg-muted/50' />
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>CST</label>
																<Input value={item.ds_cst ?? '-'} readOnly className='bg-muted/50' />
															</div>
														</div>

														<div className='grid grid-cols-3 gap-3'>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>NCM</label>
																<Input value={item.cd_ncm ?? ''} readOnly className='bg-muted/50' />
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Unitário</label>
																<Input
																	value={formatQuantity4(item.vl_quantidade ?? '0')}
																	readOnly
																	className='bg-muted/50'
																/>
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Unidade de Medida</label>
																<Input value={item.ds_unidade ?? ''} readOnly className='bg-muted/50' />
															</div>
														</div>

														<div>
															<label className='text-muted-foreground text-sm font-medium'>Valor Total</label>
															<Input
																value={formatCurrency(item.vl_total ?? '0')}
																readOnly
																className='bg-muted/50 font-medium'
															/>
														</div>
													</div>
												</CardContent>
											</Card>

											{/* Lado Direito - Dados do Sistema */}
											<Card className={`${hasRuleApplied ? '' : 'border-red-300 ring-1 ring-red-200/30 dark:border-red-900'}`}>
												<CardHeader className='pb-3'>
													<div className='flex items-center justify-between'>
														<CardTitle className='flex items-center gap-2 text-base'>
															<Package className='h-4 w-4' />
															Dados do Sistema
														</CardTitle>
														{itemsNotAppliedReasons[item.id] && (
															<div className='flex items-center gap-2 rounded-md bg-yellow-50 px-2 py-1 dark:bg-yellow-950'>
																<AlertCircle className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
																<span className='text-xs font-medium text-yellow-700 dark:text-yellow-300'>
																	{translateReasonNotApplied(itemsNotAppliedReasons[item.id])}
																</span>
															</div>
														)}
													</div>
												</CardHeader>
												<CardContent className='space-y-4'>
													<div className='grid grid-cols-1 gap-4'>
														<div className='flex items-end gap-3'>
															<div className='w-25'>
																<label className='text-muted-foreground text-sm font-medium'>Código</label>
																<Input value={systemData?.cd_produto || ''} readOnly className='bg-muted/50' />
															</div>
															<div className='flex-1'>
																<label className='text-muted-foreground text-sm font-medium'>Produto</label>
																<div className='flex items-center gap-2'>
																	<div className='flex-1'>
																		{
																			// detectar condição de serviço: CFOP 5933 e NCM vazio ou zeros
																			(() => {
																				const cfopIs5933 = String(item.cd_cfop || '').trim() === '5933';
																				const ncmRaw = String(item.cd_ncm || '').replace(/[^0-9]/g, '');
																				const ncmIsEmptyLike = ncmRaw === '' || /^0+$/.test(ncmRaw);
																				const shouldFetchAsServico = cfopIs5933 && ncmIsEmptyLike;

																				return (
																					<ProductSearch
																						value={systemData.ds_nome_produto ?? ''}
																						onSelect={(product) => {
																							updateItemSystemData(item.id, 'id_produto', product.id);
																							updateItemSystemData(item.id, 'cd_produto', product.id_externo);
																							updateItemSystemData(item.id, 'ds_nome_produto', product.ds_nome);
																							if (product.ds_unidade) {
																								updateItemSystemData(item.id, 'ds_unidade', product.ds_unidade);
																							}
																							{
																								const tipoDesc =
																									product.descricao_tipo_item ?? product.ds_tipo_item;
																								if (tipoDesc) {
																									updateItemSystemData(item.id, 'ds_tipo_item', String(tipoDesc));
																								}
																							}
																							{
																								const codigoTipo =
																									product.cd_tipo_item ??
																									(product.ds_tipo_item &&
																									/^\d+$/.test(String(product.ds_tipo_item))
																										? product.ds_tipo_item
																										: undefined);
																								if (codigoTipo !== undefined && codigoTipo !== null) {
																									updateItemSystemData(
																										item.id,
																										'cd_tipo_item',
																										String(codigoTipo),
																									);
																								}
																							}
																						}}
																						placeholder='Buscar produto...'
																						filterNcm={shouldFetchAsServico ? null : item.cd_ncm}
																						filterTipo={shouldFetchAsServico ? 'servico' : null}
																					/>
																				);
																			})()
																		}
																	</div>
																	{/* Botão para criar novo produto */}
																	<BtnInsertProduto
																		onCreated={(product) => {
																			// atualiza os dados do item com o produto criado
																			updateItemSystemData(item.id, 'id_produto', product.id || '');
																			updateItemSystemData(item.id, 'cd_produto', product.id_externo || '');
																			updateItemSystemData(item.id, 'ds_nome_produto', product.ds_nome || '');
																			if (product.ds_unidade)
																				updateItemSystemData(item.id, 'ds_unidade', product.ds_unidade);
																			{
																				const tipoDesc =
																					(
																						product as unknown as {
																							descricao_tipo_item?: string;
																							ds_tipo_item?: string | number;
																						}
																					).descricao_tipo_item ??
																					(product as unknown as { ds_tipo_item?: string | number }).ds_tipo_item;
																				if (tipoDesc) updateItemSystemData(item.id, 'ds_tipo_item', String(tipoDesc));
																			}
																			{
																				const codigoTipo = product as unknown as {
																					cd_tipo_item?: string | number;
																					ds_tipo_item?: string | number;
																				};
																				const codigo =
																					codigoTipo.cd_tipo_item ??
																					(codigoTipo.ds_tipo_item && /^\d+$/.test(String(codigoTipo.ds_tipo_item))
																						? codigoTipo.ds_tipo_item
																						: undefined);
																				if (codigo !== undefined && codigo !== null)
																					updateItemSystemData(item.id, 'cd_tipo_item', String(codigo));
																			}
																		}}
																		defaultNcm={item.cd_ncm}
																	>
																		<Button type='button' variant='outline' size='icon' title='Criar produto'>
																			<Plus className='h-4 w-4' />
																		</Button>
																	</BtnInsertProduto>
																</div>
															</div>
														</div>

														<div className='grid grid-cols-3 gap-3'>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>CFOP</label>
																<Input
																	value={systemData.cd_cfop ?? ''}
																	readOnly
																	disabled
																	className='bg-muted/50'
																	placeholder=''
																/>
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Origem</label>
																<Input
																	value={systemData.ds_origem ?? ''}
																	readOnly
																	disabled
																	className='bg-muted/50'
																	placeholder=''
																/>
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>CST</label>
																<Input
																	value={systemData.cd_cst ?? ''}
																	readOnly
																	disabled
																	className='bg-muted/50'
																	placeholder=''
																/>
															</div>
														</div>

														<div className='grid grid-cols-2 gap-3'>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Unidade de Medida</label>
																<Input
																	value={systemData.ds_unidade ?? ''}
																	readOnly
																	className='bg-muted/50'
																	placeholder=''
																/>
															</div>
															<div>
																<label className='text-muted-foreground text-sm font-medium'>Tipo do Item</label>
																<Input
																	value={(() => {
																		const cd = systemData.cd_tipo_item ?? '';
																		const ds = systemData.ds_tipo_item ?? '';
																		if (cd && ds) return `${cd} - ${ds}`;
																		if (ds) return ds;
																		if (cd) return String(cd);
																		return '';
																	})()}
																	readOnly
																	className='bg-muted/50'
																	placeholder=''
																/>
															</div>
														</div>

														{/* Campo de Conversão */}
														<div className='space-y-3'>
															<div className='flex items-center space-x-2'>
																<Checkbox
																	id={`conversao-${item.id}`}
																	checked={systemData.fl_conversao}
																	onCheckedChange={(checked) => {
																		updateItemSystemData(item.id, 'fl_conversao', checked as boolean);
																		if (!checked) {
																			updateItemSystemData(item.id, 'ds_fator_conversao', '1');
																			updateItemSystemData(item.id, 'ds_unidade_convertida', '');
																		} else {
																			const fatorAtual = systemData.ds_fator_conversao || '1';
																			const converted = calculateConvertedUnit(item.vl_quantidade, fatorAtual);
																			console.log(
																				'Ativando conversão, fator atual:',
																				fatorAtual,
																				'convertido:',
																				converted,
																			);
																			updateItemSystemData(item.id, 'ds_unidade_convertida', converted);
																		}
																	}}
																/>
																<label
																	htmlFor={`conversao-${item.id}`}
																	className='text-muted-foreground cursor-pointer text-sm font-medium'
																>
																	Ativar Conversão
																</label>
															</div>

															{systemData.fl_conversao && (
																<div className='grid grid-cols-3 gap-3'>
																	<div>
																		<label className='text-muted-foreground text-sm font-medium'>
																			Fator de Conversão
																		</label>
																		<Input
																			min='0'
																			value={systemData.ds_fator_conversao ?? ''}
																			onChange={(e) => {
																				const value = e.target.value;
																				const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
																				if (
																					numericValue === '' ||
																					(!isNaN(parseFloat(numericValue)) && parseFloat(numericValue) >= 0)
																				) {
																					updateItemSystemData(item.id, 'ds_fator_conversao', numericValue);
																					if (numericValue && numericValue !== '0') {
																						const converted = calculateConvertedUnit(
																							item.vl_quantidade,
																							numericValue,
																						);
																						console.log('converted:', converted);
																						updateItemSystemData(item.id, 'ds_unidade_convertida', converted);
																					} else {
																						updateItemSystemData(item.id, 'ds_unidade_convertida', '');
																					}
																				}
																			}}
																			onKeyDown={(e) => {
																				const allowedKeys = [
																					'Backspace',
																					'Delete',
																					'Tab',
																					'Enter',
																					'ArrowLeft',
																					'ArrowRight',
																					'ArrowUp',
																					'ArrowDown',
																					'Home',
																					'End',
																				];
																				const isNumber = /^[0-9]$/.test(e.key);
																				const isDecimal = e.key === '.' || e.key === ',';

																				if (!allowedKeys.includes(e.key) && !isNumber && !isDecimal) {
																					e.preventDefault();
																				}
																			}}
																			placeholder='1.0000'
																		/>
																	</div>
																	<div>
																		<label className='text-muted-foreground text-sm font-medium'>Qtd. Original</label>
																		<Input
																			value={formatQuantity4(item.vl_quantidade)}
																			readOnly
																			className='bg-muted/50 text-xs'
																		/>
																	</div>
																	<div>
																		<label className='text-muted-foreground text-sm font-medium'>Qtd. Convertida</label>
																		<Input
																			value={systemData.ds_unidade_convertida ?? ''}
																			onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
																				const raw = e.target.value;
																				const filtered = raw.replace(/[^0-9.,\s]/g, '');
																				updateItemSystemData(item.id, 'ds_unidade_convertida', filtered);
																			}}
																			onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
																				const raw = e.target.value || '';
																				const numeric = raw.replace(/[^0-9.,]/g, '').replace(',', '.');

																				if (numeric === '') {
																					updateItemSystemData(item.id, 'ds_unidade_convertida', '');
																					updateItemSystemData(item.id, 'ds_fator_conversao', '1');
																					return;
																				}

																				const convertedNum = parseFloat(numeric);
																				const originalQty = parseFloat(item.vl_quantidade) / 10000;

																				if (isNaN(convertedNum) || isNaN(originalQty) || originalQty === 0) {
																					updateItemSystemData(item.id, 'ds_unidade_convertida', raw);
																					return;
																				}

																				const factor = convertedNum / originalQty;
																				const factorStr = String(factor);
																				const formattedConverted = convertedNum.toLocaleString('pt-BR', {
																					minimumFractionDigits: 4,
																				});

																				updateItemSystemData(item.id, 'ds_fator_conversao', factorStr);
																				updateItemSystemData(item.id, 'ds_unidade_convertida', formattedConverted);
																			}}
																			onKeyDown={(e) => {
																				const allowedKeys = [
																					'Backspace',
																					'Delete',
																					'Tab',
																					'Enter',
																					'ArrowLeft',
																					'ArrowRight',
																					'ArrowUp',
																					'ArrowDown',
																					'Home',
																					'End',
																				];
																				const isNumber = /^[0-9]$/.test(e.key);
																				const isDecimal = e.key === '.' || e.key === ',';

																				if (e.key === 'Enter') {
																					(e.target as HTMLInputElement).blur();
																				}

																				if (!allowedKeys.includes(e.key) && !isNumber && !isDecimal) {
																					e.preventDefault();
																				}
																			}}
																			className='bg-green-50 text-xs font-medium text-green-700'
																		/>
																	</div>
																</div>
															)}
														</div>
													</div>
													{/* per-item actions */}
													<div className='mt-3 flex justify-end'>
														<Button
															size='sm'
															variant='outline'
															onClick={() => handleSaveItem(item)}
															disabled={!!savingItems[item.id] || isStatusLocked}
														>
															{savingItems[item.id] ? (
																<>
																	<Loader2 className='mr-2 h-4 w-4 animate-spin' />
																	Salvando...
																</>
															) : (
																'Salvar Item'
															)}
														</Button>
													</div>
												</CardContent>
											</Card>
										</div>
									</div>
								);
							})}
						</div>

						<DialogFooter className='flex-shrink-0'>
							<Button variant='outline' onClick={handleCancel} tooltip='Esquecer alterações'>
								Cancelar
							</Button>
							<Button variant='outline' onClick={handleClose}>
								Fechar
							</Button>
							<Button onClick={() => handleSaveAllItems()} disabled={saving || isStatusLocked}>
								{saving ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Salvando...
									</>
								) : (
									<>
										<Plus className='mr-2 h-4 w-4' />
										Salvar Todos os Itens
									</>
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContentLarge>
		</Dialog>
	);
}
