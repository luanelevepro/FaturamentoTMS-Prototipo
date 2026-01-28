import { InputWithLabel } from '../../../../../components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '../../../../../components/general/faturamento/SelectWithLabel';

const tyres = [
	{ master: 'ESQUERDO EXTERNO', valueInput: 'leftOutside' },
	{ master: 'ESQUERDO INTERNO', valueInput: 'leftInside' },
	{ master: 'DIREITO INTERNO', valueInput: 'rightInside' },
	{ master: 'DIREITO EXTERNO', valueInput: 'rightOutside' },
];

const FormTireMap: React.FC = () => {
	return (
		<>
			<SelectWithLabel
				id='veiculo'
				label='Veículo'
				placeholder='Selecione uma opção'
				options={[
					{ text: 'ABC 1', value: 'ABC 1' },
					{ text: 'ABC 2', value: 'ABC 2' },
				]}
				required
			/>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{tyres.map((tyre) => {
					return (
						<div className='flex flex-col gap-4' key={tyre.valueInput}>
							<h5 className='font-medium'>Pneus {tyre.master}</h5>
							<h6 className='text-sm'>Mapa do cavalo</h6>
							<InputWithLabel id={`${tyre.valueInput}-pneu-1`} label='Pneu 1' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-2`} label='Pneu 2' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-3`} label='Pneu 3' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-4`} label='Pneu 4' placeholder='Digite...' />
							<h6 className='text-sm'> Mapa da carreta</h6>
							<InputWithLabel id={`${tyre.valueInput}-pneu-5`} label='Pneu 5' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-6`} label='Pneu 6' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-7`} label='Pneu 7' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-8`} label='Pneu 8' placeholder='Digite...' />
							<h6 className='text-sm'>Reservas</h6>
							<InputWithLabel id={`${tyre.valueInput}-pneu-9`} label='Pneu 9' placeholder='Digite...' />
							<InputWithLabel id={`${tyre.valueInput}-pneu-10`} label='Pneu 10' placeholder='Digite...' />
						</div>
					);
				})}
			</div>
		</>
	);
};

export default FormTireMap;
