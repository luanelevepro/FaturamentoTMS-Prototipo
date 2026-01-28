import { Card } from '@/components/ui/card';
import { IMdfe } from './tableMdfe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useCities, useUF } from '@/services/api/estados-cidades';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, SquarePlus, X } from 'lucide-react';
import { InputWithLabel } from '@/components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '@/components/general/faturamento/SelectWithLabel';

interface IPropsFrete {
	data: IMdfe[];
}

interface IStateCity {
	estado: string;
	cidade: string;
}

export default function InfoFrete({ data }: IPropsFrete) {
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	const [CIOT, setCiot] = useState('Sim');
	const { data: ufs } = useUF(!!data);
	const { data: cities } = useCities(state);
	const [percurso, setPercurso] = useState<IStateCity[]>([]);
	console.log('🚀 ~ InfoFrete -> ', percurso);

	const totalValor = data.reduce((acc, item) => acc + item.valorTotal, 0);

	const handleAddPercurso = () => {
		setPercurso((prev) => [...prev, { estado: state, cidade: city }]);
		setCity('');
		setState('');
	};

	const firstCard = [
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
		{ title: 'Responsável', value: `Demonstração Comercial Simples CTe` },
		{ title: 'Nome da seguradora', value: `Porto Seguro` },
		{
			title: 'Número de apólice',
			value: `${(1200).toLocaleString('pt-br', {
				style: 'decimal',
			})}`,
		},
		{ title: 'Número de averbações', value: `${data.length}` },
	];

	console.log('🚀 ~ InfoFrete ~ disabled:', !!!city);
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
							<TableHead className='min-w-20'>ID CTe</TableHead>
							<TableHead className='w-1/4'>Date emissão</TableHead>
							<TableHead className='w-1/4'>Rementente</TableHead>
							<TableHead className='w-1/4'>Destinatário</TableHead>
							<TableHead className='w-1/4'>{'Origem > Detino'}</TableHead>
							<TableHead className='min-w-40'>Valor </TableHead>
							<TableHead className='min-w-36'>Status</TableHead>
							<TableHead className='min-w-36'>Seguro de carga</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((mdfe) => (
							<TableRow key={mdfe.id}>
								<TableCell>{mdfe.id}</TableCell>
								<TableCell>{format(mdfe.date, 'dd/MM/yyyy')}</TableCell>
								<TableCell>{mdfe.remetente}</TableCell>
								<TableCell>{mdfe.destinatario}</TableCell>
								<TableCell>{`${mdfe.origem} > ${mdfe.destino}`}</TableCell>
								<TableCell>
									{mdfe.valorTotal.toLocaleString('pt-br', {
										style: 'currency',
										currency: 'BRL',
									})}
								</TableCell>

								<TableCell>
									<Badge variant={mdfe.status ? 'successTwo' : 'gray'} className='border-transparent px-2 py-1'>
										{mdfe.status ? 'Autorizado' : 'Bloqueado'}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={mdfe.statusSeguro ? 'successTwo' : 'gray'} className='border-transparent px-2 py-1'>
										{mdfe.statusSeguro ? 'Averbado' : 'Não Averbado'}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<h6 className='mt-6 mb-4 font-medium'>Totalizadores</h6>
			<div className='flex gap-4'>
				<div className={'grid flex-1 gap-2'}>
					<Label>Valor da carga (R$)</Label>
					<CurrencyInput maxLength={23} id={`valorCarga`} name={`valorCarga`} placeholder='Digite' />
				</div>
				<InputWithLabel className='flex-1' id='pagamento' label='Peso total da carga (bruto)' placeholder='Digite...' required />
			</div>
			<h6 className='mt-6 mb-4 font-medium'>informações do seguro de carga (averbação)</h6>
			<Card className='flex flex-row gap-4 p-4'>
				{secondCard.map((item) => {
					return (
						<div className='flex-1' key={item.title}>
							<p className='text-sm'>{item.title}</p>
							<p className='font-semibold'>{item.value}</p>
						</div>
					);
				})}
			</Card>
			<h6 className='mt-6 mb-4 font-medium'>Percurso</h6>
			<div className='flex flex-wrap items-end gap-4'>
				<SelectWithLabel
					id='estado'
					label='Estado'
					className='max-w-[323px]'
					value={state}
					onValueChange={(x) => setState(x)}
					placeholder='Selecione o estado'
					options={
						ufs?.map((uf) => ({
							text: uf.nome,
							value: uf.sigla,
						})) ?? []
					}
				/>
				<SelectWithLabel
					id='cidade'
					label='Cidade'
					className='max-w-[323px]'
					value={city}
					onValueChange={(x) => setCity(x)}
					placeholder='Selecione uma cidade'
					options={
						cities?.map((city) => ({
							text: city.nome,
							value: city.nome,
						})) ?? []
					}
				/>
				<Button variant='outline' type='button' disabled={!!!city && !!!state} onClick={handleAddPercurso}>
					<SquarePlus />
					Adicionar
				</Button>
				{percurso.map((perc, index) => {
					return (
						<Badge key={index} variant='successTwo' className='h-10 px-3'>
							{`${index + 1}.${perc.cidade}/${perc.estado}`}
							<Button
								variant='danger'
								size='close'
								type='button'
								onClick={() => setPercurso((prev) => prev.filter((_, i) => i !== index))}
							>
								<X className='size-3' />
							</Button>
						</Badge>
					);
				})}
			</div>
			<div className='mt-4 flex gap-4'>
				<SelectWithLabel
					id='veiculo'
					label='Placa do veículo'
					value={state}
					onValueChange={(x) => setState(x)}
					placeholder='Selecione o estado'
					options={[
						{ text: 'Veículo 1', value: 'veiculo-1' },
						{ text: 'Veículo 2', value: 'veiculo-2' },
					]}
				/>
				<SelectWithLabel
					id='motorista'
					label='Motorista'
					value={state}
					onValueChange={(x) => setState(x)}
					placeholder='Selecione o estado'
					options={[
						{ text: 'Motora 1', value: 'motora-1' },
						{ text: 'Motora 2', value: 'motora-2' },
					]}
				/>
				<div className={'grid gap-2 self-start'}>
					<Label htmlFor={'id'}>Informar CIOT</Label>

					<div className='flex gap-2'>
						{[{ text: 'Sim' }, { text: 'Não' }].map((btn, index: number) => (
							<Button
								key={index}
								type='button'
								variant={btn.text === CIOT ? 'default' : 'secondary'}
								onClick={() => setCiot(btn.text)}
							>
								<span className={`rounded-full ${btn.text !== CIOT && 'border-primary text-secondary border'}`}>
									<Check className={`${btn.text}`} color='currentColor' />
								</span>
								{btn.text}
							</Button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
