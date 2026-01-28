import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SquarePlus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { InputWithLabel } from '@/components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '@/components/general/faturamento/SelectWithLabel';
import { InputDate } from '@/components/general/faturamento/InputDate';
import { useCities, useUF } from '@/services/api/estados-cidades';
import FormComplementary from './forms/Complementary';
import FormProperty from './forms/Property';
import FormJoints from './forms/Joints';
import FormTireMap from './forms/TireMap';
import FormEvents from './forms/Events';
import FormHistoric from './forms/Historic';

const TabsForm = [
	{ text: 'Dados complementares', value: 'complementary' },
	{ text: 'Proprietário', value: 'property' },
	{ text: 'Junções', value: 'joints' },
	{ text: 'Mapa de pneus', value: 'tireMap' },
	{ text: 'Eventos', value: 'events' },
	{ text: 'Histórico', value: 'historical' },
];

export default function RegisterVehicle() {
	const [open, setOpen] = useState(false);
	const [state, setState] = useState('');
	const [activeTab, setActiveTab] = useState('complementary');

	const { data: ufs } = useUF(open);
	const { data: cities } = useCities(state);

	const cleanFilter = () => setOpen(false);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		console.log('🚀 ~ handleSubmit:', data);
	};

	return (
		<Drawer open={open} onOpenChange={() => setOpen(true)} dismissible={false}>
			<DrawerTrigger asChild>
				<Button>
					<SquarePlus />
					Cadastrar
				</Button>
			</DrawerTrigger>
			<DrawerContent className='top-0 !mt-0 !rounded-none [&>div.bg-muted]:hidden'>
				<form id='form-vehicle' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-sm'>Cadastrar</p>
									<p className='text-xl font-semibold'>Veículo</p>
								</div>
								<div className='flex gap-4'>
									<Button variant='outline' color='red' onClick={cleanFilter}>
										Cancelar
									</Button>

									<Button>Finalizar</Button>
								</div>
							</div>
							<DrawerDescription></DrawerDescription>
						</DrawerTitle>
					</DrawerHeader>
					<div className='grid max-h-[calc(100dvh-80px)] grid-cols-2 gap-4 overflow-y-auto px-8 py-10 lg:grid-cols-5'>
						{/* 	linha um */}
						<InputWithLabel id='placa' label='Placa' placeholder='Digite a placa' required />
						<InputWithLabel id='frota' label='Número da Frota' placeholder='Digite o número da frota' />
						<InputDate id='aquisicao' label='Data da aquisição' placeholder='--/--/----' />
						<InputDate id='cancelamento' label='Data do cancelamento' placeholder='--/--/----' />
						<SelectWithLabel
							id='tipo'
							label='Tipo do veículo'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Carro', value: 'carro' },
								{ text: 'Caminhão', value: 'caminhao' },
							]}
							required
						/>
						{/* 	linha dois */}
						<SelectWithLabel
							id='model'
							label='Modelo/marca'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Volvo', value: 'Volvo' },
								{ text: 'Ford', value: 'Ford' },
							]}
							required
						/>
						<InputWithLabel id='chassi' label='Chassi' placeholder='Digite o chassi' required />
						<InputWithLabel id='renavan' label='Renavan' placeholder='Digite o renavan' />
						<InputWithLabel id='ano' label='Ano de fabricação' placeholder='----' />
						<InputWithLabel id='ano' label='Ano do modelo' placeholder='----' />
						{/* linha três */}
						<InputWithLabel id='kmInitial' label='km - Aquisição' placeholder='Digite o km' />
						<InputWithLabel id='horimetroInitial' label='Horímetro - Aquisição' placeholder='Digite o tempo' />
						<InputWithLabel id='mediaInitial' label='Média esperada - Aquisição' placeholder='Digite...' />
						<InputWithLabel id='km' label='Km - Atual' placeholder='Digite...' required />
						<InputWithLabel id='time' label='Horímetro - Atual' placeholder='Digite...' required />
						<SelectWithLabel
							id='model'
							label='Modelo/marca'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Volvo', value: 'Volvo' },
								{ text: 'Ford', value: 'Ford' },
							]}
							required
						/>
						{/* linha quatro */}

						<SelectWithLabel
							id='estado'
							label='Estado'
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
							placeholder='Selecione uma cidade'
							options={
								cities?.map((city) => ({
									text: city.nome,
									value: city.nome,
								})) ?? []
							}
						/>
						<SelectWithLabel
							id='localização'
							label='localizacao'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Um', value: 'um' },
								{ text: 'Dois', value: 'dois' },
							]}
						/>
						<SelectWithLabel
							id='cidade'
							label='Cidade'
							placeholder='Selecione uma opção'
							options={[
								{ text: 'Agropecuária', value: 'agropecuaria' },
								{ text: 'Frigorífico', value: 'frigorifico' },
							]}
						/>
						<div className='col-span-5 mt-5'>
							<div className='border-input mb-4 flex border-b'>
								{TabsForm.map((tab) => (
									<button
										key={tab.value}
										className={`bg-transparent px-3 py-1 ${activeTab === tab.value ? 'border-b-foreground rounded-t-lg border border-b-3' : 'text-muted-foreground'}`}
										onClick={() => setActiveTab(tab.value)}
									>
										{tab.text}
									</button>
								))}
							</div>

							{/* Tabs content */}
							<div className='mt-8'>
								<div className={activeTab === 'complementary' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormComplementary />
								</div>
								<div className={activeTab === 'property' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormProperty />
								</div>
								<div className={activeTab === 'joints' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormJoints />
								</div>
								<div className={activeTab === 'tireMap' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormTireMap />
								</div>
								<div className={activeTab === 'events' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormEvents />
								</div>
								<div className={activeTab === 'historical' ? 'flex flex-col gap-4' : 'hidden'}>
									<FormHistoric />
								</div>
							</div>
						</div>
					</div>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
