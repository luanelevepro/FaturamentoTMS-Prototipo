import { useCallback, useEffect } from 'react';
import { GenericSetterFormProps } from './nfse-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

export function CardValoresTotaisDocumentos({ setForm, form }: GenericSetterFormProps) {
	const getValues = useCallback(
		(field: string) => {
			const value = form.js_servicos.reduce((acc, servico) => {
				if (field === 'ds_valor_servicos') {
					return acc + parseFloat(servico.ds_valor_total || '0');
				} else if (field === 'ds_valor_retencoes') {
					if (servico.is_iss_retido) {
						return (
							acc +
							parseFloat(servico.ds_valor_cofins || '0') +
							parseFloat(servico.ds_valor_pis || '0') +
							parseFloat(servico.ds_valor_iss || '0') +
							parseFloat(servico.ds_valor_inss || '0') +
							parseFloat(servico.ds_valor_ir || '0') +
							parseFloat(servico.ds_valor_csll || '0') +
							parseFloat(servico.ds_outras_retencoes || '0')
						);
					} else {
						return (
							acc +
							parseFloat(servico.ds_valor_cofins || '0') +
							parseFloat(servico.ds_valor_pis || '0') +
							parseFloat(servico.ds_valor_inss || '0') +
							parseFloat(servico.ds_valor_ir || '0') +
							parseFloat(servico.ds_valor_csll || '0') +
							parseFloat(servico.ds_outras_retencoes || '0')
						);
					}
				} else if (field === 'ds_valor_descontos') {
					return acc + parseFloat(servico.ds_valor_descontos || '0');
				} else if (field === 'ds_valor_liquido_nfse') {
					if (servico.is_iss_retido) {
						return (
							acc +
							parseFloat(servico.ds_valor_total || '0') -
							(parseFloat(servico.ds_valor_cofins || '0') +
								parseFloat(servico.ds_valor_pis || '0') +
								parseFloat(servico.ds_valor_iss || '0') +
								parseFloat(servico.ds_valor_inss || '0') +
								parseFloat(servico.ds_valor_ir || '0') +
								parseFloat(servico.ds_valor_csll || '0') +
								parseFloat(servico.ds_outras_retencoes || '0')) -
							parseFloat(servico.ds_valor_descontos || '0')
						);
					} else {
						return (
							acc +
							parseFloat(servico.ds_valor_total || '0') -
							(parseFloat(servico.ds_valor_cofins || '0') +
								parseFloat(servico.ds_valor_pis || '0') +
								parseFloat(servico.ds_valor_inss || '0') +
								parseFloat(servico.ds_valor_ir || '0') +
								parseFloat(servico.ds_valor_csll || '0') +
								parseFloat(servico.ds_outras_retencoes || '0')) -
							parseFloat(servico.ds_valor_descontos || '0')
						);
					}
				}
				return acc;
			}, 0);
			return value;
		},
		[form.js_servicos],
	);

	useEffect(() => {
		setForm((prev) => ({
			...prev,
			ds_valor_servicos: getValues('ds_valor_servicos').toString(),
			ds_valor_retencoes: getValues('ds_valor_retencoes').toString(),
			ds_valor_descontos: getValues('ds_valor_descontos').toString(),
			ds_valor_liquido_nfse: getValues('ds_valor_liquido_nfse').toString(),
		}));
	}, [getValues, setForm]);

	return (
		<Card className='shadow-none'>
			<CardHeader>
				<CardTitle>Valores Totais</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
					<div className='space-y-2'>
						<Label htmlFor='ds_valor_servicos' className='text-sm font-medium'>
							Valor do Serviço
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_servicos'
							name='ds_valor_servicos'
							value={form.ds_valor_servicos}
							className='bg-muted'
							readOnly
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_descontos' className='text-sm font-medium'>
							Descontos
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_descontos'
							name='ds_valor_descontos'
							value={form.ds_valor_descontos}
							className='bg-muted'
							readOnly
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_retencoes' className='text-sm font-medium'>
							Retenções
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_retencoes'
							name='ds_valor_retencoes'
							value={form.ds_valor_retencoes}
							className='bg-muted'
							readOnly
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_liquido_nfse' className='text-sm font-medium'>
							Valor Líquido
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_liquido_nfse'
							name='ds_valor_liquido_nfse'
							value={form.ds_valor_liquido_nfse}
							className='bg-muted'
							readOnly
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
