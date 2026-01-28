'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Loader2, FileText, Calendar, User, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { aprovarAlteracaoSubcontratacao, rejeitarAlteracaoSubcontratacao } from '@/services/api/documentos-fiscais';
import { toast } from 'sonner';

interface AlteracaoSubcontratacao {
	id_alteracao: string;
	ds_motivo: string;
	ds_razao_social_subcontratada_original: string;
	usuario_solicitante: {
		ds_email: string;
	};
}

interface IDFe {
	id: string;
	ds_numero?: string;
	dt_emissao?: string;
	nomeEmitente?: string;
	ds_documento_emitente?: string;
	alteracao_subcontratacao_pendente?: AlteracaoSubcontratacao;
}

interface ModalSubcontratadoApprovalProps {
	documento: IDFe;
	onApprovalChange?: () => void;
}

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

export function ModalSubcontratadoApproval({ documento, onApprovalChange }: ModalSubcontratadoApprovalProps) {
	const [modalOpen, setModalOpen] = useState(false);
	const [observacao, setObservacao] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

	const alteracao = documento.alteracao_subcontratacao_pendente;

	if (!alteracao) return null;

	const handleAction = async (action: 'approve' | 'reject') => {
		if (!alteracao?.id_alteracao) return;

		setIsSubmitting(true);
		setActionType(action);

		try {
			if (action === 'approve') {
				await aprovarAlteracaoSubcontratacao(alteracao.id_alteracao, observacao || undefined);
				toast.success('Alteração de subcontratação aprovada com sucesso!');
			} else {
				if (!observacao.trim()) {
					toast.error('Informe o motivo da rejeição');
					setIsSubmitting(false);
					setActionType(null);
					return;
				}
				await rejeitarAlteracaoSubcontratacao(alteracao.id_alteracao, observacao);
				toast.error('Alteração de subcontratação rejeitada');
			}

			// Callback para atualizar a lista
			if (onApprovalChange) {
				onApprovalChange();
			}

			// Fechar modal e limpar estado
			setModalOpen(false);
			setObservacao('');
			setActionType(null);
		} catch (error) {
			console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} alteração:`, error);
			toast.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} alteração de subcontratação`);
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
	];

	return (
		<Dialog open={modalOpen} onOpenChange={setModalOpen} modal={false}>
			<DialogTrigger asChild>
				<Button variant='ghost' size='icon' tooltip='Pendente de Aprovação' className='text-warning hover:text-warning'>
					<AlertTriangle className='h-4 w-4' />
				</Button>
			</DialogTrigger>

			<DialogContent className='gap-0 overflow-hidden border-0 p-0 shadow-xl sm:max-w-lg sm:rounded-2xl'>
				<AnimatePresence mode='wait'>
					<motion.div key='modal-content' variants={containerVariants} className='flex flex-col'>
						{/* Header with gradient - Warning theme */}
						<motion.div
							variants={itemVariants}
							className='from-warning via-warning to-warning/80 relative overflow-hidden bg-gradient-to-br px-6 py-5'
						>
							<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />

							<DialogHeader className='relative z-10'>
								<div className='flex items-center gap-3'>
									<motion.div
										className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm'
										whileHover={{ scale: 1.05 }}
									>
										<AlertTriangle className='text-warning-foreground h-5 w-5' />
									</motion.div>
									<div>
										<DialogTitle className='text-warning-foreground text-lg font-semibold'>
											Alteração Pendente de Aprovação
										</DialogTitle>
										<p className='text-warning-foreground/70 mt-0.5 text-sm'>Aprove ou rejeite a solicitação de alteração</p>
									</div>
								</div>
							</DialogHeader>
						</motion.div>

						{/* Content */}
						<div className='bg-card p-6'>
							<div className='space-y-5'>
								{/* Document Info */}
								<motion.div variants={itemVariants}>
									<div className='grid grid-cols-2 gap-3'>
										{infoItems.map((item) => (
											<motion.div
												key={item.label}
												className={cn(
													'group border-border/60 bg-muted/30 hover:border-warning/30 hover:bg-muted/50 relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-sm',
													item.subValue && 'col-span-2',
												)}
											>
												<div className='flex items-start gap-3'>
													<div className='bg-warning/10 text-warning flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors'>
														<item.icon className='h-4 w-4' />
													</div>
													<div className='min-w-0 flex-1'>
														<p className='text-muted-foreground text-xs font-medium'>{item.label}</p>
														<p className='mt-0.5 truncate text-sm font-semibold'>{item.value}</p>
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

								{/* Solicitação Info */}
								<motion.div variants={itemVariants} className='space-y-3'>
									<div className='border-warning/20 bg-warning/5 rounded-xl border p-4'>
										<div className='flex items-start gap-3'>
											<div className='bg-warning/10 text-warning flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
												<User className='h-4 w-4' />
											</div>
											<div className='flex-1'>
												<p className='text-muted-foreground text-xs font-medium'>Subcontratada Original</p>
												<p className='mt-0.5 text-sm font-semibold'>{alteracao.ds_razao_social_subcontratada_original}</p>
											</div>
										</div>
									</div>

									<div className='border-border/60 bg-muted/30 rounded-xl border p-4'>
										<div className='flex items-start gap-3'>
											<div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
												<Mail className='h-4 w-4' />
											</div>
											<div className='flex-1'>
												<p className='text-muted-foreground text-xs font-medium'>Solicitado por</p>
												<p className='mt-0.5 text-sm font-semibold'>{alteracao.usuario_solicitante.ds_email}</p>
											</div>
										</div>
									</div>

									<div className='border-border/60 bg-muted/30 rounded-xl border p-4'>
										<div className='flex items-start gap-3'>
											<div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
												<MessageSquare className='h-4 w-4' />
											</div>
											<div className='flex-1'>
												<p className='text-muted-foreground text-xs font-medium'>Motivo da Solicitação</p>
												<p className='mt-0.5 text-sm'>{alteracao.ds_motivo}</p>
											</div>
										</div>
									</div>
								</motion.div>

								{/* Divider */}
								<motion.div variants={itemVariants} className='flex items-center gap-3'>
									<div className='via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent' />
									<Sparkles className='text-muted-foreground/50 h-4 w-4' />
									<div className='via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent' />
								</motion.div>

								{/* Observação Textarea */}
								<motion.div variants={itemVariants} className='space-y-2.5'>
									<Label htmlFor='observacao' className='text-foreground text-sm font-medium'>
										Observação {actionType === 'reject' && <span className='text-destructive'>*</span>}
									</Label>
									<div className='relative'>
										<textarea
											id='observacao'
											placeholder={
												actionType === 'reject'
													? 'Informe o motivo da rejeição (obrigatório)...'
													: 'Adicione uma observação (opcional)...'
											}
											value={observacao}
											onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacao(e.target.value)}
											className={cn(
												'border-border/60 bg-muted/30 min-h-24 w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all duration-300',
												'placeholder:text-muted-foreground/60',
												'hover:border-primary/40 hover:bg-muted/50',
												'focus:border-primary focus:bg-card focus:ring-primary/20 focus:ring-2 focus:outline-none',
												observacao.trim() && 'border-primary/30 bg-primary/5',
											)}
										/>
										<div className='text-muted-foreground/50 absolute right-2 bottom-2 text-xs'>{observacao.length} / 500</div>
									</div>
								</motion.div>

								{/* Action Buttons */}
								<motion.div variants={itemVariants} className='flex gap-3 pt-2'>
									<Button
										onClick={() => handleAction('reject')}
										disabled={isSubmitting}
										variant='outline'
										className={cn(
											'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-destructive/20 flex-1 rounded-xl py-5 transition-all duration-300',
											'disabled:opacity-50',
										)}
									>
										<AnimatePresence mode='wait'>
											{isSubmitting && actionType === 'reject' ? (
												<motion.div
													key='loading-reject'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<Loader2 className='h-4 w-4 animate-spin' />
													<span>Rejeitando...</span>
												</motion.div>
											) : (
												<motion.div
													key='reject'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<XCircle className='h-4 w-4' />
													<span>Rejeitar</span>
												</motion.div>
											)}
										</AnimatePresence>
									</Button>

									<Button
										onClick={() => handleAction('approve')}
										disabled={isSubmitting}
										className={cn(
											'relative flex-1 overflow-hidden rounded-xl bg-green-600 py-5 font-medium text-white transition-all duration-300 hover:bg-green-700',
											'disabled:opacity-50',
										)}
									>
										<AnimatePresence mode='wait'>
											{isSubmitting && actionType === 'approve' ? (
												<motion.div
													key='loading-approve'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<Loader2 className='h-4 w-4 animate-spin' />
													<span>Aprovando...</span>
												</motion.div>
											) : (
												<motion.div
													key='approve'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='flex items-center gap-2'
												>
													<CheckCircle2 className='h-4 w-4' />
													<span>Aprovar</span>
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

export default ModalSubcontratadoApproval;
