import { useCallback, useEffect } from 'react';
import { GenericSetterFormProps } from './nfse-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

export function CardRetencoesFederaisDocumentos({ setForm, form }: GenericSetterFormProps) {
	const getValues = useCallback(
		(field: string) => {
			const value = form.js_servicos.reduce((acc, servico) => {
				if (field === 'ds_valor_pis') {
					return acc + parseFloat(servico.ds_valor_pis || '0');
				} else if (field === 'ds_valor_cofins') {
					return acc + parseFloat(servico.ds_valor_cofins || '0');
				} else if (field === 'ds_valor_inss') {
					return acc + parseFloat(servico.ds_valor_inss || '0');
				} else if (field === 'ds_valor_ir') {
					return acc + parseFloat(servico.ds_valor_ir || '0');
				} else if (field === 'ds_valor_csll') {
					return acc + parseFloat(servico.ds_valor_csll || '0');
				} else if (field === 'ds_outras_retencoes') {
					return acc + parseFloat(servico.ds_outras_retencoes || '0');
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
			ds_valor_pis: getValues('ds_valor_pis').toString(),
			ds_valor_cofins: getValues('ds_valor_cofins').toString(),
			ds_valor_inss: getValues('ds_valor_inss').toString(),
			ds_valor_ir: getValues('ds_valor_ir').toString(),
			ds_valor_csll: getValues('ds_valor_csll').toString(),
			ds_outras_retencoes: getValues('ds_outras_retencoes').toString(),
		}));
	}, [getValues, setForm]);

	return (
		<Card className='shadow-none' hidden={form.is_optante_simples_nacional}>
			<CardHeader>
				<CardTitle>Retenções Federais</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-6'>
					<div className='space-y-2'>
						<Label htmlFor='ds_valor_pis' className='text-sm font-medium'>
							PIS
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_pis'
							name='ds_valor_pis'
							value={form.ds_valor_pis}
							readOnly
							className='bg-muted'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_cofins' className='text-sm font-medium'>
							Cofins
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_cofins'
							name='cofins'
							value={form.ds_valor_cofins}
							readOnly
							className='bg-muted'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_inss' className='text-sm font-medium'>
							INSS
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_inss'
							name='ds_valor_inss'
							value={form.ds_valor_inss}
							readOnly
							className='bg-muted'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_ir' className='text-sm font-medium'>
							IR
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_ir'
							name='ds_valor_ir'
							value={form.ds_valor_ir}
							readOnly
							className='bg-muted'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_valor_csll' className='text-sm font-medium'>
							CSLL
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_valor_csll'
							name='ds_valor_csll'
							value={form.ds_valor_csll}
							readOnly
							className='bg-muted'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='ds_outras_retencoes' className='text-sm font-medium'>
							Outros
						</Label>
						<CurrencyInput
							maxLength={23}
							id='ds_outras_retencoes'
							name='ds_outras_retencoes'
							value={form.ds_outras_retencoes}
							readOnly
							className='bg-muted'
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
