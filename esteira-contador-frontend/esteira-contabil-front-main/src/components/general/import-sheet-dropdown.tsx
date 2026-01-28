'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Icons } from '@/components/layout/icons';
import { downloadXlsxModel } from '@/services/api/sistema';
import { uploadData } from '@/services/api/request-handler';
import { useQueryClient } from '@tanstack/react-query';

interface ImportSheetDropdownProps {
	tableName: string;
	buttonLabel?: string;
	displayName?: string;
}

export function ImportSheetDropdown({ tableName, buttonLabel = 'Importar Planilha', displayName }: ImportSheetDropdownProps) {
	const [modalOpen, setModalOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const queryClient = useQueryClient();

	const validateFile = (file: File | null): string | null => {
		if (!file) {
			return 'Arquivo é obrigatório';
		}
		if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
			return 'Apenas arquivos Excel são permitidos';
		}
		return null;
	};

	const handleImportarExcel = () => {
		setModalOpen(true);
	};

	const handleBaixarModelo = async () => {
		toast.promise(downloadXlsxModel(tableName), {
			loading: 'Baixando modelo...',
			success: () => {
				return 'Modelo requisitado com sucesso';
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				return 'Erro ao baixar modelo';
			},
		});
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		const error = validateFile(file);
		if (error) {
			toast.error(error);
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append('file', file as File);
			formData.append('table', tableName);

			// Mock API call to upload file
			await uploadData('/api/import/xlsx', formData);

			setModalOpen(false);
			setFile(null);
			toast.success('Arquivo importado com sucesso');
			queryClient.refetchQueries({ queryKey: ['get-notificacoes'] });
		} catch (error) {
			console.error('Error uploading file:', error);
			toast.error('Erro ao importar arquivo');
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' className='flex items-center gap-2'>
						<FileSpreadsheet className='h-4 w-4' />
						{buttonLabel}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem onClick={handleImportarExcel} className='cursor-pointer'>
						<Upload className='mr-2 h-4 w-4' />
						Importar Excel
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleBaixarModelo} className='cursor-pointer'>
						<Download className='mr-2 h-4 w-4' />
						Baixar Modelo
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Importar planilha</DialogTitle>
						<DialogDescription>Selecione um arquivo Excel para importar dados para {displayName ?? tableName}.</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div className='grid w-full gap-2'>
							<div className='border-input bg-muted/50 hover:bg-muted/80 relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center'>
								<input
									type='file'
									id='file-upload'
									className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
									onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
									accept='.xls,.xlsx'
								/>
								<div className='pointer-events-none flex flex-col items-center gap-1'>
									<FileSpreadsheet className='text-muted-foreground h-8 w-8' />
									<p className='text-sm font-medium'>Clique para selecionar ou arraste um arquivo Excel</p>
									<p className='text-muted-foreground text-xs'>XLSX ou XLS até 10MB</p>
									{file && <p className='text-primary mt-2 text-sm font-medium'>{file.name}</p>}
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button type='button' variant='outline' onClick={() => setModalOpen(false)} disabled={isUploading}>
								Cancelar
							</Button>
							<Button type='submit' disabled={isUploading}>
								{isUploading ? (
									<>
										<Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
										Importando...
									</>
								) : (
									'Importar'
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
