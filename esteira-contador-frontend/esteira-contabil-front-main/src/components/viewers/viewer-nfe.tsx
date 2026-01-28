import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { formatBRL } from '@/utils/format-brazilian-currency';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { getDocumentoFiscalXML } from '@/pages/fiscal/entradas';
import { NFeData, NFeItem } from '@/types/fiscal-documentos';

const fmtData = (d?: Date | string) => (d ? new Intl.DateTimeFormat('pt-BR').format(new Date(d)) : '--');

const formatarValor = (valor: string): string => {
	const numero = parseFloat(valor) / 100;
	return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numero);
};
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

function NFeItemCard({ item }: { item: NFeItem }) {
	return (
		<Card className='shadow-none'>
			<CardHeader>
				<p className='text-sm font-medium'>{item.ds_produto}</p>
				<p className='text-muted-foreground text-xs'>
					NCM: {item.cd_ncm ?? '--'} | CFOP: {item.cd_cfop ?? '--'}
				</p>
			</CardHeader>

			<CardContent className='grid gap-3'>
				<div className='grid gap-4 md:grid-cols-4'>
					<Info label='Quantidade' value={formatarValor(item.vl_quantidade ?? '0') ?? '--'} />
					<Info label='Valor Unitário' value={item.vl_unitario ? formatBRL(+item.vl_unitario / 100) : '--'} />
					<Info label='Valor Total' value={item.vl_total ? formatBRL(+item.vl_total / 100) : '--'} />
					<Info label='CST ICMS' value={item.ds_cst ?? '--'} />
				</div>
			</CardContent>
		</Card>
	);
}

interface Props {
	documento: NFeData;
	onDownloadXML?: (id: string) => void;
}

const ViewerNFe: React.FC<Props> = ({ documento, onDownloadXML = getDocumentoFiscalXML }) => {
	const imprimir = () => window.print();

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
					<CardTitle>Informações da NFe</CardTitle>
					<CardDescription>Dados gerais do documento</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-3'>
						<Info label='Número / Série' value={`${documento.ds_numero} / ${documento.ds_serie ?? '--'}`} />
						<Info label='Data de Emissão' value={fmtData(documento.dt_emissao ?? undefined)} />
						<Info label='Modelo' value={documento.ds_modelo ?? '55'} />
						<Info label='Chave' value={documento.ds_chave} className='md:col-span-2' />
					</div>
				</CardContent>
			</Card>
			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Partes</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-2'>
						<div>
							<p className='mb-2 text-sm font-medium'>Emitente</p>
							<Info label='Razão Social' value={documento.ds_razao_social_emitente ?? '--'} />
							<Info label='CNPJ' value={formatCnpjCpf(documento.ds_documento_emitente ?? '')} />
						</div>
						<div>
							<p className='mb-2 text-sm font-medium'>Destinatário</p>
							<Info label='Razão Social' value={documento.ds_razao_social_destinatario ?? '--'} />
							<Info label='CNPJ' value={formatCnpjCpf(documento.ds_documento_destinatario ?? '')} />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className='shadow-none'>
				<CardHeader>
					<CardTitle>Produtos / Serviços</CardTitle>
					<CardDescription>{documento.fis_nfe_itens.length} itens</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{documento.fis_nfe_itens.length ? (
						documento.fis_nfe_itens.map((it, i) => <NFeItemCard key={i} item={it} />)
					) : (
						<p className='text-muted-foreground text-sm'>Nenhum item informado.</p>
					)}
				</CardContent>
			</Card>
			<Card className='shadow-xs'>
				<CardHeader>
					<CardTitle>Totais</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-6 md:grid-cols-4'>
						<Info label='Valor da NF' value={formatBRL(+(documento.vl_nf ?? 0) / 100)} />
						<Info label='Produtos' value={formatBRL(+(documento.vl_produto ?? 0) / 100)} />
						<Info label='ICMS' value={formatBRL(+(documento.vl_icms ?? 0) / 100)} />
						<Info label='Frete' value={formatBRL(+(documento.vl_frete ?? 0) / 100)} />
						<Info label='Seguro' value={formatBRL(+(documento.vl_seg ?? 0) / 100)} />
						<Info label='Descontos' value={formatBRL(+(documento.vl_desc ?? 0) / 100)} />
						<Info label='Outros' value={formatBRL(+(documento.vl_outros ?? 0) / 100)} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ViewerNFe;
