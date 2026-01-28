'use client';

import { useState } from 'react';
import { Bell, Bot, FileClock, MailCheck, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { NotificationDetailSheet } from './notification-detail-sheet';

interface NotificationCenterProps {
	notifications?: ESTEIRA.RESPONSE.GetNotificacoes;
	onMarkAsRead?: (id: string) => void;
	onMarkAllAsRead?: () => void;
	onRefresh?: () => void;
}

function formatShortDistance(date: Date) {
	const str = formatDistanceToNowStrict(date, { locale: ptBR });
	return str
		.replace(/segundos?/i, 's')
		.replace(/minutos?/i, 'm')
		.replace(/horas?/i, 'h')
		.replace(/dias?/i, 'd')
		.replace(/meses?/i, 'm')
		.replace(/anos?/i, 'a');
}

export function NotificationCenter({
	notifications = defaultNotifications,
	onMarkAsRead,
	onMarkAllAsRead,
	onRefresh,
}: NotificationCenterProps) {
	const [open, setOpen] = useState(false);
	const [selectedNotification, setSelectedNotification] = useState<ESTEIRA.RAW.Notification | undefined>(undefined);
	const [sheetOpen, setSheetOpen] = useState(false);
	const unreadCount = notifications.length;
	const router = useRouter();

	const handleMarkAsRead = (id: string) => {
		onMarkAsRead?.(id);
	};

	const handleMarkAllAsRead = () => {
		onMarkAllAsRead?.();
	};

	const handleRefresh = () => {
		onRefresh?.();
	};

	const handleNotificationClick = (notification: ESTEIRA.RAW.Notification) => {
		if (notification.ds_url) {
			router.push(notification.ds_url);
		} else {
			setSelectedNotification(notification);
			setSheetOpen(true);
			setOpen(false);
		}
	};

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant='ghost' size='icon' className='relative'>
						<Bell className='h-5 w-5' />
						{unreadCount > 0 && (
							<Badge
								variant='default'
								className='bg-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs'
							>
								{unreadCount}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-80 p-0' align='end'>
					<div className='border-0 p-0 shadow-none'>
						<div className='border-b px-4 py-3'>
							<div className='flex items-center justify-between'>
								<div className='font-semibold'>Notificações</div>
								<div>
									{unreadCount > 0 && (
										<Button
											variant='ghost'
											title='Marcar todas como lidas'
											className='aspect-square p-0'
											size='sm'
											onClick={handleMarkAllAsRead}
										>
											<MailCheck className='h-4 w-4' />
											<span className='sr-only'>Marcar todas como lidas</span>
										</Button>
									)}
									{onRefresh && (
										<Button
											variant='ghost'
											title='Recarregar notificações'
											className='aspect-square p-0'
											size='sm'
											onClick={handleRefresh}
										>
											<RefreshCcw className='h-4 w-4' />
											<span className='sr-only'>Recarregar notificações</span>
										</Button>
									)}
								</div>
							</div>
						</div>
						<div className='max-h-[350px] overflow-y-auto p-0'>
							{notifications.length === 0 ? (
								<div className='flex h-20 items-center justify-center'>
									<p className='text-muted-foreground text-sm'>Sem notificações</p>
								</div>
							) : (
								<div className='grid divide-y'>
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={cn('hover:bg-muted/50 flex cursor-pointer items-start gap-3 p-4', {
												'bg-muted/30': !notification,
											})}
											onClick={() => handleNotificationClick(notification)}
										>
											<NotificationIcon type={notification.cd_tipo} />
											<div className='flex-1 space-y-1'>
												<div className='flex items-center justify-between'>
													<p className='text-sm font-medium'>{notification.ds_titulo}</p>
													<p className='text-muted-foreground text-xs'>
														{formatShortDistance(new Date(notification.dt_created))}
													</p>
												</div>
												{notification.ds_descricao && (
													<p className='text-muted-foreground line-clamp-2 text-xs whitespace-pre-wrap'>
														{notification.ds_descricao}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</PopoverContent>
			</Popover>

			<NotificationDetailSheet
				notification={selectedNotification}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				onMarkAsRead={handleMarkAsRead}
			/>
		</>
	);
}

export function NotificationIcon({ type }: { type: ESTEIRA.RAW.NotificationType }) {
	switch (type) {
		case 'SUCCESS':
			return <CheckCircle className='mt-0.5 h-5 w-5 text-green-500' />;
		case 'ERROR':
			return <XCircle className='mt-0.5 h-5 w-5 text-red-500' />;
		case 'WARN':
			return <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-500' />;
		case 'DEBUG':
			return <Bot className='mt-0.5 h-5 w-5 text-purple-500' />;
		case 'PENDING':
			return <FileClock className='mt-0.5 h-5 w-5 text-orange-500' />;
		case 'INFO':
		default:
			return <Info className='mt-0.5 h-5 w-5 text-blue-500' />;
	}
}

// Sample data for demonstration
const defaultNotifications: ESTEIRA.RESPONSE.GetNotificacoes = [
	{
		id: '1',
		ds_titulo: 'New message received',
		ds_descricao: 'You have a new message from Sarah ',
		dt_created: new Date(new Date().getTime() - 5 * 60 * 1000),
		cd_tipo: 'INFO',
	},
	{
		id: '2',
		ds_titulo: 'Payment Successful',
		ds_descricao: 'Your payment of $299 has been processed',
		dt_created: new Date(new Date().getTime() - 30 * 60 * 1000),
		cd_tipo: 'SUCCESS',
	},
	{
		id: '3',
		ds_titulo: 'Account update required',
		ds_descricao: 'Please update your billing information',
		dt_created: new Date(new Date().getTime() - 60 * 60 * 1000),
		cd_tipo: 'WARN',
	},
	{
		id: '4',
		ds_titulo: 'Error processing order',
		ds_descricao: 'There was an issue with your recent order #12345',
		dt_created: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
		cd_tipo: 'ERROR',
	},
	{
		id: '5',
		ds_titulo: 'Debugging information',
		ds_descricao: 'Debugging information for your recent request',
		dt_created: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
		cd_tipo: 'DEBUG',
		ds_url: '/debug-info',
	},
	{
		id: '6',
		ds_titulo: 'Pending approval',
		ds_descricao: 'Your request is pending approval from the admin',
		dt_created: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
		cd_tipo: 'PENDING',
	},
];
