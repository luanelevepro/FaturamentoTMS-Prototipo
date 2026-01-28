import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContentMedium, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/text-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Truck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type DocumentShape = {
	id?: string;
	fis_nfe?: { id?: string; numero?: string; valor?: number; serie?: string; dataEmissao?: string; destinatario?: string };
	fis_cte?: {
		id?: string;
		numero?: string;
		valor?: number;
		serie?: string;
		dataEmissao?: string;
		remetente?: string;
		destinatario?: string;
	};
	fis_nfse?: { id?: string; numero?: string; valor?: number; dataEmissao?: string; destinatario?: string };
};

interface DocumentJustificationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	documentos: DocumentShape[];
	onSubmit: (documentosComJustificativa: Array<{ id: string; justificativa: string }>) => void;
}

export const DocumentJustificationModal = ({ open, onOpenChange, documentos, onSubmit }: DocumentJustificationModalProps) => {
	const [justificativas, setJustificativas] = useState<Record<string, string>>({});
	const [usarJustificativaUnica, setUsarJustificativaUnica] = useState(false);
	const [justificativaUnica, setJustificativaUnica] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setJustificativas({});
			setJustificativaUnica('');
			setUsarJustificativaUnica(false);
			setIsSubmitting(false);
		}
	}, [open]);

	const getDocumentoId = (doc: DocumentShape): string => {
		return (doc && (doc.id || doc.fis_nfe?.id || doc.fis_cte?.id || doc.fis_nfse?.id)) || '';
	};

	const getDocumentoInfo = (doc: DocumentShape) => {
		if (doc.fis_nfe) {
			return {
				tipo: 'NFe',
				numero: doc.fis_nfe.numero,
				valor: doc.fis_nfe.valor,
				serie: doc.fis_nfe.serie,
				dataEmissao: doc.fis_nfe.dataEmissao,
				info: doc.fis_nfe.destinatario,
				icon: FileText,
			};
		}
		if (doc.fis_cte) {
			return {
				tipo: 'CTe',
				numero: doc.fis_cte.numero,
				valor: doc.fis_cte.valor,
				serie: doc.fis_cte.serie,
				dataEmissao: doc.fis_cte.dataEmissao,
				info: `${doc.fis_cte.remetente} → ${doc.fis_cte.destinatario}`,
				icon: Truck,
			};
		}
		return null;
	};

	const handleJustificativaChange = (docId: string, value: string) => {
		setJustificativas((prev) => ({ ...prev, [docId]: value }));
	};

	const handleSubmit = () => {
		setIsSubmitting(true);

		const documentosComJustificativa = documentos.map((doc) => {
			const docId = getDocumentoId(doc);
			const justificativa = usarJustificativaUnica ? justificativaUnica : justificativas[docId] || '';
			return { id: docId, justificativa };
		});

		const todosPossuemJustificativa = documentosComJustificativa.every((d) => (d.justificativa || '').trim().length > 0);

		if (!todosPossuemJustificativa) {
			toast.error('Todos os documentos precisam ter uma justificativa.');
			setIsSubmitting(false);
			return;
		}
		console.log(documentosComJustificativa);
		onSubmit(documentosComJustificativa);
		setIsSubmitting(false);
		onOpenChange(false);

		toast.success(`${documentosComJustificativa.length} documento(s) processado(s) com sucesso.`);
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContentMedium className='flex max-h-[90vh] max-w-7xl flex-col overflow-hidden'>
				<DialogHeader>
					<DialogTitle className='text-foreground text-2xl font-semibold'>Justificativa de Documentos</DialogTitle>
					<DialogDescription className='text-muted-foreground'>
						Adicione justificativas para os documentos selecionados para indicar operação não realizada ({documentos.length}{' '}
						{documentos.length === 1 ? 'documento' : 'documentos'})
					</DialogDescription>
				</DialogHeader>

				<div className='flex-1 space-y-6 overflow-y-auto pr-2'>
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className='border-border flex items-start space-x-3 rounded-lg border p-4'
					>
						<Checkbox
							id='justificativa-unica'
							checked={usarJustificativaUnica}
							onCheckedChange={(checked) => setUsarJustificativaUnica(checked as boolean)}
							className='mt-1'
						/>
						<div className='flex-1 space-y-3'>
							<Label htmlFor='justificativa-unica' className='text-foreground cursor-pointer text-sm font-medium'>
								Usar a mesma justificativa para todos os documentos
							</Label>
							<AnimatePresence>
								{usarJustificativaUnica && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Textarea
											placeholder='Digite a justificativa que será aplicada a todos os documentos...'
											value={justificativaUnica}
											onChange={(e) => setJustificativaUnica(e.target.value)}
											className='min-h-[100px] resize-none'
										/>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>

					<Separator />

					<div className='space-y-4'>
						{documentos.map((doc, index) => {
							const docId = getDocumentoId(doc);
							const info = getDocumentoInfo(doc);

							if (!info) return null;

							const Icon = info.icon;

							return (
								<motion.div
									key={docId}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
									className={cn(
										'bg-card shadow-card rounded-lg border p-4 transition-all duration-200',
										'hover:shadow-elevated hover:border-primary/20',
									)}
								>
									<div className='flex items-start gap-4'>
										<div className='flex-shrink-0'>
											<div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
												<Icon className='text-primary h-6 w-6' />
											</div>
										</div>

										<div className='flex-1 space-y-3'>
											<div className='flex items-start justify-between gap-4'>
												<div className='space-y-1'>
													<div className='flex items-center gap-2'>
														<Badge variant='secondary' className='font-semibold'>
															{info.tipo}
														</Badge>
														<span className='text-foreground text-sm font-medium'>Nº {info.numero}</span>
														{info.serie && <span className='text-muted-foreground text-sm'>Série {info.serie}</span>}
													</div>
													{info.info && <p className='text-muted-foreground text-sm'>{info.info}</p>}
													{info.dataEmissao && <p className='text-muted-foreground text-xs'>Emissão: {info.dataEmissao}</p>}
												</div>
												<div className='text-right'>
													<p className='text-foreground text-lg font-semibold'>
														{typeof info.valor === 'number' ? formatCurrency(info.valor) : '—'}
													</p>
												</div>
											</div>

											{!usarJustificativaUnica && (
												<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
													<Label htmlFor={`justificativa-${docId}`} className='text-foreground mb-2 block text-sm font-medium'>
														Justificativa
													</Label>
													<Textarea
														id={`justificativa-${docId}`}
														placeholder='Digite a justificativa para este documento...'
														value={justificativas[docId] || ''}
														onChange={(e) => handleJustificativaChange(docId, e.target.value)}
														className='min-h-[80px] resize-none'
													/>
												</motion.div>
											)}
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>

				<Separator />

				<div className='flex justify-end gap-3 pt-4'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting} className='min-w-[120px]'>
						{isSubmitting ? (
							<span className='flex items-center gap-2'>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
									className='border-primary-foreground h-4 w-4 rounded-full border-2 border-t-transparent'
								/>
								Processando...
							</span>
						) : (
							<span className='flex items-center gap-2'>
								<Check className='h-4 w-4' />
								Confirmar
							</span>
						)}
					</Button>
				</div>
			</DialogContentMedium>
		</Dialog>
	);
};
