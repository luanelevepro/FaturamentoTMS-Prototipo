import { InputWithLabel } from '../../../../../components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '../../../../../components/general/faturamento/SelectWithLabel';

const FormComplementary: React.FC = () => {
	return (
		<>
			<div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
				<SelectWithLabel
					id='empresa'
					label='Empresa'
					placeholder='Selecione uma opção'
					options={[
						{ text: 'Empresa 1', value: 'Empresa 1' },
						{ text: 'Empresa 2', value: 'Empresa 2' },
					]}
					required
				/>

				<InputWithLabel id='rastreamaento' label='Rastreamaento' placeholder='Digite...' />
				<SelectWithLabel
					id='combustivel'
					label='Combustível'
					placeholder='Selecione uma opção'
					options={[
						{ text: 'Gasolina', value: 'Gasolina' },
						{ text: 'Diesel', value: 'Diesel' },
					]}
					required
				/>
				<InputWithLabel id='capacidade-combustivel' label='Capacidade - Combustível' placeholder='Digite...' />
				<InputWithLabel id='capacidade-pallet' label='Capacidade - Pallets' placeholder='Digite...' />
			</div>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
				<InputWithLabel id='tara' label='Tara' placeholder='Digite...' />
				<InputWithLabel id='peso' label='Peso' placeholder='Digite...' />
				<InputWithLabel id='capacidadeKg' label='Capacidade - Kg' placeholder='Digite...' />
				<InputWithLabel id='capacidadeM3' label='Capacidade - M' sup='3' placeholder='Digite...' />
				<InputWithLabel id='eixos' label='Eixos' placeholder='Digite...' />

				<SelectWithLabel
					id='cor'
					label='Cor'
					placeholder='Selecione uma opção'
					options={[
						{ text: 'Preto', value: 'Preto' },
						{ text: 'Branco', value: 'Brancol' },
					]}
					required
				/>
			</div>
		</>
	);
};
export default FormComplementary;
