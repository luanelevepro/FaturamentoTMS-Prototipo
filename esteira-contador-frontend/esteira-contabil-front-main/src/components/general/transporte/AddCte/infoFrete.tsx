import { Card } from '@/components/ui/card';
import { InputWithLabel } from '../../faturamento/InputWithLabel';
import { SelectWithLabel } from '../../faturamento/SelectWithLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { IDFe } from '@/interfaces/faturamento/transporte/dfe';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getCFOPCte } from '@/services/api/transporte';
import { CfopCte } from '@/interfaces';

interface IPropsFrete {
	data: IDFe[];
}

const tpserv = [
	{ value: '0', text: 'Normal' },
	{ value: '1', text: 'Subcontratação' },
	{ value: '2', text: 'Redespacho' },
];

export default function InfoFrete({ data }: IPropsFrete) {
	const [open, setOpen] = useState(false);

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const totalValor = data.reduce((acc, item) => acc + (item?.valorTotal ?? 0), 0);
	const { data: dataCfop } = useQuery<CfopCte[]>({
		queryKey: ['get-cfop'],
		queryFn: getCFOPCte,
		staleTime: 1000 * 60 * 60,
	});

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
		{ title: 'Remetente', value: data?.[0]?.nomeDestinatario },
		{
			title: 'Destinatário',
			value: data?.[0]?.nomeEmitente,
		},
		{ title: 'Origem', value: `${data?.[0]?.xMunIni}/${data?.[0]?.UFIni}` },
		{ title: 'Destino', value: `${data?.[0]?.xMunFim}/${data?.[0]?.UFFim}` },
	];

	const handleDateChange = (date: Date | undefined) => {
		setSelectedDate(date);
		setOpen(false);
	};

	const handleClearDate = () => {
		setSelectedDate(undefined);
		setOpen(false);
	};

	return (
		<div>
			<Card className='flex flex-row gap-4 p-4 shadow-none'>
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
							<TableHead className='min-w-40'>NFe</TableHead>
							<TableHead className='w-1/2'>Remetente</TableHead>
							<TableHead className='w-1/2'>Destinatário</TableHead>
							<TableHead className='min-w-35'>Valor Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((cte) => (
							<TableRow key={cte.id}>
								<TableCell>{cte?.ds_documento_emitente}</TableCell>
								<TableCell>{cte?.nomeEmitente}</TableCell>
								<TableCell>{cte?.nomeDestinatario}</TableCell>
								<TableCell>
									{!!cte.valorTotal ? cte.valorTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) : '--'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<h6 className='my-6 mt-6 font-medium'>Detalhes do frete</h6>
			<Card className='my-4 flex flex-row gap-4 p-4 shadow-none'>
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
				<div className='grid flex-1 gap-2'>
					<Label>Previsão de entrega</Label>
					<input type='hidden' name='dPrev' value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} />
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild className='justify-normal'>
							<Button className='w-full font-medium' variant='outline' type='button'>
								<CalendarIcon />
								{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span className='text-muted-foreground'>--/----</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0'>
							<Calendar
								mode='single'
								disabled={{ before: new Date() }}
								autoFocus
								locale={ptBR}
								selected={selectedDate}
								onSelect={handleDateChange}
								footer={
									<Button variant='ghost' size='sm' className='w-full' onClick={handleClearDate} type='button'>
										Limpar
									</Button>
								}
							/>
						</PopoverContent>
					</Popover>
				</div>
				<InputWithLabel
					type='text'
					inputMode='numeric'
					className='flex-1'
					id='pesoTotal'
					name='pesoTotal'
					label='Peso total da carga (bruto)'
					placeholder='Digite...'
					maxLength={15}
					onChange={(e) => {
						e.target.value = e.target.value.replace(/\D/g, '');
					}}
				/>
				<InputWithLabel className='flex-1' id='pagamento' label='Quem vai pagar pelo frete' placeholder='Digite...' />
				<InputWithLabel
					type='text'
					inputMode='numeric'
					className='flex-1'
					id='valorFrete'
					name='valorFrete'
					label='Valor do frete'
					placeholder='Digite...'
					maxLength={15}
					onChange={(e) => {
						const onlyNumbers = e.target.value.replace(/\D/g, '');
						
						const number = Number(onlyNumbers) / 100;
						e.target.value = number.toLocaleString('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						});
					}}
				/>
			</div>
			<h6 className='my-6 mt-6 font-medium'>Tributação</h6>
			<Card className='grid grid-cols-2 gap-4 p-4 shadow-none'>
				<SelectWithLabel
					id='cfop'
					label='CFOP'
					placeholder='Selecione uma opção - Prestação de serviço de transporte iniciada em UF diversa daquela onde inscrito o prestador'
					options={
						dataCfop?.map((item) => ({ key: item.id, text: `${item.ds_codigo} - ${item.ds_descricao}`, value: item.ds_codigo })) || []
					}
					required
				/>

				<SelectWithLabel
					id='tpserv'
					label='Tipo de serviço'
					placeholder='Selecione uma opção'
					options={tpserv.map((item) => ({ key: item.value, text: item.text, value: item.value }))}
					required
				/>
			</Card>
		</div>
	);
}
