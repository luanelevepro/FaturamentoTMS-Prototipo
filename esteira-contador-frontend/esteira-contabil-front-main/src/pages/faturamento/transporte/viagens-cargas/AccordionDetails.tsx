import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { badgeTripStatus } from '@/utils/functions';
import { ObjCte } from '.';

interface IProps {
	travel: ObjCte;
}

export default function AccordionDetails({ travel }: IProps) {
	const itemAndValue = (title: string, value: number, color?: string, isPercentage?: boolean) => {
		return (
			<div className='min-w-[120px]'>
				<p className='text-[13px]'>{title}</p>
				<p className={`text-base font-semibold ${color}`}>
					{isPercentage
						? `${value}%`
						: value.toLocaleString('pt-br', {
								style: 'currency',
								currency: 'BRL',
							})}
				</p>
			</div>
		);
	};

	return (
		<TableRow>
			<TableCell colSpan={10} className='p-5'>
				<div className='flex flex-col gap-2'>
					{travel?.detalhes?.map((detalhe, index) => {
						return (
							<div className='bg-secondary flex flex-col gap-4 space-y-2 rounded-2xl p-6 text-sm' key={index}>
								<p className='bg-foreground text-background m-0 w-fit rounded-md px-2 py-1 text-sm font-semibold'>
									Trajeto {detalhe.id}
								</p>
								<div className='flex gap-4'>
									<Badge variant={'transit'} className='min-w-[86px] border-none px-4 py-2'>
										Origem
									</Badge>
									<div className='min-w-[420px]'>
										<p className='text-sm font-semibold'>{detalhe.origem.cidade}</p>
										<p className='text-[13px]'>{detalhe.origem.endereco}</p>
									</div>
									<div className='min-w-[420px]'>
										<p className='text-sm font-semibold'>Centro de distribuição</p>
										<p className='text-[13px]'>{detalhe.origem.ct}</p>
									</div>
								</div>
								{detalhe.destino.map((destino, index) => {
									return (
										<div className='mb-0 flex gap-4' key={index}>
											<Badge variant={'cargo'} className='min-w-[86px] border-none px-4 py-2'>
												{`Carga #${destino.id}`}
											</Badge>
											<div className='min-w-[420px]'>
												<p className='text-sm font-semibold'>{destino.cidade}</p>
												<p className='text-[13px]'>{destino.end}</p>
											</div>

											<div className='min-w-[204px]'>
												<p className='text-sm font-semibold'>Destinatário</p>
												<p className='text-[13px]'>{destino.destino}</p>
											</div>
											<div className='min-w-[204px]'>
												<p className='text-sm font-semibold'>Docs</p>
												<div className='flex gap-2'>
													{destino.docs?.map((document, index) => {
														return (
															<Badge variant={'successTwo'} key={index} className='text-[13px]'>
																{document.doc}
															</Badge>
														);
													})}
												</div>
											</div>
											<div className='min-w-[204px]'>
												<p className='text-sm font-semibold'>Status</p>
												<Badge variant={destino.status} className='border-transparent p-2'>
													{badgeTripStatus(destino.status)}
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
				<h6 className='my-4 text-sm font-semibold'>Detalhes dos custos</h6>
				<div className='bg-secondary flex gap-4 rounded-2xl p-6'>
					{itemAndValue('Combustível', travel.costDetails.combustivel)}
					{itemAndValue('Pedágio', travel.costDetails.pedagio)}
					{itemAndValue('Outras despesas', travel.costDetails.outrasDepesas)}
					{itemAndValue('Custos pessoal', travel.costDetails.custosPessoal)}
					{itemAndValue('Custos total', travel.costDetails.custosTotal, 'text-[#D00000]')}
					{itemAndValue('Margem de lucro', travel.costDetails.margemLucro, 'text-[#38B000]', true)}
					{itemAndValue('Faturamento - custos totais', travel.costDetails.faturamento, 'text-[#38B000]')}
				</div>
			</TableCell>
		</TableRow>
	);
}
