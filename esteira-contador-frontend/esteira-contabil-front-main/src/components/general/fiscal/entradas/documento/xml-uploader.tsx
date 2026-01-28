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

export function XMLUploader({ children }: { children: React.ReactNode }) {
	const maxSize = 10 * 1024 * 1024; // 10MB default
	const [modalOpen, setModalOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const queryClient = useQueryClient();

	const [
		{ files, isDragging, errors },
		{ handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
	] = useFileUpload({
		maxSize,
		accept: 'text/xml',
	});

	const file = files[0];

	const validateFile = (file: FileWithPreview) => {
		if (!file) {
			return 'Arquivo é obrigatório';
		}
		return null;
	};

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const error = validateFile(file);
		if (error) {
			toast.error(error);
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append('file', file.file as File);
			await uploadData('/api/fiscal/notas-fiscais/importar-xml', formData);
			toast.success('Arquivo importado com sucesso!');
			setModalOpen(false);
			removeFile(file.id);
			queryClient.refetchQueries({ queryKey: ['get-notificacoes'] });
			queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada'] });
		} catch (error) {
			console.error('Error uploading file:', error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Erro ao importar arquivo');
			}
			return;
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<Dialog open={modalOpen} onOpenChange={setModalOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Importar XML</DialogTitle>
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
								file && 'pointer-events-none opacity-50',
							)}
						>
							<input {...getInputProps()} id='xml-file' className='sr-only' aria-label='Upload file' disabled={Boolean(file)} />

							<div className='flex flex-col items-center justify-center text-center'>
								<div
									className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
									aria-hidden='true'
								>
									<UploadIcon className='size-4 opacity-60' />
								</div>
								<p className='mb-1.5 text-sm font-medium'>Enviar arquivo</p>
								<p className='text-muted-foreground text-xs'>
									Arraste o arquivo ou clique para selecionar (max. {formatBytes(maxSize)})
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
						{file && (
							<div className='space-y-2'>
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
										onClick={() => removeFile(files[0]?.id)}
										aria-label='Remove file'
									>
										<XIcon className='size-4' aria-hidden='true' />
									</Button>
								</div>
							</div>
						)}

						<p aria-live='polite' role='region' className='text-muted-foreground mt-2 text-center text-xs'>
							Selecione o arquivo XML que deseja importar.
						</p>
					</div>

					<DialogFooter>
						<Button type='submit' className='w-full' disabled={isUploading}>
							{isUploading ? (
								<>
									<Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
									Importando...
								</>
							) : (
								<>Importar</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
