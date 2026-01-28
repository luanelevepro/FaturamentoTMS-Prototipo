'use client';

import { useState, useCallback, useEffect } from 'react';
import {
	ArrowRightLeft,
	Building,
	ChevronsUpDown,
	Loader2,
	ScrollText,
	ShieldAlert,
	FileText,
	Calendar,
	User,
	DollarSign,
	Sparkles,
	Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContentLarge, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getEmpresasUsuario } from '@/services/api/usuarios';
import { solicitarAlteracaoSubcontratacao } from '@/services/api/documentos-fiscais';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/component';

interface Company {
	id: string;
	ds_fantasia: string;
	ds_documento: string;
	is_escritorio: boolean;
	id_externo: string;
}

interface IDFe {
	id: string;
	ds_numero?: string;
	dt_emissao?: string;
	nomeEmitente?: string;
	ds_documento_emitente?: string;
	vFrete?: number;
}

interface ModalSubcontratadoSwapProps {
	documento: IDFe;
	isLoadingCompanies?: boolean;
	onSubmit?: (companyId: string, motivo: string) => Promise<void>;
}

const removeDiacritics = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatCnpjCpf = (value: string) => {
	const cleanValue = value.replace(/\D/g, '');
	if (cleanValue.length === 11) {
		return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
	}
	return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) => {
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 24,
		},
	},
};

const CompanyIcon = ({ company }: { company: Company }) => {
	if (company.id_externo === '0') {
		return <ShieldAlert className='size-3.5' />;
	}
	if (company.is_escritorio) {
		return <ScrollText className='size-3.5' />;
	}
	return <Building className='size-3.5' />;
};

interface CompanySearchProps {
	value: string;
	onSelect: (company: Company) => void;
	companies: Company[];
	isLoading: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CompanySearch = ({ value, onSelect, companies, isLoading, open, onOpenChange }: CompanySearchProps) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(false);

	const searchCompanies = useCallback(
		async (search: string) => {
			setLoading(true);
			try {
				let filtered: Company[];

				if (!search.trim()) {
					filtered = companies || [];
				} else {
					const normalizedSearch = removeDiacritics(search.toLowerCase().trim());
					filtered = (companies || []).filter((company) => {
						const normalizedName = removeDiacritics(company.ds_fantasia.toLowerCase());
						const normalizedDoc = removeDiacritics(company.ds_documento);
						return normalizedName.includes(normalizedSearch) || normalizedDoc.includes(normalizedSearch);
					});
				}

				setFilteredCompanies(filtered);
			} catch {
				setFilteredCompanies([]);
			} finally {
				setLoading(false);
			}
		},
		[companies],
	);

	useEffect(() => {
		if (open) {
			searchCompanies(searchTerm);
		} else {
			setFilteredCompanies([]);
		}
	}, [open, searchTerm, searchCompanies]);

	const handleSelect = (company: Company) => {
		onSelect(company);
		onOpenChange(false);
		setSearchTerm('');
	};

	return (
		<Popover open={open} onOpenChange={onOpenChange} modal={false}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					className={cn(
						'border-border/60 bg-muted/30 h-auto w-full justify-between rounded-xl px-4 py-3 text-left transition-all duration-300',
						'hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm',
						'focus:border-primary focus:ring-primary/20 focus:ring-2',
						value && 'border-primary/30 bg-primary/5',
					)}
					disabled={isLoading}
				>
					{value ? (
						<span className='text-foreground text-sm font-medium'>{value}</span>
					) : (
						<span className='text-muted-foreground'>Selecione uma empresa...</span>
					)}
					{isLoading ? (
						<Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
					) : (
						<ChevronsUpDown className='text-muted-foreground h-4 w-4' />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContentLarge
				className='z-[100] w-[var(--radix-popover-trigger-width)] p-0'
				align='start'
				side='bottom'
				sideOffset={8}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<div className='flex max-h-[min(24rem,calc(100vh-220px))] flex-col'>
					{/* Header fixo */}
					<div className='bg-background shrink-0 border-b p-4'>
						<div className='relative'>
							<Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
							<Input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder='Digite para buscar empresas...'
								className='pl-10'
								autoFocus
							/>
						</div>
					</div>

					{/* Lista scrollável */}
					<div
						className='flex-1 overflow-y-auto p-2'
						style={{
							scrollbarWidth: 'thin',
							scrollbarColor: 'hsl(var(--border)) transparent',
							overscrollBehavior: 'contain',
						}}
						onWheel={(e) => e.stopPropagation()}
					>
						{loading || isLoading ? (
							<div className='flex items-center justify-center p-6'>
								<Loader2 className='h-4 w-4 animate-spin' />
								<span className='text-muted-foreground ml-2 text-sm'>Carregando empresas...</span>
							</div>
						) : filteredCompanies.length > 0 ? (
							<div className='p-2'>
								{filteredCompanies.map((company) => (
									<div
										key={company.id}
										className='hover:bg-muted cursor-pointer rounded-lg p-3 transition-colors'
										onClick={() => handleSelect(company)}
									>
										<div className='flex items-center gap-3'>
											<div className='bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors'>
												<CompanyIcon company={company} />
											</div>
											<div className='flex-1'>
												<p className='text-sm font-medium'>{company.ds_fantasia}</p>
												<p className='text-muted-foreground text-xs'>{formatCnpjCpf(company.ds_documento)}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						) : searchTerm ? (
							<div className='flex flex-col items-center justify-center p-6 text-center'>
								<Building className='text-muted-foreground mb-2 h-8 w-8' />
								<p className='text-muted-foreground text-sm'>Nenhuma empresa encontrada</p>
								<p className='text-muted-foreground mt-1 text-xs'>Tente buscar por nome ou CNPJ</p>
							</div>
						) : (companies || []).length === 0 ? (
							<div className='flex flex-col items-center justify-center p-6 text-center'>
								<Building className='text-muted-foreground mb-2 h-8 w-8' />
								<p className='text-muted-foreground text-sm'>Nenhuma empresa cadastrada</p>
							</div>
						) : (
							<div className='flex items-center justify-center p-6'>
								<Loader2 className='h-4 w-4 animate-spin' />
								<span className='text-muted-foreground ml-2 text-sm'>Carregando empresas...</span>
							</div>
						)}
					</div>
				</div>
			</PopoverContentLarge>
		</Popover>
	);
};

export function ModalSubcontratadoSwap({ documento, onSubmit }: ModalSubcontratadoSwapProps) {
	const supabase = createClient();
	const [modalOpen, setModalOpen] = useState(false);
	const [companyOpen, setCompanyOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [motivo, setMotivo] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { data: user } = useQuery({
		queryKey: ['get-user'],
		queryFn: async () => {
			const { data, error } = await supabase.auth.getUser();
			if (error) throw error;
			return data.user;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!documento?.id,
	});

	const { data: companies = [], isFetching: isLoadingCompanies } = useQuery({
		queryKey: ['get-empresas-usuario', user?.id],
		queryFn: () => getEmpresasUsuario(user!.id),
		staleTime: 1000 * 60 * 5,
		enabled: !!user?.id,
	});

	const handleSubmit = async () => {
		if (!selectedCompany || !motivo.trim() || !documento?.id) return;

		setIsSubmitting(true);
		try {
			// Chamar a API de solicitação de alteração de subcontratação
			await solicitarAlteracaoSubcontratacao(documento.id, selectedCompany.id, motivo);

			// Se houver callback onSubmit, executar também
			if (onSubmit) {
				await onSubmit(selectedCompany.id, motivo);
			}

			// Fechar o modal e limpar o estado
			setModalOpen(false);
			setSelectedCompany(null);
			setMotivo('');
		} catch (error) {
			console.error('Erro ao solicitar alteração de subcontratação:', error);
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	const infoItems = [
		{
			icon: FileText,
			label: 'Número',
			value: documento.ds_numero || '--',
		},
		{
			icon: Calendar,
			label: 'Data Emissão',
			value: documento.dt_emissao ? formatDate(documento.dt_emissao) : '--',
		},
		{
			icon: User,
			label: 'Emitente',
			value: documento.nomeEmitente || '--',
			subValue: documento.ds_documento_emitente ? formatCnpjCpf(documento.ds_documento_emitente) : undefined,
		},
		{
			icon: DollarSign,
			label: 'Valor Frete',
			value: documento.vFrete ? formatCurrency(documento.vFrete) : '--',
			isHighlight: true,
		},
	];

	return (
		<Dialog
			modal={false}
			open={modalOpen}
			onOpenChange={(v) => {
				setModalOpen(v);
				if (!v) setCompanyOpen(false);
			}}
		>
			<DialogTrigger asChild>
				<Button variant='ghost' size='icon' tooltip='Alterar Subcontratação'>
					<ArrowRightLeft />
				</Button>
			</DialogTrigger>

			<DialogContent
				className='gap-0 overflow-hidden border-0 p-0 shadow-xl sm:max-w-lg sm:rounded-2xl'
				onInteractOutside={(e) => {
					// Se o clique veio do popover, NÃO feche o dialog
					const target = e.target as HTMLElement | null;
					if (target?.closest?.('[data-slot="popover-content-large"],[data-slot="popover-content"]')) {
						e.preventDefault();
					}
					// Caso contrário, deixa o comportamento padrão: clicar fora fecha o modal
				}}
				onPointerDownOutside={(e) => {
					// Mesma proteção (alguns browsers disparam diferente)
					const target = e.target as HTMLElement | null;
					if (target?.closest?.('[data-slot="popover-content-large"],[data-slot="popover-content"]')) {
						e.preventDefault();
					}
				}}
				onFocusOutside={(e) => {
					// enquanto o popover está aberto, NÃO deixe focus-outside fechar o dialog
					if (companyOpen) {
						e.preventDefault();
						return;
					}

					const target = e.target as HTMLElement | null;
					if (target?.closest?.('[data-slot="popover-content-large"],[data-slot="popover-content"]')) {
						e.preventDefault();
					}
				}}
			>
				<AnimatePresence mode='wait'>
					<motion.div
						key='modal-content'
						// initial='hidden'
						// animate='visible'
						// exit='hidden'
						variants={containerVariants}
						className='flex flex-col'
					>
						{/* Header with gradient */}
						<motion.div
							variants={itemVariants}
							className='from-primary via-primary to-primary/80 relative overflow-hidden bg-gradient-to-br px-6 py-5'
						>
							<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />

							<DialogHeader className='relative z-10'>
								<div className='flex items-center gap-3'>
									<motion.div
										className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm'
										whileHover={{ scale: 1.05 }}
									>
										<ArrowRightLeft className='text-primary-foreground h-5 w-5' />
									</motion.div>
									<div>
										<DialogTitle className='text-primary-foreground text-lg font-semibold'>Alterar Subcontratação</DialogTitle>
										<p className='text-primary-foreground/70 mt-0.5 text-sm'>Transfira o documento para outra empresa</p>
									</div>
								</div>
							</DialogHeader>
						</motion.div>

						{/* Content */}
						<div className='bg-card p-6'>
							<div className='space-y-5'>
								<motion.div variants={itemVariants}>
									<div className='grid grid-cols-2 gap-3'>
										{infoItems.map((item) => (
											<motion.div
												key={item.label}
												// initial={{ opacity: 0, scale: 0.98 }}
												// animate={{ opacity: 1, scale: 1 }}
												// transition={{ delay: 0.10 + index * 0.05 }}
												className={cn(
													'group border-border/60 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-sm',
													item.subValue && 'col-span-2',
												)}
											>
												<div className='flex items-start gap-3'>
													<div
														className={cn(
															'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
															item.isHighlight ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
														)}
													>
														<item.icon className='h-4 w-4' />
													</div>
													<div className='min-w-0 flex-1'>
														<p className='text-muted-foreground text-xs font-medium'>{item.label}</p>
														<p className={cn('mt-0.5 truncate text-sm font-semibold', item.isHighlight && 'text-success')}>
															{item.value}
														</p>
														{item.subValue && <p className='text-muted-foreground mt-0.5 text-xs'>{item.subValue}</p>}
													</div>
												</div>
											</motion.div>
										))}
									</div>
								</motion.div>

								{/* Divider */}
								<motion.div variants={itemVariants} className='flex items-center gap-3'>
									<div className='via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent' />
									<Sparkles className='text-muted-foreground/50 h-4 w-4' />
									<div className='via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent' />
								</motion.div>

								{/* Company Selector */}
								<motion.div variants={itemVariants} className='space-y-2.5'>
									<Label className='text-foreground text-sm font-medium'>Transferir para</Label>
									<CompanySearch
										value={selectedCompany ? selectedCompany.ds_fantasia : ''}
										onSelect={(company) => setSelectedCompany(company)}
										companies={companies}
										isLoading={isLoadingCompanies}
										open={companyOpen}
										onOpenChange={setCompanyOpen}
									/>
								</motion.div>

								{/* Reason Textarea */}
								<motion.div variants={itemVariants} className='space-y-2.5'>
									<Label htmlFor='motivo' className='text-foreground text-sm font-medium'>
										Motivo da Alteração
									</Label>
									<div className='relative'>
										<textarea
											id='motivo'
											placeholder='Descreva o motivo da transferência de subcontratação...'
											value={motivo}
											onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMotivo(e.target.value)}
											className={cn(
												'border-border/60 bg-muted/30 min-h-28 w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all duration-300',
												'placeholder:text-muted-foreground/60',
												'hover:border-primary/40 hover:bg-muted/50',
												'focus:border-primary focus:bg-card focus:ring-primary/20 focus:ring-2 focus:outline-none',
												motivo.trim() && 'border-primary/30 bg-primary/5',
											)}
										/>
										<div className='text-muted-foreground/50 absolute right-2 bottom-2 text-xs'>{motivo.length} / 500</div>
									</div>
								</motion.div>

								{/* Action Buttons */}
								<motion.div variants={itemVariants} className='flex gap-3 pt-2'>
									<Button
										variant='outline'
										onClick={() => {
											setModalOpen(false);
											setSelectedCompany(null);
											setMotivo('');
										}}
										disabled={isSubmitting}
										className='border-border/60 hover:bg-muted flex-1 rounded-xl py-5 transition-all duration-300'
									>
										Cancelar
									</Button>
									<Button
										onClick={handleSubmit}
										disabled={isSubmitting || !selectedCompany || !motivo.trim()}
										className={cn(
											'relative flex-[2] overflow-hidden rounded-xl py-5 font-medium transition-all duration-300',
											'bg-primary hover:bg-primary/90',
											'disabled:opacity-50',
										)}
									>
										<AnimatePresence mode='wait'>
											{isSubmitting ? (
												<motion.div
													key='loading'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<Loader2 className='h-4 w-4 animate-spin' />
													<span>Enviando...</span>
												</motion.div>
											) : (
												<motion.div
													key='submit'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<ArrowRightLeft className='h-4 w-4' />
													<span>Solicitar Alteração</span>
												</motion.div>
											)}
										</AnimatePresence>
									</Button>
								</motion.div>
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	);
}

export default ModalSubcontratadoSwap;
