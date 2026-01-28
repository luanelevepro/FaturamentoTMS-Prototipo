import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { Edit3, Loader2 } from 'lucide-react';
import { updateFornecedores } from '@/services/api/fiscal';
import type { FornecedoresData } from '@/pages/fiscal/fornecedores';
import { useCompanyContext } from '@/context/company-context';

export interface EditFornecedorModalProps {
	fornecedor: FornecedoresData;
	disabled?: boolean;
	onFornecedorUpdated?: () => void;
}

type FornecedorUpdateData = {
	ds_nome: string;
	ds_endereco?: string;
	ds_cep: string;
	ds_inscricao: string;
	ds_telefone?: string;
	ds_inscricao_municipal: string;
	ds_bairro?: string;
	ds_email?: string;
	ds_codigo_municipio?: number;
	ds_complemento?: string;
	ds_ibge: number;
	ds_documento: string;
	ds_codigo_uf?: string;
};

export function EditFornecedorModal({ fornecedor, disabled = false, onFornecedorUpdated }: EditFornecedorModalProps) {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const [formData, setFormData] = useState<FornecedorUpdateData>({
		ds_nome: fornecedor.ds_nome || '',
		ds_endereco: fornecedor.ds_endereco || '',
		ds_cep: fornecedor.ds_cep || '',
		ds_inscricao: fornecedor.ds_inscricao || '',
		ds_telefone: fornecedor.ds_telefone || '',
		ds_inscricao_municipal: fornecedor.ds_inscricao_municipal || '',
		ds_bairro: fornecedor.ds_bairro || '',
		ds_email: fornecedor.ds_email || '',
		ds_codigo_municipio:
			typeof fornecedor.ds_codigo_municipio === 'string'
				? parseInt(fornecedor.ds_codigo_municipio, 10)
				: fornecedor.ds_codigo_municipio || 0,
		ds_complemento: fornecedor.ds_complemento || '',
		ds_ibge: typeof fornecedor.ds_ibge === 'string' ? parseInt(fornecedor.ds_ibge, 10) : fornecedor.ds_ibge || 0,
		ds_documento: fornecedor.ds_documento || '',
		ds_codigo_uf: fornecedor.ds_codigo_uf || '',
	});

	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: (data: FornecedorUpdateData) => {
			if (!fornecedor?.id) throw new Error('ID do fornecedor não encontrado');
			return updateFornecedores(fornecedor.id, data);
		},
		onSuccess: () => {
			toast.success('Fornecedor atualizado com sucesso!');
			setOpen(false);
			// Chamar callback para limpar seleção se fornecido
			if (onFornecedorUpdated) {
				onFornecedorUpdated();
			}
			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: ['get-fornecedores-empresa', state] });
		},
		onError: (error: Error) => {
			toast.error(`Erro ao atualizar fornecedor: ${error.message || 'Erro desconhecido'}`);
		},
	});

	// Preencher formulário quando o modal abrir
	const handleOpenChange = (newOpen: boolean) => {
		if (newOpen && fornecedor) {
			// Sempre preencher com todos os dados atuais do fornecedor
			setFormData({
				ds_nome: fornecedor.ds_nome || '',
				ds_endereco: fornecedor.ds_endereco || '',
				ds_cep: fornecedor.ds_cep || '',
				ds_inscricao: fornecedor.ds_inscricao || '',
				ds_telefone: fornecedor.ds_telefone || '',
				ds_inscricao_municipal: fornecedor.ds_inscricao_municipal || '',
				ds_bairro: fornecedor.ds_bairro || '',
				ds_email: fornecedor.ds_email || '',
				ds_codigo_municipio:
					typeof fornecedor.ds_codigo_municipio === 'string'
						? parseInt(fornecedor.ds_codigo_municipio, 10)
						: fornecedor.ds_codigo_municipio || 0,
				ds_complemento: fornecedor.ds_complemento || '',
				ds_ibge: typeof fornecedor.ds_ibge === 'string' ? parseInt(fornecedor.ds_ibge, 10) : fornecedor.ds_ibge || 0,
				ds_documento: fornecedor.ds_documento || '',
				ds_codigo_uf: fornecedor.ds_codigo_uf || '',
			});
		}
		setOpen(newOpen);
	};

	const handleInputChange = (field: keyof FornecedorUpdateData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value === '' ? undefined : value,
		}));
	};

	const handleNumberInputChange = (field: keyof FornecedorUpdateData, value: string) => {
		setFormData((prev) => {
			const numericValue = value === '' || value === undefined ? undefined : parseInt(value, 10);
			// Se parseInt retornar NaN, usar undefined
			const finalValue = isNaN(numericValue as number) ? undefined : numericValue;

			return {
				...prev,
				[field]: finalValue,
			};
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Garantir que os campos numéricos sejam enviados como números
		const dataToSend = {
			...formData,
			ds_codigo_municipio:
				typeof formData.ds_codigo_municipio === 'string' ? parseInt(formData.ds_codigo_municipio, 10) : formData.ds_codigo_municipio,
			ds_ibge: typeof formData.ds_ibge === 'string' ? parseInt(formData.ds_ibge, 10) : formData.ds_ibge,
		};

		updateMutation.mutate(dataToSend);
	};

	if (!fornecedor) {
		return null;
	}
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant='outline' size='icon' disabled={disabled} className='shrink-0' title='Editar fornecedor'>
					<Edit3 className='h-4 w-4' />
				</Button>
			</DialogTrigger>

			<DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Editar Fornecedor</DialogTitle>
					<div className='text-muted-foreground text-sm'>
						<p>
							<strong>Nome:</strong> {fornecedor.ds_nome}
						</p>
						<p>
							<strong>CNPJ:</strong> {formatCnpjCpf(fornecedor.ds_documento)}
						</p>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='ds_nome'>Nome / Razão Social</Label>
							<Input
								id='ds_nome'
								value={formData.ds_nome || ''}
								onChange={(e) => handleInputChange('ds_nome', e.target.value)}
								placeholder='Nome do fornecedor'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_inscricao_municipal'>Inscrição Municipal</Label>
							<Input
								id='ds_inscricao_municipal'
								value={formData.ds_inscricao_municipal || ''}
								onChange={(e) => handleInputChange('ds_inscricao_municipal', e.target.value)}
								placeholder='Inscrição municipal'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_email'>E-mail</Label>
							<Input
								id='ds_email'
								type='email'
								value={formData.ds_email || ''}
								onChange={(e) => handleInputChange('ds_email', e.target.value)}
								placeholder='email@exemplo.com'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_telefone'>Telefone</Label>
							<Input
								id='ds_telefone'
								value={formData.ds_telefone || ''}
								onChange={(e) => handleInputChange('ds_telefone', e.target.value)}
								placeholder='(11) 99999-9999'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_cep'>CEP</Label>
							<Input
								id='ds_cep'
								value={formData.ds_cep || ''}
								onChange={(e) => handleInputChange('ds_cep', e.target.value)}
								placeholder='00000-000'
								maxLength={9}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_endereco'>Endereço</Label>
							<Input
								id='ds_endereco'
								value={formData.ds_endereco || ''}
								onChange={(e) => handleInputChange('ds_endereco', e.target.value)}
								placeholder='Rua, número'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_bairro'>Bairro</Label>
							<Input
								id='ds_bairro'
								value={formData.ds_bairro || ''}
								onChange={(e) => handleInputChange('ds_bairro', e.target.value)}
								placeholder='Nome do bairro'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_complemento'>Complemento</Label>
							<Input
								id='ds_complemento'
								value={formData.ds_complemento || ''}
								onChange={(e) => handleInputChange('ds_complemento', e.target.value)}
								placeholder='Apto, sala, etc.'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_inscricao'>Inscrição Estadual</Label>
							<Input
								id='ds_inscricao'
								value={formData.ds_inscricao || ''}
								onChange={(e) => handleInputChange('ds_inscricao', e.target.value)}
								placeholder='Inscrição estadual'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_codigo_municipio'>Código Município</Label>
							<Input
								id='ds_codigo_municipio'
								value={formData.ds_codigo_municipio || ''}
								onChange={(e) => handleNumberInputChange('ds_codigo_municipio', e.target.value)}
								placeholder='Ex: 3550308'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_ibge'>Código IBGE</Label>
							<Input
								id='ds_ibge'
								value={formData.ds_ibge || ''}
								onChange={(e) => handleNumberInputChange('ds_ibge', e.target.value)}
								placeholder='Ex: 3550308'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_codigo_uf'>Código UF</Label>
							<Input
								id='ds_codigo_uf'
								value={formData.ds_codigo_uf || ''}
								onChange={(e) => handleInputChange('ds_codigo_uf', e.target.value)}
								placeholder='Ex: 35'
							/>
						</div>
					</div>

					<div className='flex justify-end gap-2 pt-4'>
						<Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={updateMutation.isPending}>
							Cancelar
						</Button>
						<Button type='submit' disabled={updateMutation.isPending}>
							{updateMutation.isPending ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Salvando...
								</>
							) : (
								'Salvar Alterações'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
