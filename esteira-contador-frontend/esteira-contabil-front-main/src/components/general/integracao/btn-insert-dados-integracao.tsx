import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { getIntegracaoCompletaById, testarIntegracao, upsertConfigIntegracao } from '@/services/api/integracao';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Eye, EyeOff, Info } from 'lucide-react';

type Campo = {
	id: string;
	ds_campo_nome: string;
	ds_campo_placeholder: string;
	ds_campo_tipo: string;
	ds_campo_ordem: number;
	ds_descricao?: string;
};

type IntegracaoWithCampos = {
	id: string;
	ds_nome: string;
	sis_integracao_campos: Campo[];
	sis_integracao_config?: { ds_valores_config: Record<string, string> }[];
};

type Props = {
	integracaoId: string;
	children: React.ReactNode;
	is_view?: boolean;
};

export default function IntegrationConfigModal({ integracaoId, children, is_view = false }: Props) {
	const { state: empresa_id } = useCompanyContext();
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [values, setValues] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

	const { data: integracao } = useQuery<IntegracaoWithCampos>({
		queryKey: ['get-integracao-completo', integracaoId, empresa_id],
		queryFn: () => getIntegracaoCompletaById(integracaoId, empresa_id),
		enabled: open,
		staleTime: 5 * 60 * 1000,
	});

	const existingConfig = React.useMemo(
		() => integracao?.sis_integracao_config?.[0]?.ds_valores_config || {},
		[integracao]
	);

	useEffect(() => {
		if (open && integracao) {
			const initVals: Record<string, string> = {};
			const initShow: Record<string, boolean> = {};
			integracao.sis_integracao_campos
				.sort((a, b) => a.ds_campo_ordem - b.ds_campo_ordem)
				.forEach((c) => {
					initVals[c.ds_campo_nome] = existingConfig[c.ds_campo_nome] || '';
					initShow[c.ds_campo_nome] = false;
				});
			setValues(initVals);
			setShowPassword(initShow);
			setErrors({});
		}
	}, [open, integracao, existingConfig]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { id, value } = e.target;
		setValues((v) => ({ ...v, [id]: value }));
		setErrors((err) => ({ ...err, [id]: '' }));
	}

	function validate() {
		const newErrors: Record<string, string> = {};
		integracao?.sis_integracao_campos.forEach((c) => {
			if (!values[c.ds_campo_nome]?.trim()) {
				newErrors[c.ds_campo_nome] = 'Campo obrigatório.';
			}
		});
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;
		setIsSubmitting(true);
		try {
			await toast.promise(() => upsertConfigIntegracao(integracaoId, empresa_id, values), {
				loading: 'Salvando configuração...',
				success: 'Configuração salva com sucesso!',
				error: 'Erro ao salvar configuração.',
			});
			setOpen(false);
		} finally {
			setIsSubmitting(false);
			await queryClient.invalidateQueries({ queryKey: ['get-integracao-completo', integracaoId, empresa_id] });
			await queryClient.invalidateQueries({ queryKey: ['test-conexao', integracaoId, empresa_id] });
		}
	}

	async function handleTest() {
		setIsTesting(true);
		await Promise.resolve();
		try {
			await toast.promise(() => testarIntegracao(integracaoId, empresa_id), {
				loading: 'Testando configuração...',
				success: 'Teste retornou sucesso!',
				error: 'Erro ao realizar teste.',
			});
		} finally {
			setIsTesting(false);
		}
	}
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>Configurar: {integracao?.ds_nome || '...'}</DialogTitle>
					<DialogDescription>Preencha os campos abaixo.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					{integracao?.sis_integracao_campos
						.sort((a, b) => a.ds_campo_ordem - b.ds_campo_ordem)
						.map((campo) => {
							const name = campo.ds_campo_nome;
							const isPwd = campo.ds_campo_tipo === 'password';
							return (
								<div key={campo.id} className='grid gap-2'>
									<div className='flex items-center gap-2'>
										<Label htmlFor={name}>{campo.ds_campo_nome || campo.ds_campo_placeholder}</Label>
										{campo.ds_descricao && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className='h-4 w-4 cursor-help text-gray-400' />
												</TooltipTrigger>
												<TooltipContent side='right'>{campo.ds_descricao}</TooltipContent>
											</Tooltip>
										)}
									</div>
									<div className='relative'>
										<Input
											id={name}
											type={
												isPwd
													? showPassword[name]
														? 'text'
														: 'password'
													: campo.ds_campo_tipo === 'number'
														? 'number'
														: 'text'
											}
											placeholder={existingConfig[name] || campo.ds_campo_placeholder || ''}
											value={values[name] || ''}
											onChange={handleChange}
											disabled={is_view || isSubmitting}
										/>
										{isPwd && !is_view && (
											<button
												type='button'
												onClick={() =>
													setShowPassword((s) => ({
														...s,
														[name]: !s[name],
													}))
												}
												className='absolute inset-y-0 right-2 flex items-center text-gray-500'
											>
												{showPassword[name] ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
											</button>
										)}
									</div>
									{errors[name] && <p className='text-sm text-red-600'>{errors[name]}</p>}
								</div>
							);
						})}
					<DialogFooter className='pt-4'>
						<Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isSubmitting || isTesting}>
							Cancelar
						</Button>
						<Button type='button' variant='outline' onClick={() => handleTest()} disabled={isSubmitting || is_view || isTesting}>
							{isTesting ? 'Testando...' : 'Testar'}
						</Button>
						<Button type='submit' disabled={isSubmitting || is_view || isTesting} onClick={() => handleSubmit}>
							{isSubmitting || isTesting ? 'Salvando...' : 'Salvar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
