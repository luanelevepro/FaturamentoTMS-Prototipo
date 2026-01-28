import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import { createUpdateEmpresa } from '@/services/api/empresas';
import { Select, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { useCompanyContext } from '@/context/company-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type EmpresaInformation = {
	ds_razao_social: string;
	ds_fantasia: string;
	ds_documento: string;
	ds_cnae: string;
	ds_uf: string;
	dt_ativacao: Date | null;
	id_escritorio: string;
	is_ativo: boolean;
};

type HandleInsertEmpresaProps = {
	children: React.ReactNode;
	onChange: () => void;
};

export default function HandleInsertEmpresa({ children, onChange }: HandleInsertEmpresaProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { state } = useCompanyContext();
	const [information, setInformation] = useState<EmpresaInformation>({
		ds_razao_social: '',
		ds_fantasia: '',
		ds_documento: '',
		ds_cnae: '',
		ds_uf: '',
		dt_ativacao: null,
		id_escritorio: state,
		is_ativo: true,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const estados = [
		{ sigla: 'AC', nome: 'Acre' },
		{ sigla: 'AL', nome: 'Alagoas' },
		{ sigla: 'AP', nome: 'Amapá' },
		{ sigla: 'AM', nome: 'Amazonas' },
		{ sigla: 'BA', nome: 'Bahia' },
		{ sigla: 'CE', nome: 'Ceará' },
		{ sigla: 'DF', nome: 'Distrito Federal' },
		{ sigla: 'ES', nome: 'Espírito Santo' },
		{ sigla: 'GO', nome: 'Goiás' },
		{ sigla: 'MA', nome: 'Maranhão' },
		{ sigla: 'MT', nome: 'Mato Grosso' },
		{ sigla: 'MS', nome: 'Mato Grosso do Sul' },
		{ sigla: 'MG', nome: 'Minas Gerais' },
		{ sigla: 'PA', nome: 'Pará' },
		{ sigla: 'PB', nome: 'Paraíba' },
		{ sigla: 'PR', nome: 'Paraná' },
		{ sigla: 'PE', nome: 'Pernambuco' },
		{ sigla: 'PI', nome: 'Piauí' },
		{ sigla: 'RJ', nome: 'Rio de Janeiro' },
		{ sigla: 'RN', nome: 'Rio Grande do Norte' },
		{ sigla: 'RS', nome: 'Rio Grande do Sul' },
		{ sigla: 'RO', nome: 'Rondônia' },
		{ sigla: 'RR', nome: 'Roraima' },
		{ sigla: 'SC', nome: 'Santa Catarina' },
		{ sigla: 'SP', nome: 'São Paulo' },
		{ sigla: 'SE', nome: 'Sergipe' },
		{ sigla: 'TO', nome: 'Tocantins' },
	];

	const campoMapeadoComAcento: Record<string, string> = {
		razao_social: 'Razão Social',
		fantasia: 'Nome Fantasia',
		documento: 'CNPJ',
		cnae: 'CNAE',
		uf: 'UF',
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, value } = e.target;

		let formattedValue = value;

		if (id === 'ds_documento') {
			formattedValue = value
				.replace(/\D/g, '')
				.replace(/^(\d{2})(\d)/, '$1.$2')
				.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
				.replace(/\.(\d{3})(\d)/, '.$1/$2')
				.replace(/(\d{4})(\d)/, '$1-$2')
				.slice(0, 18);
		}

		if (id === 'ds_cnae') {
			formattedValue = value
				.replace(/\D/g, '')
				.replace(/^(\d{4})(\d)/, '$1-$2')
				.replace(/(\d{4}-\d)(\d{2})/, '$1/$2')
				.slice(0, 10);
		}

		setInformation({ ...information, [id]: formattedValue });
		setErrors({ ...errors, [id]: '' });
	};

	const validateFields = (): Record<string, string> => {
		const newErrors: Record<string, string> = {};
		Object.entries(information).forEach(([key, value]) => {
			if (!value && ['ds_razao_social', 'ds_documento', 'ds_uf', 'ds_cnae', 'ds_fantasia', 'dt_ativacao'].includes(key)) {
				newErrors[key] = 'Campo obrigatório.';
			}
		});
		if (information.ds_documento && information.ds_documento.replace(/\D/g, '').length !== 14) {
			newErrors.ds_documento = 'CNPJ inválido. Deve conter 14 dígitos.';
		}
		return newErrors;
	};

	const createNewEmpresa = async () => {
		setIsLoading(true);
		setErrors({});

		const validationErrors = validateFields();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsLoading(false);
			return;
		}

		try {
			await createUpdateEmpresa(information);
			toast.success('Empresa adicionada com sucesso.');
			setOpen(false);
			onChange();
		} catch (error) {
			console.error('Error inserting:', error);
			toast.error('Erro ao adicionar empresa.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		createNewEmpresa();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nova Empresa</DialogTitle>
					<DialogDescription>Insira os dados da nova empresa.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					{['ds_razao_social', 'ds_fantasia', 'ds_documento', 'ds_cnae'].map((field) => (
						<div key={field} className='grid gap-2'>
							<Label htmlFor={field}>
								{campoMapeadoComAcento[field.replace('ds_', '')] ||
									field
										.replace('ds_', '')
										.replace('_', ' ')
										.toLowerCase()
										.replace(/^\w/, (c) => c.toUpperCase())}
							</Label>

							<Input
								id={field}
								type='text'
								placeholder={`Digite o ${field.replace('ds_', '').replace('_', ' ').toLowerCase()}`}
								value={information[field as keyof EmpresaInformation] ? String(information[field as keyof EmpresaInformation]) : ''}
								onChange={handleChange}
								disabled={isLoading}
							/>
							{errors[field] && (
								<p className='text-sm text-red-600' role='alert'>
									{errors[field]}
								</p>
							)}
						</div>
					))}
					<div className='grid grid-cols-2 gap-4'>
						<div className='grid gap-2 self-start'>
							<Label htmlFor='ds_uf'>UF</Label>
							<Select
								defaultValue={information.ds_uf}
								onValueChange={(value) => setInformation({ ...information, ds_uf: value })}
								disabled={isLoading}
							>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Selecione o estado' />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{estados.map((estado) => (
											<SelectItem key={estado.sigla} value={estado.sigla}>
												{estado.nome}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{errors.ds_uf && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.ds_uf}
								</p>
							)}
						</div>
						<div className='grid gap-2 self-start'>
							<Label htmlFor='dt_ativacao'>Data de Abertura</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn('justify-start text-left font-normal', !information.dt_ativacao && 'text-muted-foreground')}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{information.dt_ativacao ? format(information.dt_ativacao, 'dd/MM/yyyy') : <span>Insira uma data</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										autoFocus
										footer={
											<Button
												variant='ghost'
												size='sm'
												className='w-full'
												onClick={() => setInformation({ ...information, dt_ativacao: null })}
											>
												Limpar
											</Button>
										}
										selected={information.dt_ativacao || new Date()}
										onSelect={(date) => setInformation({ ...information, dt_ativacao: date || new Date() })}
									/>
								</PopoverContent>
							</Popover>
							{errors.dt_ativacao && (
								<p className='text-sm text-red-600' role='alert'>
									{errors.dt_ativacao}
								</p>
							)}
						</div>
					</div>

					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Adicionando...' : 'Adicionar empresa'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
