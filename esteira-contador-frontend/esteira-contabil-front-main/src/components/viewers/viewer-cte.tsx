import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { formatBRL } from '@/utils/format-brazilian-currency';
import { getDocumentoFiscalXML } from '@/pages/fiscal/entradas';
import { CTeData } from '@/types/fiscal-documentos';

const fmtDate = (d?: Date | string) => (d ? new Intl.DateTimeFormat('pt-BR').format(new Date(d)) : '--');

interface InfoProps {
	label: string;
	value: React.ReactNode;
	className?: string;
}
const Info = ({ label, value, className }: InfoProps) => (
	<div className={className}>
		<p className='text-muted-foreground mb-1 text-sm'>{label}</p>
		<p className='font-medium break-all'>{value}</p>
	</div>
);

interface ViewerProps {
	documento: CTeData;
	onDownloadXML?: (id: string) => void;
}

const ViewerCTe: React.FC<ViewerProps> = ({ documento, onDownloadXML = getDocumentoFiscalXML }) => {
	const imprimir = () => window.print();
	const formatarValor = (valor: string): string => {
		const numero = parseFloat(valor) / 100;
		return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numero);
	};
	return (
		<div className='mx-auto grid w-full max-w-6xl gap-4'>
			<div className='flex gap-2 print:hidden'>
				<Button size='sm' variant='outline' onClick={imprimir}>
					<Printer className='mr-2 h-4 w-4' /> Imprimir
				</Button>
				<Button size='sm' variant='outline' onClick={() => onDownloadXML(documento.id)}>
					<Download className='mr-2 h-4 w-4' /> Baixar XML
				</Button>
			</div>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Informações do CTe</CardTitle>
					<CardDescription>Dados gerais do conhecimento de transporte</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-3'>
						<Info
							label='Número / Série'
							value={documento.ds_numero ? `${documento.ds_numero} / ${documento.ds_serie ?? '--'}` : '--'}
						/>
						<Info label='Modelo' value={documento.ds_modelo ?? '57'} />
						<Info label='Data de Emissão' value={fmtDate(documento.dt_emissao ?? undefined)} />
						<Info label='Chave' value={documento.ds_chave} className='md:col-span-2' />
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Partes</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-3'>
						<div>
							<p className='mb-2 text-sm font-medium'>Emitente</p>
							<Info label='Razão Social' value={documento.ds_razao_social_emitente ?? '--'} />
							<Info label='CNPJ/CPF' value={formatCnpjCpf(documento.ds_documento_emitente ?? '')} />
						</div>
						<div>
							<p className='mb-2 text-sm font-medium'>Remetente</p>
							<Info label='Razão Social' value={documento.ds_razao_social_remetente ?? '--'} />
							<Info label='CNPJ/CPF' value={formatCnpjCpf(documento.ds_documento_remetente ?? '')} />
						</div>
						<div>
							<p className='mb-2 text-sm font-medium'>Destinatário</p>
							<Info label='Razão Social' value={documento.ds_razao_social_destinatario ?? '--'} />
							<Info label='CNPJ/CPF' value={formatCnpjCpf(documento.ds_documento_destinatario ?? '')} />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Trajeto</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-2'>
						<Info label='Município/UF de Início' value={`${documento.ds_nome_mun_ini ?? '--'} / ${documento.ds_uf_ini ?? '--'}`} />
						<Info label='Município/UF de Fim' value={`${documento.ds_nome_mun_fim ?? '--'} / ${documento.ds_uf_fim ?? '--'}`} />
					</div>
				</CardContent>
			</Card>

			{documento.fis_cte_comp_carga?.length > 0 && (
				<Card className='shadow-none'>
					<CardHeader>
						<CardTitle>Componentes de Valores</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{documento.fis_cte_comp_carga.map((c, i) => (
							<div key={i} className='grid gap-4 md:grid-cols-2'>
								<Info label='Nome' value={c.ds_nome} />
								<Info label='Valor do Componente' value={formatBRL(+c.vl_comp / 100)} />
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{documento.fis_cte_carga?.length > 0 && (
				<Card className='shadow-none'>
					<CardHeader>
						<CardTitle>Itens de Carga</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{documento.fis_cte_carga.map((c, i) => (
							<div key={i} className='grid gap-4 md:grid-cols-3'>
								<Info label='Unidade' value={c.ds_und} />
								<Info label='Tipo de Medida' value={c.ds_tipo_medida} />
								<Info label='Quantidade' value={formatarValor(c.vl_qtd_carregada.toString())} />
							</div>
						))}
					</CardContent>
				</Card>
			)}

			<Card className='shadow-xs'>
				<CardHeader>
					<CardTitle>Totais do CTe</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-4'>
						<Info label='Valor Total' value={formatBRL(+documento.vl_total! / 100)} />
						<Info label='Valor a Receber' value={formatBRL(+documento.vl_rec! / 100)} />
						<Info label='Total de Tributos' value={formatBRL(+(documento.vl_total_trib ?? 0) / 100)} />
						<Info label='Base ICMS' value={formatBRL(+documento.vl_base_calculo_icms! / 100)} />
						<Info label='ICMS' value={formatBRL(+(documento.vl_icms ?? 0) / 100)} />
						<Info label='% ICMS' value={documento.vl_porcentagem_icms ?? '--'} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ViewerCTe;
