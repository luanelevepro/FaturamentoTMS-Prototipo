'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MailCheck, ExternalLink, CheckCircle, AlertCircle, Info, XCircle, Bot, FileClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationType = 'SUCCESS' | 'ERROR' | 'WARN' | 'DEBUG' | 'PENDING' | 'INFO';

interface NotificationDetailSheetProps {
	notification?: ESTEIRA.RAW.Notification;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onMarkAsRead?: (id: string) => void;
}

function NotificationIcon({ type }: { type: NotificationType }) {
	const iconProps = 'h-6 w-6';

	switch (type) {
		case 'SUCCESS':
			return <CheckCircle className={`${iconProps} text-emerald-500`} />;
		case 'ERROR':
			return <XCircle className={`${iconProps} text-red-500`} />;
		case 'WARN':
			return <AlertCircle className={`${iconProps} text-amber-500`} />;
		case 'DEBUG':
			return <Bot className={`${iconProps} text-violet-500`} />;
		case 'PENDING':
			return <FileClock className={`${iconProps} text-orange-500`} />;
		case 'INFO':
		default:
			return <Info className={`${iconProps} text-blue-500`} />;
	}
}

function getNotificationColor(type: NotificationType) {
	switch (type) {
		case 'SUCCESS':
			return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
		case 'ERROR':
			return 'from-red-500/20 to-red-500/5 border-red-500/30';
		case 'WARN':
			return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
		case 'DEBUG':
			return 'from-violet-500/20 to-violet-500/5 border-violet-500/30';
		case 'PENDING':
			return 'from-orange-500/20 to-orange-500/5 border-orange-500/30';
		case 'INFO':
		default:
			return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
	}
}

export function NotificationDetailSheet({ notification, open, onOpenChange, onMarkAsRead }: NotificationDetailSheetProps) {
	if (!notification) return null;

	const colorClasses = getNotificationColor(notification.cd_tipo);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='min-h-0 w-full overflow-hidden p-0 sm:max-w-md'>
				<AnimatePresence mode='wait'>
					{open && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className='flex h-full flex-col'
						>
							{/* Header com gradiente */}
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.1 }}
								className={`bg-gradient-to-b ${colorClasses} border-b p-6`}
							>
								<SheetHeader className='space-y-4'>
									<motion.div
										className='flex items-start gap-4'
										initial={{ scale: 0.8, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{
											type: 'spring',
											stiffness: 200,
											damping: 15,
											delay: 0.2,
										}}
									>
										<div className='bg-background/80 rounded-xl p-3 shadow-sm backdrop-blur-sm'>
											<NotificationIcon type={notification.cd_tipo} />
										</div>
										<div className='min-w-0 flex-1'>
											<SheetTitle className='text-lg leading-tight font-semibold'>{notification.ds_titulo}</SheetTitle>
											<motion.p
												className='text-muted-foreground mt-1 text-sm'
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.3 }}
											>
												{formatDistanceToNowStrict(new Date(notification.dt_created), {
													locale: ptBR,
													addSuffix: true,
												})}
											</motion.p>
										</div>
									</motion.div>
								</SheetHeader>
							</motion.div>

							{/* Conteúdo */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.25 }}
								className='flex-1 overflow-auto p-6'
							>
								<SheetDescription className='text-foreground text-base leading-relaxed whitespace-pre-wrap'>
									{notification.ds_descricao || 'Sem detalhes adicionais'}
								</SheetDescription>
							</motion.div>

							{/* Ações */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.35 }}
								className='bg-muted/30 border-t p-4'
							>
								<div className='flex flex-col justify-end gap-3 sm:flex-row'>
									<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
										<Button
											variant='outline'
											className='w-full sm:w-auto'
											onClick={() => {
												if (onMarkAsRead) onMarkAsRead(notification.id);
												onOpenChange(false);
											}}
										>
											<MailCheck className='mr-2 h-4 w-4' />
											Marcar como lida
										</Button>
									</motion.div>

									{notification.ds_url && (
										<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
											<Button
												className='w-full sm:w-auto'
												onClick={() => {
													if (onMarkAsRead) onMarkAsRead(notification.id);
													window.location.href = notification.ds_url || '';
												}}
											>
												<ExternalLink className='mr-2 h-4 w-4' />
												Visualizar
											</Button>
										</motion.div>
									)}
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</SheetContent>
		</Sheet>
	);
}
