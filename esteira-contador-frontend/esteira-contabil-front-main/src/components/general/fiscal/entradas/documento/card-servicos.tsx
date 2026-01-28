import { ServicoSelector } from '@/components/general/seletores/servico-selector';
import { NFSeData } from './nfse-form';
import { TipoServicoSelector } from '@/components/general/seletores/tipo-servico-selector';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ModalEditarServico } from './modal-editar-servico';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ItemPadraoSelector } from '@/components/general/seletores/item-padrao-selector';

export interface ServicoData {
	id: string;
	id_servico: string; // id da tabela de servico
	id_item_padrao: string; // id do item padrão da tabela de item padrão
	id_tipo_servico: string; // id do tipo de serviço da tabela de tipo de serviço

	ds_valor_unitario: string;
	ds_quantidade: string;
	ds_valor_total: string;
	ds_discriminacao: string; // descrição do serviço

	ds_base_calculo: string;
	ds_aliquota: string;
	ds_valor_iss: string;
	ds_valor_deducoes: string;
	ds_valor_descontos: string;

	is_iss_retido: boolean;
	ds_exigibilidade_iss: string;
	ds_municipio_incidencia: string; // enviar codigo de IBGE

	ds_valor_pis: string;
	ds_valor_cofins: string;
	ds_valor_inss: string;
	ds_valor_ir: string;
	ds_valor_csll: string;
	ds_outras_retencoes: string;

	use_item_padrao: boolean; // se o serviço é um item padrão ou não
}

interface ServicosProps extends ServicoData {
	setForm: React.Dispatch<React.SetStateAction<NFSeData>>;
	isSN: boolean;
}

export function CardServicosDocumentos({ setForm, isSN, ...servico }: ServicosProps) {
	const removerServico = (id: string) => {
		setForm((prev) => ({ ...prev, js_servicos: prev.js_servicos.filter((servico: ServicoData) => servico.id !== id) }));
	};

	const atualizarServico = (id: string, campo: string, valor: string) => {
		if (campo === 'ds_valor_total') {
			const valorUnitario = parseFloat(valor || '0') / parseFloat(servico.ds_quantidade || '1');
			setForm((prev) => ({
				...prev,
				js_servicos: prev.js_servicos.map((servico: ServicoData) =>
					servico.id === id ? { ...servico, ds_valor_unitario: valorUnitario.toString() } : servico,
				),
			}));
		}

		setForm((prev) => ({
			...prev,
			js_servicos: prev.js_servicos.map((servico: ServicoData) => (servico.id === id ? { ...servico, [campo]: valor } : servico)),
		}));
	};

	const salvarServicoEditado = (servicoAtualizado: ServicoData) => {
		setForm((prev) => ({
			...prev,
			js_servicos: prev.js_servicos.map((servico: ServicoData) => (servico.id === servicoAtualizado.id ? servicoAtualizado : servico)),
		}));
	};

	return (
		<>
			<div className='grid grid-cols-2 items-center gap-3 md:grid-cols-[2fr_2fr_1fr_auto_auto]'>
				{servico.use_item_padrao ? (
					<ItemPadraoSelector
						onChange={(value, idTipoServico) => {
							atualizarServico(servico.id, 'id_item_padrao', value);
							atualizarServico(servico.id, 'id_tipo_servico', idTipoServico);
						}}
						defaultValue={servico.id_item_padrao}
					/>
				) : (
					<ServicoSelector onChange={(value) => atualizarServico(servico.id, 'id_servico', value)} defaultValue={servico.id_servico} />
				)}
				<TipoServicoSelector
					disabled={servico.use_item_padrao}
					onChange={(value) => atualizarServico(servico.id, 'id_tipo_servico', value)}
					defaultValue={servico.id_tipo_servico}
				/>
				<CurrencyInput
					maxLength={23}
					id={`servico-ds_valor_total-${servico.id}`}
					value={servico.ds_valor_total}
					onChange={(value) => atualizarServico(servico.id, 'ds_valor_total', value)}
				/>
				<ModalEditarServico servico={servico} isSN={isSN} onSalvar={salvarServicoEditado} />

				<Button variant='outline' onClick={() => removerServico(servico.id)} size='icon' className='shrink-0'>
					<Trash2 className='h-4 w-4' />
				</Button>
			</div>
		</>
	);
}
