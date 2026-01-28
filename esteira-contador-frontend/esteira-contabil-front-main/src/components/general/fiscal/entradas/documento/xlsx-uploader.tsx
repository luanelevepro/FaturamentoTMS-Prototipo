import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircleIcon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react';

import { FileWithPreview, formatBytes, useFileUpload } from '@/hooks/use-file-upload';
import clsx from 'clsx';
import { uploadData } from '@/services/api/request-handler';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icons } from '../../../../layout/icons';
import { useQueryClient } from '@tanstack/react-query';

export function XLSXUploader({ children, period }: { children: React.ReactNode; period?: string }) {
	const maxSize = 10 * 1024 * 1024; // 10MB per file
	const maxFiles = 10; // limit to 10 documents
	const [modalOpen, setModalOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const queryClient = useQueryClient();

	const [
		{ files, isDragging, errors },
		{ handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps, clearFiles },
	] = useFileUpload({
		maxFiles,
		maxSize,
		accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		multiple: true,
	});

	const validateFiles = (filesList: FileWithPreview[]) => {
		if (!filesList || filesList.length === 0) return 'Ao menos um arquivo é obrigatório';
		if (filesList.length > maxFiles) return `O número máximo de arquivos é ${maxFiles}`;
		return null;
	};

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const error = validateFiles(files);
		if (error) {
			toast.error(error);
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			// append each file using the field name 'files'
			files.forEach((f) => {
				formData.append('files', f.file as File);
			});
			formData.append('competencia', period || '');
			await uploadData('/api/fiscal/sat/enviar-planilha', formData);
			toast.success('Planilhas enviadas com sucesso!');
			setModalOpen(false);
			clearFiles();
			queryClient.refetchQueries({ queryKey: ['get-notificacoes'] });
			queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada'] });
		} catch (error) {
			console.error('Error uploading files:', error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Erro ao enviar planilhas');
			}
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<Dialog open={modalOpen} onOpenChange={setModalOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='sm:max-w-[625px]'>
				<DialogHeader>
					<DialogTitle>Enviar planilhas SAT (.xlsx)</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='flex flex-col gap-2'>
						{/* Drop area */}
						<div
							role='button'
							onClick={openFileDialog}
							onDragEnter={handleDragEnter}
							onDragLeave={handleDragLeave}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							data-dragging={isDragging || undefined}
							className={clsx(
								'border-input flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors',
								'hover:bg-accent/50 has-[input:focus]:border-ring',
								'data-[dragging=true]:bg-accent/50',
								files.length && 'pointer-events-none opacity-50',
							)}
						>
							<input {...getInputProps()} id='xlsx-files' className='sr-only' aria-label='Upload files' disabled={isUploading} />

							<div className='flex flex-col items-center justify-center text-center'>
								<div
									className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
									aria-hidden='true'
								>
									<UploadIcon className='size-4 opacity-60' />
								</div>
								<p className='mb-1.5 text-sm font-medium'>Enviar planilhas (.xlsx)</p>
								<p className='text-muted-foreground text-xs'>
									Arraste os arquivos ou clique para selecionar (máx. {maxFiles} arquivos, {formatBytes(maxSize)} cada)
								</p>
							</div>
						</div>

						{errors.length > 0 && (
							<div className='text-destructive flex items-center gap-1 text-xs' role='alert'>
								<AlertCircleIcon className='size-3 shrink-0' />
								<span>{errors[0]}</span>
							</div>
						)}

						{/* File list */}
						{files.length > 0 && (
							<div className='space-y-2'>
								{files.map((file) => (
									<div key={file.id} className='flex items-center justify-between gap-2 rounded-xl border px-4 py-2'>
										<div className='flex items-center gap-3 overflow-hidden'>
											<PaperclipIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
											<div className='min-w-0'>
												<p className='truncate text-[13px] font-medium'>{file.file.name}</p>
											</div>
										</div>

										<Button
											size='icon'
											variant='ghost'
											className='text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent'
											onClick={() => removeFile(file.id)}
											aria-label='Remove file'
										>
											<XIcon className='size-4' aria-hidden='true' />
										</Button>
									</div>
								))}
								<div className='flex justify-end gap-2'>
									<Button variant='ghost' onClick={() => clearFiles()} disabled={isUploading}>
										Limpar
									</Button>
								</div>
							</div>
						)}

						<p aria-live='polite' role='region' className='text-muted-foreground mt-2 text-center text-xs'>
							Selecione até {maxFiles} planilhas .xlsx para enviar.
						</p>
					</div>

					<DialogFooter>
						<Button type='submit' className='w-full' disabled={isUploading}>
							{isUploading ? (
								<>
									<Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
									Enviando...
								</>
							) : (
								<>Enviar planilhas</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
