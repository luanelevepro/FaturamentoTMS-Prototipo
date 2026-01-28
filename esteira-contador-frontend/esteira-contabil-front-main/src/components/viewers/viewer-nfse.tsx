import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { NFSeData } from '@/types/fiscal-documentos';
import { getDocumentoFiscalXML } from '@/pages/fiscal/entradas';
import { getTiposServico } from '@/services/api/sistema';
import { getServicosEmpresas } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';

import { formatBRL } from '@/utils/format-brazilian-currency';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { TipoServicoData } from '@/pages/cadastros/tipos-servico';
import { ProdutosData } from '@/pages/fiscal/produtos';

const formatData = (data?: Date) => {
	if (!data) return '';
	const iso = data.toString();
	if (!iso) return <div className='font-medium'>-</div>;
	const datePart = iso.substring(0, 10);
	const [year, month, day] = datePart.split('-');
	return `${day}/${month}/${year}`;
};

const formatCompetencia = (data?: Date) => {
	if (!data) return '';
	const iso = data.toString().slice(0, 7); // espera que o retorno seja = "2025-06", caso não, ele não conseguirá definir corretamente
	const [year, month] = iso.split('-');
	const meses = [
		'janeiro',
		'fevereiro',
		'março',
		'abril',
		'maio',
		'junho',
		'julho',
		'agosto',
		'setembro',
		'outubro',
		'novembro',
		'dezembro',
	];
	const m = meses[Number(month) - 1];
	return m.charAt(0).toUpperCase() + m.slice(1) + '/' + year; // transforma junho e 2025 em Junho/2025, concatenando month com / e com year, além do primeiro caractere de month em maiúsculo
};

interface InfoFieldProps {
	label: string;
	value: React.ReactNode;
	className?: string;
}
const InfoField = ({ label, value, className }: InfoFieldProps) => (
	<div className={className}>
		<p className='text-muted-foreground mb-1 text-sm'>{label}</p>
		<p className='font-medium break-all'>{value}</p>
	</div>
);

const renderExigibilidadeISS = (cod?: number) => {
	switch (cod) {
		case 1:
			return '1 - Exigível';
		case 2:
			return '2 - Não incidência';
		case 3:
			return '3 - Isenção';
		case 4:
			return '4 - Exportação';
		case 5:
			return '5 - Imunidade';
		case 6:
			return '6 - Exigibilidade Suspensa';
		default:
			return '--';
	}
};

interface ViewerNFSeProps {
	documento: NFSeData;
	onDownloadXML?: (id: string) => void;
}

const ViewerNFSe: React.FC<ViewerNFSeProps> = ({ documento, onDownloadXML = getDocumentoFiscalXML }) => {
	const imprimir = () => window.print();
	const ShowTipoServico: React.FC<{ id: string }> = ({ id }) => {
		const { data, isFetching } = useQuery({
			queryKey: ['tipos-servico'],
			queryFn: getTiposServico,
			staleTime: 5 * 60_000,
			enabled: !!id,
		});

		if (isFetching) return <Skeleton className='h-4 w-full max-w-80' />;
		const tipo = data?.find((t: TipoServicoData) => t.id === id);
		return <p className='text-muted-foreground'>{tipo ? `${tipo.ds_codigo} - ${tipo.ds_descricao}` : '--'}</p>;
	};

	const ShowServico: React.FC<{ id: string }> = ({ id }) => {
		const { state } = useCompanyContext();
		const { data, isFetching } = useQuery({
			queryKey: ['servicos-empresa', state],
			queryFn: getServicosEmpresas,
			staleTime: 5 * 60_000,
			enabled: !!id,
		});

		if (isFetching) return <Skeleton className='h-4 w-40' />;
		const serv = data?.find((s: ProdutosData) => s.id === id);
		return <p className='font-medium'>{serv?.ds_nome ?? ''}</p>;
	};
	return (
		<div className='mx-auto grid w-full max-w-5xl gap-4'>
			<div className='flex gap-2'>
				<Button variant='outline' size='sm' onClick={imprimir}>
					<Printer className='mr-2 h-4 w-4' />
					Imprimir
				</Button>
				<Button variant='outline' size='sm' onClick={() => documento.id && onDownloadXML(documento.id)} disabled={!documento.id}>
					<Download className='mr-2 h-4 w-4' />
					Baixar XML
				</Button>
			</div>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Informações do Documento</CardTitle>
					<CardDescription>Dados gerais do documento fiscal</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
						<InfoField label='Número da Nota' value={documento.ds_numero} />
						<InfoField label='Data de Emissão' value={formatData(documento.dt_emissao)} />
						<InfoField label='Competência' value={formatCompetencia(documento.dt_competencia)} />
						<InfoField label='Código de Verificação' value={documento.ds_codigo_verificacao ?? '--'} />
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Dados do Prestador</CardTitle>
					<CardDescription>Informações do prestador de serviço</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6'>
						<div className='grid gap-6 md:grid-cols-5'>
							<InfoField className='md:col-span-2' label='Razão Social' value={documento.fis_fornecedor?.ds_nome ?? '--'} />
							<InfoField label='CNPJ' value={formatCnpjCpf(documento.fis_fornecedor?.ds_documento ?? '')} />
							<InfoField label='Inscrição Municipal' value={documento.fis_fornecedor?.ds_inscricao_municipal ?? '--'} />
							<InfoField label='Simples Nacional' value={documento.is_optante_simples_nacional ? 'Sim' : 'Não'} />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Serviço(s) prestado(s)</CardTitle>
					<CardDescription>Detalhes do(s) serviço(s) prestado(s)</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6'>
						{documento.js_servicos?.length ? (
							<div className='space-y-4'>
								{documento.js_servicos.map((s, idx) => (
									<Card key={idx} className='shadow-none'>
										<CardHeader>
											<ShowServico id={s.id_servico} />
											<ShowTipoServico id={s.id_tipo_servico} />
										</CardHeader>
										<CardContent>
											<div className='grid gap-2'>
												<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
													<InfoField label='Valor Total' value={formatBRL(+s.ds_valor_total / 100)} />
													<InfoField label='Valor Unitário' value={formatBRL(+s.ds_valor_unitario / 100)} />
													<InfoField label='Quantidade' value={s.ds_quantidade} />
													<InfoField label='ISS Retido' value={s.is_iss_retido ? 'Sim' : 'Não'} />
													<InfoField label='Exigibilidade do ISS' value={renderExigibilidadeISS(+s.ds_exigibilidade_iss)} />
													<InfoField label='Município de Incidência' value={s.ds_municipio_incidencia ?? '--'} />
													<InfoField label='Alíquota' value={s.ds_aliquota ?? '0%'} />
												</div>

												<Separator className='my-4' />

												<div>
													<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
														<InfoField label='Valor do ISS' value={formatBRL(+s.ds_valor_iss / 100)} />
														<InfoField label='Valor do IR' value={formatBRL(+s.ds_valor_ir / 100)} />
														<InfoField label='Valor do INSS' value={formatBRL(+s.ds_valor_inss / 100)} />
														<InfoField label='Valor do PIS' value={formatBRL(+s.ds_valor_pis / 100)} />
														<InfoField label='Valor do COFINS' value={formatBRL(+s.ds_valor_cofins / 100)} />
														<InfoField label='Valor do CSLL' value={formatBRL(+s.ds_valor_csll / 100)} />
														<InfoField label='Outras Retenções' value={formatBRL(+s.ds_outras_retencoes / 100)} />
													</div>
												</div>
											</div>
											<Separator className='my-4' />

											<InfoField label='Descrição do serviço' value={s.ds_discriminacao ?? '--'} className='md:col-span-4' />
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<p className='text-muted-foreground text-sm'>Nenhum serviço informado.</p>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-xs'>
				<CardHeader>
					<CardTitle>Valores</CardTitle>
					<CardDescription>Valores e retenções da documento fiscal</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-5'>
						<div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
							<InfoField label='Valor dos Serviços' value={formatBRL(+documento.ds_valor_servicos / 100)} />
							<InfoField label='Valor das Retenções' value={formatBRL(+documento.ds_valor_retencoes / 100)} />
							<InfoField label='Descontos' value={formatBRL(+documento.ds_valor_descontos / 100)} />
							<InfoField label='Valor Líquido' value={formatBRL(+documento.ds_valor_liquido_nfse / 100)} />
						</div>

						<Separator />

						<div>
							<p className='mb-4 text-sm font-medium'>Retenções Federais</p>
							<div className='grid grid-cols-2 gap-6 md:grid-cols-6'>
								<InfoField label='PIS' value={formatBRL(+documento.ds_valor_pis / 100)} />
								<InfoField label='COFINS' value={formatBRL(+documento.ds_valor_cofins / 100)} />
								<InfoField label='INSS' value={formatBRL(+documento.ds_valor_inss / 100)} />
								<InfoField label='IR' value={formatBRL(+documento.ds_valor_ir / 100)} />
								<InfoField label='CSLL' value={formatBRL(+documento.ds_valor_csll / 100)} />
								<InfoField label='Outras' value={formatBRL(+documento.ds_outras_retencoes / 100)} />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ViewerNFSe;
