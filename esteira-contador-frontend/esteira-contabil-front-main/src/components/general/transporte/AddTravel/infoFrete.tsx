import { Card } from '@/components/ui/card';
import { InputWithLabel } from '../../faturamento/InputWithLabel';
import { SelectWithLabel } from '../../faturamento/SelectWithLabel';
import { INfe } from './tableNFe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';

interface IPropsFrete {
	data: INfe[];
}

export default function InfoFrete({ data }: IPropsFrete) {
	console.log('🚀 ~ InfoFrete ~ data:', data);

	const totalValor = data.reduce((acc, item) => acc + item.valorTotal, 0);

	const firstCard = [
		{ title: 'Produto predominante', value: 'Matéria prima barriga de porco' },
		{
			title: 'Valor total da carga',
			value: `${totalValor.toLocaleString('pt-br', {
				style: 'currency',
				currency: 'BRL',
			})}`,
		},
		{ title: 'Documentos selecionados', value: `${data.length} documentos` },
	];

	const secondCard = [
		{ title: 'Remetente', value: 'Destinatário ABCD' },
		{
			title: 'Destinatário',
			value: `Destinatário ABCD`,
		},
		{ title: 'Origem', value: `Tangará/SC` },
		{ title: 'Destino', value: `Rio do Sul/SC` },
	];

	return (
		<div>
			<Card className='flex flex-row gap-4 p-4'>
				{firstCard.map((item) => {
					return (
						<div className='flex-1' key={item.title}>
							<p className='text-sm'>{item.title}</p>
							<p className='font-semibold'>{item.value}</p>
						</div>
					);
				})}
			</Card>
			<div className='mt-4 w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-1/4'>NFe</TableHead>
							<TableHead className='w-1/4'>Remetente</TableHead>
							<TableHead className='w-1/4'>Destinatário</TableHead>
							<TableHead className='w-1/4'>Valor Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((cte) => (
							<TableRow key={cte.id}>
								<TableCell>{cte.nf}</TableCell>
								<TableCell>{cte.remetente}</TableCell>
								<TableCell>{cte.destinatario}</TableCell>
								<TableCell>
									{cte.valorTotal.toLocaleString('pt-br', {
										style: 'currency',
										currency: 'BRL',
									})}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<h6 className='my-6 mt-6 font-medium'>Detalhes do frete</h6>
			<Card className='my-4 flex flex-row gap-4 p-4'>
				{secondCard.map((item) => {
					return (
						<div className='flex-1' key={item.title}>
							<p className='text-sm'>{item.title}</p>
							<p className='font-semibold'>{item.value}</p>
						</div>
					);
				})}
			</Card>
			<div className='flex gap-4'>
				<InputWithLabel className='flex-1' id='pagamento' label='Peso total da carga (bruto)' placeholder='Digite...' required />
				<InputWithLabel className='flex-1' id='pagamento' label='Quem vai pagar pelo frete' placeholder='Digite...' />
				<div className={'grid flex-1 gap-2'}>
					<Label>Valor do frete (R$)</Label>
					<CurrencyInput maxLength={23} id={`valorFrete`} name={`valorFrete`} placeholder='Digite' />
				</div>
			</div>
			<h6 className='my-6 mt-6 font-medium'>Tributação</h6>
			<Card className='p-4'>
				<SelectWithLabel
					id='cfop'
					label='CFOP'
					placeholder='Selecione uma opção'
					options={[
						{
							text: '5932 - Prestação de serviço de transporte iniciada em UF diversa daquela onde inscrito o prestador',
							value: '5932',
						},
						{ text: '5935 - Prestação de serviço de transporte iniciada ', value: '5935' },
					]}
					required
				/>
			</Card>
		</div>
	);
}
