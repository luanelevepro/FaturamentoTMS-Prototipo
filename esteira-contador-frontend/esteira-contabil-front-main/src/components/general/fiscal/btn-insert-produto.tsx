import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { createProduto } from '@/services/api/fiscal';
import { getTiposProduto } from '@/services/api/sistema';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';

type ProdutoInformation = {
	ds_nome: string;
	ds_unidade: string;
	cd_ncm: string;
	ds_tipo_item: string;
};

interface ProductLike {
	id?: string;
	id_externo?: string;
	ds_nome?: string;
	ds_unidade?: string;
	ds_tipo_item?: number | string;
	cd_tipo_item?: number | string;
	cd_ncm?: string;
}

type Props = {
	children?: React.ReactNode;
	onCreated?: (product: ProductLike) => void;
	defaultNcm?: string | null;
};

export default function BtnInsertProduto({ children, onCreated, defaultNcm }: Props) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [information, setInformation] = useState<ProdutoInformation>({
		ds_nome: '',
		ds_unidade: '',
		cd_ncm: defaultNcm || '',
		ds_tipo_item: '',
	});
	// Sempre que abrir o modal, atualiza o NCM padrão, se fornecido
	React.useEffect(() => {
		if (open) {
			setInformation((prev) => ({ ...prev, cd_ncm: defaultNcm || '' }));
		}
	}, [open, defaultNcm]);

	const [errors, setErrors] = useState<Record<string, string>>({});

	const unidades = ['KG', 'UN', 'LT', 'GL', 'M', 'M2', 'TON', 'GR', 'CX', 'N/D'];
	interface TipoProduto {
		id: string;
		ds_descricao: string;
		ds_codigo?: string | null;
	}

	const { data: tiposData = [] as TipoProduto[] } = useQuery<TipoProduto[]>({
		queryKey: ['get-tipos-produtos'],
		queryFn: () => getTiposProduto(),
		enabled: !!open,
	});

	const tipos = Array.isArray(tiposData) ? tiposData.map((t) => ({ value: t.ds_codigo || t.id, label: t.ds_descricao })) : [];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, value } = e.target;
		setInformation({ ...information, [id]: value });
		setErrors({ ...errors, [id]: '' });
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!information.ds_nome) newErrors.ds_nome = 'Informe o nome do produto';
		if (!information.ds_unidade) newErrors.ds_unidade = 'Informe a unidade';
		if (!information.cd_ncm) newErrors.cd_ncm = 'Informe o código NCM';
		if (!information.ds_tipo_item) newErrors.ds_tipo_item = 'Selecione o tipo do item';
		return newErrors;
	};

	const createProduct = async () => {
		setIsLoading(true);
		const v = validate();
		if (Object.keys(v).length) {
			setErrors(v);
			setIsLoading(false);
			return;
		}

		try {
			const payload = {
				ds_nome: information.ds_nome,
				ds_unidade: information.ds_unidade,
				cd_ncm: information.cd_ncm || null,
				ds_tipo_item: information.ds_tipo_item ? Number(information.ds_tipo_item) : null,
				ds_status: 'NOVO',
			};
			const result = await createProduto(payload);
			setOpen(false);
			toast.success('Produto criado com sucesso!');

			// Se o backend retornar o produto criado, repassamos, senão repassamos payload
			const created = result?.data || result || payload;
			if (onCreated) onCreated(created);
		} catch (error: unknown) {
			console.error('Erro ao criar produto:', error);

			// Extrai a mensagem de erro do backend
			let errorMessage = 'Erro ao criar produto';

			if (error && typeof error === 'object' && 'message' in error) {
				const err = error as { message?: string; response?: { data?: { message?: string } } };
				if (err.message) {
					// Se a mensagem contém "500:" ou código similar, extrai só a mensagem relevante
					const match = err.message.match(/(?:\d+:\s*)?(.+)/);
					errorMessage = match ? match[1] : err.message;
				} else if (err.response?.data?.message) {
					errorMessage = err.response.data.message;
				}
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createProduct();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Novo Produto</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='ds_nome'>Nome do Produto</Label>
						<Input id='ds_nome' value={information.ds_nome} onChange={handleChange} />
						{errors.ds_nome && <p className='text-sm text-red-600'>{errors.ds_nome}</p>}
					</div>

					<div className='grid gap-2'>
						<Label htmlFor='ds_unidade'>Unidade</Label>
						<Select
							onValueChange={(v) => {
								setInformation({ ...information, ds_unidade: v });
								setErrors((e) => ({ ...e, ds_unidade: '' }));
							}}
							aria-invalid={!!errors.ds_unidade}
							aria-describedby={errors.ds_unidade ? 'error-ds_unidade' : undefined}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='Selecione a unidade' />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{unidades.map((u) => (
										<SelectItem key={u} value={u}>
											{u}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						{errors.ds_unidade && (
							<p id='error-ds_unidade' className='text-sm text-red-600' role='alert'>
								{errors.ds_unidade}
							</p>
						)}
					</div>

					<div className='grid gap-2'>
						<Label htmlFor='cd_ncm'>Código NCM</Label>
						<Input id='cd_ncm' value={information.cd_ncm} onChange={handleChange} />
						{errors.cd_ncm && (
							<p className='text-sm text-red-600' role='alert'>
								{errors.cd_ncm}
							</p>
						)}
					</div>

					<div className='grid gap-2'>
						<Label htmlFor='ds_tipo_item'>Tipo do Item</Label>
						<Select
							onValueChange={(v) => {
								setInformation({ ...information, ds_tipo_item: v });
								setErrors((e) => ({ ...e, ds_tipo_item: '' }));
							}}
							aria-invalid={!!errors.ds_tipo_item}
							aria-describedby={errors.ds_tipo_item ? 'error-ds_tipo_item' : undefined}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='Selecione o tipo' />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{tipos.map((t) => (
										<SelectItem key={t.value} value={String(t.value)}>
											{t.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						{errors.ds_tipo_item && (
							<p id='error-ds_tipo_item' className='text-sm text-red-600' role='alert'>
								{errors.ds_tipo_item}
							</p>
						)}
					</div>

					<div className='flex justify-end gap-2'>
						<Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isLoading}>
							Cancelar
						</Button>
						<Button type='submit' disabled={isLoading}>
							{isLoading ? 'Criando...' : 'Criar Produto'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
