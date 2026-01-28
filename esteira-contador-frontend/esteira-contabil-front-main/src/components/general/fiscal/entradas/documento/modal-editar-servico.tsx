import { useEffect, useState } from 'react';
import { Calculator, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CidadesSelector } from '@/components/general/seletores/cidades-selector';
import { ServicoSelector } from '@/components/general/seletores/servico-selector';
import { TipoServicoSelector } from '@/components/general/seletores/tipo-servico-selector';
import { ServicoData } from './card-servicos';
import { ItemPadraoSelector } from '@/components/general/seletores/item-padrao-selector';

interface ModalEditarServicoProps {
	servico: ServicoData;
	onSalvar: (servico: ServicoData) => void;
	isSN?: boolean;
}

export function ModalEditarServico({ servico, onSalvar, isSN }: ModalEditarServicoProps) {
	const [open, setOpen] = useState(false);
	const [servicoEditado, setServicoEditado] = useState<ServicoData>({ ...servico });

	const handleChange = (campo: string, valor: string | boolean) => {
		setServicoEditado((prev) => {
			const novoServico = { ...prev, [campo]: valor };

			// Garantir que o valor total esteja correto com base no valor unitário e quantidade
			const valorUnitario = parseFloat(novoServico.ds_valor_unitario) || 0;
			const quantidade = parseFloat(novoServico.ds_quantidade) || 0;
			const valorTotal = parseFloat(novoServico.ds_valor_total) || 0;

			if (campo === 'ds_valor_unitario' || campo === 'ds_quantidade') {
				novoServico.ds_valor_total = (valorUnitario * quantidade).toString();
			} else if (campo === 'ds_valor_total') {
				// Se o usuário modificar o valor total diretamente, recalculamos o valor unitário
				novoServico.ds_valor_unitario = quantidade > 0 ? (valorTotal / quantidade).toString() : '0';
			}

			if (isSN) {
				novoServico.ds_valor_pis = '';
				novoServico.ds_valor_cofins = '';
				novoServico.ds_valor_inss = '';
				novoServico.ds_valor_ir = '';
				novoServico.ds_valor_csll = '';
				novoServico.ds_outras_retencoes = '';
			}

			return novoServico;
		});
	};

	const handleSalvar = () => {
		onSalvar(servicoEditado);
		setOpen(false);
	};

	useEffect(() => {
		setServicoEditado({ ...servico });
	}, [servico]);

	function handleOpen() {
		setOpen(!open);
		setServicoEditado({ ...servico });
	}

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' size='icon' className='shrink-0'>
					<Edit className='h-4 w-4' />
				</Button>
			</DialogTrigger>
			<DialogContent className='max-h-screen overflow-auto sm:max-w-[700px]'>
				<DialogHeader>
					<DialogTitle>Editando serviço</DialogTitle>
					<DialogDescription>Altere os dados do serviço e clique em salvar.</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
						<div className='grid gap-2'>
							<Label htmlFor='servico'>{servicoEditado.use_item_padrao ? 'Item padrão' : 'Serviço'}</Label>
							{!servicoEditado.use_item_padrao ? (
								<ServicoSelector
									onChange={(value) => {
										handleChange('id_servico', value);
									}}
									defaultValue={servicoEditado.id_servico}
								/>
							) : (
								<ItemPadraoSelector
									onChange={(value, tipo_servico) => {
										handleChange('id_item_padrao', value);
										handleChange('id_tipo_servico', tipo_servico);
									}}
									defaultValue={servicoEditado.id_item_padrao}
								/>
							)}
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='servico'>Tipo de serviço</Label>
							<TipoServicoSelector
								disabled={servicoEditado.use_item_padrao}
								onChange={(value) => {
									handleChange('id_tipo_servico', value);
								}}
								defaultValue={servicoEditado.id_tipo_servico}
							/>
						</div>
						<div className='flex items-center space-x-2'>
							<Checkbox
								id='use_item_padrao'
								checked={servicoEditado.use_item_padrao}
								onCheckedChange={(checked) => {
									handleChange('use_item_padrao', checked);
									handleChange('id_servico', '');
									handleChange('id_item_padrao', '');
									handleChange('id_tipo_servico', '');
								}}
							/>
							<Label htmlFor='use_item_padrao'>Utilizar item padrão</Label>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
						<div className='space-y-2'>
							<Label htmlFor='ds_valor_unitario'>Valor Unitário</Label>
							<CurrencyInput
								id='ds_valor_unitario'
								value={servicoEditado.ds_valor_unitario}
								onChange={(value) => handleChange('ds_valor_unitario', value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_quantidade'>Quantidade</Label>
							<Input
								id='ds_quantidade'
								value={servicoEditado.ds_quantidade}
								placeholder='0'
								onChange={(e) => handleChange('ds_quantidade', e.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_valor_total'>Valor Total</Label>
							<CurrencyInput
								id='ds_valor_total'
								value={servicoEditado.ds_valor_total}
								onChange={(value) => handleChange('ds_valor_total', value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_base_calculo'>Base Cálculo</Label>
							<CurrencyInput
								id='ds_base_calculo'
								value={servicoEditado.ds_base_calculo}
								onChange={(value) => handleChange('ds_base_calculo', value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_aliquota'>Alíquota</Label>
							<Input
								id='ds_aliquota'
								placeholder='0'
								value={servicoEditado.ds_aliquota}
								onChange={(e) => {
									// Permite apenas números, vírgula e ponto
									const valor = e.target.value.replace(/[^\d.,]/g, '');
									handleChange('ds_aliquota', valor);
								}}
							/>
						</div>
						<div className='flex items-end gap-2'>
							<div className='flex-1 space-y-2'>
								<Label htmlFor='ds_valor_iss'>ISS</Label>
								<CurrencyInput
									id='ds_valor_iss'
									value={servicoEditado.ds_valor_iss}
									onChange={(value) => handleChange('ds_valor_iss', value)}
								/>
							</div>
							<Button
								variant='outline'
								size={'icon'}
								className='aspect-square'
								disabled={!servicoEditado.ds_aliquota || !servicoEditado.ds_valor_unitario || !servicoEditado.ds_quantidade}
								tooltip='Calcular Base de Cálculo e ISS'
								onClick={() => {
									const valorTotal = parseFloat(servicoEditado.ds_valor_total) || 0;
									const aliquota = parseFloat(servicoEditado.ds_aliquota) || 0;
									const deducoes = parseFloat(servicoEditado.ds_valor_deducoes) || 0;
									const descontos = parseFloat(servicoEditado.ds_valor_descontos) || 0;
									const baseCalculo = valorTotal - deducoes - descontos;
									const iss = ((baseCalculo * aliquota) / 100).toFixed(0);

									handleChange('ds_base_calculo', baseCalculo.toString());
									handleChange('ds_valor_iss', iss.toString());
								}}
							>
								<Calculator className='h-4 w-4' />
							</Button>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='ds_valor_deducoes'>Deduções</Label>
							<CurrencyInput
								id='ds_valor_deducoes'
								value={servicoEditado.ds_valor_deducoes}
								onChange={(value) => handleChange('ds_valor_deducoes', value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_valor_descontos'>Descontos</Label>
							<CurrencyInput
								id='ds_valor_descontos'
								value={servicoEditado.ds_valor_descontos}
								onChange={(value) => handleChange('ds_valor_descontos', value)}
							/>
						</div>
					</div>

					<div className='flex items-center space-x-2'>
						<Checkbox
							id='is_iss_retido'
							checked={servicoEditado.is_iss_retido}
							onCheckedChange={(checked) => {
								handleChange('is_iss_retido', !!checked);
							}}
						/>
						<Label htmlFor='is_iss_retido'>ISS Retido</Label>
					</div>

					<div className='items-top grid grid-cols-1 gap-3 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='ds_exigibilidade_iss'>Exigibilidade ISS</Label>
							<Select
								value={servicoEditado.ds_exigibilidade_iss}
								onValueChange={(value) => handleChange('ds_exigibilidade_iss', value)}
							>
								<SelectTrigger className='w-full' id='ds_exigibilidade_iss'>
									<SelectValue placeholder='Selecione' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='1'>1 - Exigível</SelectItem>
									<SelectItem value='2'>2 - Não incidência</SelectItem>
									<SelectItem value='3'>3 - Isenção</SelectItem>
									<SelectItem value='4'>4 - Exportação</SelectItem>
									<SelectItem value='5'>5 - Imunidade</SelectItem>
									<SelectItem value='6'>6 - Exigibilidade Suspensa</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='ds_municipio_incidencia'>Município Incidência</Label>
							<CidadesSelector
								defaultValue={servicoEditado.ds_municipio_incidencia}
								onCityChange={(e: string) => handleChange('ds_municipio_incidencia', e)}
							/>
						</div>
					</div>
					{!isSN && (
						<div className='space-y-2'>
							<Label className='text-sm font-medium'>Retenções Federais:</Label>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
								<div className='space-y-2'>
									<Label htmlFor='ds_valor_pis'>PIS</Label>
									<CurrencyInput
										id='ds_valor_pis'
										value={servicoEditado.ds_valor_pis}
										onChange={(value) => handleChange('ds_valor_pis', value)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ds_valor_cofins'>Cofins</Label>
									<CurrencyInput
										id='ds_valor_cofins'
										value={servicoEditado.ds_valor_cofins}
										onChange={(value) => handleChange('ds_valor_cofins', value)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ds_valor_inss'>INSS</Label>
									<CurrencyInput
										id='ds_valor_inss'
										value={servicoEditado.ds_valor_inss}
										onChange={(value) => handleChange('ds_valor_inss', value)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ds_valor_ir'>IR</Label>
									<CurrencyInput
										id='ds_valor_ir'
										value={servicoEditado.ds_valor_ir}
										onChange={(value) => handleChange('ds_valor_ir', value)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ds_valor_csll'>CSLL</Label>
									<CurrencyInput
										id='ds_valor_csll'
										value={servicoEditado.ds_valor_csll}
										onChange={(value) => handleChange('ds_valor_csll', value)}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ds_outras_retencoes'>Outros</Label>
									<CurrencyInput
										id='ds_outras_retencoes'
										value={servicoEditado.ds_outras_retencoes}
										onChange={(value) => handleChange('ds_outras_retencoes', value)}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
				<DialogFooter className='max-sm:gap-3'>
					<Button variant='outline' onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleSalvar}>Salvar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
