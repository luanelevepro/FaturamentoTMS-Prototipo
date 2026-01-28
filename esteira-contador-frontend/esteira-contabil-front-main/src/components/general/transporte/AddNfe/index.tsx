import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SquarePlus, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/layout/icons';
import { uploadData } from '@/services/api/request-handler';
import { useQueryClient } from '@tanstack/react-query';
import { XMLInfo } from '@/interfaces/faturamento/transporte/dfe';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Addfe() {
	const [open, setOpen] = useState(false);
	const [xmlFiles, setXmlFiles] = useState<XMLInfo[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const queryClient = useQueryClient();

	function handleButtonClick() {
		fileInputRef.current?.click();
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (files && files.length > 0) {
			const selectedFiles = Array.from(files);

			selectedFiles.forEach((file) => {
				if (!file.name.toLowerCase().endsWith('.xml')) {
					toast.error(`${file.name}: Apenas arquivos .xml são permitidos`);
					return;
				}

				if (file.size > MAX_FILE_SIZE) {
					toast.error(`${file.name}: Arquivo excede o tamanho máximo de 10MB`);
					return;
				}

				const alreadyExists = xmlFiles.some((f) => f.file.name === file.name);
				if (alreadyExists) {
					toast.info(`${file.name}: Arquivo já adicionado`);
					return;
				}

				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target?.result as string;
					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(content, 'text/xml');

					const parserError = xmlDoc.querySelector('parsererror');
					if (parserError) {
						toast.error(`${file.name}: Arquivo XML inválido`);
						return;
					}

					const rootTag = xmlDoc.documentElement.tagName;
					let tipo: 'NFe' | 'CTe' | 'Desconhecido' = 'Desconhecido';
					if (rootTag === 'NFe' || rootTag === 'nfeProc') tipo = 'NFe';
					else if (rootTag === 'CTe' || rootTag === 'cteProc') tipo = 'CTe';

					const nCT = xmlDoc.querySelector('nNF')?.textContent || xmlDoc.querySelector('nCT')?.textContent || 'Sem número';

					setXmlFiles((prev) => {
						const alreadyExists = prev.some((f) => f.file.name === file.name);
						if (alreadyExists) return prev;
						return [...prev, { file, nCT, tipo }];
					});
				};

				reader.onerror = () => {
					toast.error(`${file.name}: Erro ao ler o arquivo`);
				};

				reader.readAsText(file);
			});
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	function handleRemoveFile(fileName: string) {
		setXmlFiles((prev) => prev.filter((f) => f.file.name !== fileName));
		toast.info(`Arquivo ${fileName} removido`);
	}

	async function handleSubmit() {
		if (xmlFiles.length === 0) {
			toast.error('Nenhum arquivo selecionado');
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();

			xmlFiles.forEach((doc) => {
				formData.append('files', doc.file);
			});

			await uploadData('/api/transporte/upload-xml', formData);

			toast.success('Documentos enviados com sucesso!');
			setXmlFiles([]);
			setOpen(false);

			queryClient.invalidateQueries({ queryKey: ['dfes'] });
		} catch (error) {
			console.error('Error uploading files:', error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Erro ao enviar documentos');
			}
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<SquarePlus className='mr-2 h-4 w-4' />
					Importar documentos
				</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<SquarePlus className='size-5' /> Importar documentos
					</DialogTitle>
					<DialogDescription>Importe todos os documentos do tipo NFe ou CTe (máx. 10MB por arquivo):</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-6'>
					<input type='file' accept='.xml' multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

					<button
						className='hover:bg-muted/50 flex items-center justify-center gap-2.5 rounded-lg border py-6 transition disabled:cursor-not-allowed disabled:opacity-50'
						onClick={handleButtonClick}
						disabled={isUploading}
					>
						<Icons.ReceiptText className='h-6 w-6' />
						<div>
							<p className='font-medium'>Clique aqui para enviar os documentos.</p>
							<p className='text-muted-foreground -mt-1 text-start text-sm'>Somente arquivos .xml (máx. 10MB cada)</p>
						</div>
					</button>

					{xmlFiles.length > 0 && (
						<div className='flex max-h-60 flex-col gap-1 overflow-auto'>
							{xmlFiles.map(({ file, nCT, tipo }) => (
								<div
									key={file.name}
									className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition'
								>
									<div className='flex flex-col'>
										<span className='text-sm font-medium'>
											{tipo}_{nCT}.xml
										</span>
										<span className='text-muted-foreground text-xs'>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
									</div>
									<Button
										variant='danger'
										size='close'
										type='button'
										onClick={() => handleRemoveFile(file.name)}
										disabled={isUploading}
									>
										<X className='size-3' />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
				{xmlFiles.length > 0 && (
					<DialogFooter>
						<Button disabled={xmlFiles.length === 0 || isUploading} onClick={handleSubmit} className='w-full'>
							{isUploading ? (
								<>
									<Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
									Enviando...
								</>
							) : (
								<>Finalizar</>
							)}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
