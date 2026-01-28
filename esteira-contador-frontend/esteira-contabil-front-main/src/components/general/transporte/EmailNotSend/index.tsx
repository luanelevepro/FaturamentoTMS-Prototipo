import { Button } from '@/components/ui/button';
import { MailPlus, LoaderCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { IEmailParams, ITypeEmails, ITypesFolderEmail } from '@/interfaces';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getEmails } from '@/services/api/transporte';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import EmptyState from '@/components/states/empty-state';
import Pagination from '@/pages/faturamento/serie/Pagination';
import { format } from 'date-fns';

export default function EmailNotSend() {
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState<IEmailParams>({
		page: 1,
		take: 10,
		folderName: ITypesFolderEmail.EXTRAIDOS,
	});

	const {
		data: dataEmails,
		isLoading,
		isFetching,
	} = useQuery<ITypeEmails>({
		queryKey: ['dfes', filter],
		queryFn: () => getEmails(filter),
		enabled: open,
		staleTime: 1000 * 60 * 60,
		retry: 1,
		placeholderData: keepPreviousData,
	});

	return (
		<Drawer direction='right' open={open} onOpenChange={() => setOpen(true)}>
			<DrawerTrigger asChild>
				<Button tooltip='E-maill não extraídos' variant='outline'>
					<Mail />
				</Button>
			</DrawerTrigger>
			<DrawerContent className='min-w-dvw'>
				<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
					<DrawerTitle>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								{/* <ListFilter size={20} /> */}
								<p className='text-xl font-semibold'>E-mail não extraídos</p>
							</div>
							<div className='flex gap-4'>
								<Button variant='outline' onClick={() => setOpen(false)}>
									Fechar
								</Button>
								{/* 	<Button variant='outline' color='red' onClick={() => {}}>
									Limpar filtros
								</Button>

								<Button>Salvar</Button> */}
							</div>
						</div>
						<DrawerDescription></DrawerDescription>
					</DrawerTitle>
				</DrawerHeader>
				<div className='px-8 py-10'>
					{!!dataEmails?.data && dataEmails.pagination.totalItems < 1 ? (
						false ? (
							<div>45</div>
						) : (
							<div className='mt-6'>
								<EmptyState label='Nenhum email' />
							</div>
						)
					) : (
						<div className='mt-4 grid w-full overflow-hidden rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className=''>Data</TableHead>
										<TableHead className='w-1/3'>Destinatário</TableHead>
										<TableHead className='w-1/3'>Destinatários Em cópia</TableHead>
										<TableHead className='w-1/3'>Título</TableHead>
										<TableHead className='w-1/3'>Vincular</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell colSpan={7} className='text-center'>
												<div className='flex flex-col items-center justify-center gap-2'>
													<LoaderCircle className='text-muted-foreground h-8 w-8 animate-spin' />
													<p className='text-muted-foreground text-sm'>Carregando dados...</p>
												</div>
											</TableCell>
										</TableRow>
									) : (
										dataEmails?.data?.map((email) => (
											<TableRow key={email.id}>
												<TableCell>{format(email?.receivedDateTime, 'dd/MM/yy - HH:mm')}</TableCell>
												<TableCell>{email?.sender?.emailAddress?.address}</TableCell>
												<TableCell>
													{email?.ccRecipients?.map((recepie, index: number) => {
														return <p key={index}>{recepie?.emailAddress?.address}</p>;
													})}
												</TableCell>
												<TableCell>{email?.subject}</TableCell>

												<TableCell className='text-center'>
													<Button tooltip='Visualizar' variant='ghost' size='icon'>
														<MailPlus />
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
					{!!dataEmails?.data && dataEmails?.pagination?.totalItems > 0 && (
						<Pagination
							isFetting={isFetching}
							page={dataEmails?.pagination?.page}
							pageSize={dataEmails?.pagination?.pageSize}
							totalItems={dataEmails?.pagination?.totalItems}
							totalPages={dataEmails?.pagination?.totalPages}
							hasNextPage={dataEmails?.pagination?.hasNextPage}
							hasPreviousPage={dataEmails?.pagination?.hasPreviousPage}
							setPage={(value: number) => setFilter({ ...filter, take: value })}
							setTake={(value: number) => setFilter({ ...filter, take: value })}
						/>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
