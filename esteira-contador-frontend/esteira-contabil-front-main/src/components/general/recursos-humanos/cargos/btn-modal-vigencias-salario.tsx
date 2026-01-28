import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Table, TableBody, TableHeader, TableRow, TableCell } from '@/components/ui/table';

import { getVigenciaByCargo } from '@/services/api/cargos';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';

import { useQuery } from '@tanstack/react-query';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { FileClock } from 'lucide-react';

interface VigenciaCargoSalario {
	id: string;
	ds_salario_min: number | null;
	ds_salario_max: number | null;
	created_at: Date | null;
	dt_updated: Date | null;
	dt_fim: Date | null;
	rh_cargo_nivel_senioridade: {
		rh_nivel: { ds_nome: string };
		rh_senioridade: {
			ds_nome: string;
			rh_senioridade_cargo: { cd_ordem: number };
		};
		rh_cargo: { ds_nome: string };
	};
}

interface VigenciaSalariosModalProps {
	cargoId: string;
}

export default function VigenciaSalariosModal({ cargoId }: VigenciaSalariosModalProps) {
	const [open, setOpen] = useState(false);
	const [vigencias, setVigencias] = useState<string[]>([]);
	const [senioridades, setSenioridades] = useState<string[]>([]);
	const [salarios, setSalarios] = useState<Map<string, { min: number | null; max: number | null }>>(new Map());
	const [cargoNome, setCargoNome] = useState('');
	const [dtFim, setDtFim] = useState<Date | null>(null);
	const [createdAt, setCreatedAt] = useState<string | null>(null);
	const [updatedAt, setUpdatedAt] = useState<string | null>(null);
	const [empty, setEmpty] = useState(false);
	const [paginaAtual, setPaginaAtual] = useState<string | null>(null);
	const { data: vigenciaCargoSalario, isFetching } = useQuery<VigenciaCargoSalario[]>({
		queryKey: ['get-vigencia-cargo-salario', cargoId],
		queryFn: () => getVigenciaByCargo(cargoId),
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	const orderData = useCallback(
		async (selectedDtFim: Date | null = new Date()) => {
			try {
				if (!vigenciaCargoSalario || vigenciaCargoSalario.length === 0) {
					toast.info('Não há relações de Cargo e Nível para este cargo.');
					setEmpty(true);
					return;
				}

				const datasFinais = Array.from(
					new Set(vigenciaCargoSalario.map((item) => (item.dt_fim ? format(new Date(item.dt_fim), 'MM/yyyy') : 'Sem data'))),
				).sort((a, b) => b.localeCompare(a)); // Decrescente
				const dtFimSelecionada = selectedDtFim ? format(selectedDtFim, 'MM/yyyy') : datasFinais[0];

				setPaginaAtual(dtFimSelecionada);
				setDtFim(selectedDtFim);

				if (dtFimSelecionada === 'Sem data') {
					const dataSemData = vigenciaCargoSalario.filter((item) => !item.dt_fim);
					if (dataSemData.length === 0) {
						setEmpty(true);
						return;
					}
					buildStateByMinSalary(dataSemData);
					return;
				}

				// Filtra pelo mês/ano usando intervalo [início, fim do mês]
				const parsedDate = parse(dtFimSelecionada, 'MM/yyyy', new Date());
				const monthStart = startOfMonth(parsedDate);
				const monthEnd = endOfMonth(parsedDate);

				const dataFiltrada = vigenciaCargoSalario.filter((item) => {
					if (!item.dt_fim) return false;
					const d = new Date(item.dt_fim);
					return d >= monthStart && d <= monthEnd;
				});

				if (dataFiltrada.length === 0) {
					setEmpty(true);
					return;
				}

				buildStateByMinSalary(dataFiltrada);
			} catch (error) {
				console.error('Erro:', error);
				toast.error('Erro ao carregar cargos e salários.');
				setEmpty(true);
			}
		},
		[vigenciaCargoSalario],
	);

	useEffect(() => {
		if (open) {
			orderData();
		}
	}, [open, orderData]);

	/**
	 * Monta o estado deduplicando as senioridades e níveis,
	 * mas ordenando cada um pelo MENOR ds_salario_min encontrado.
	 */
	const buildStateByMinSalary = (dataFiltrada: VigenciaCargoSalario[]) => {
		setEmpty(false);

		// Pega infos do primeiro registro
		if (dataFiltrada[0]?.rh_cargo_nivel_senioridade?.rh_cargo?.ds_nome) {
			setCargoNome(dataFiltrada[0].rh_cargo_nivel_senioridade.rh_cargo.ds_nome);
		}
		setCreatedAt(dataFiltrada[0]?.created_at ? format(new Date(dataFiltrada[0].created_at), 'dd-MM-yyyy') : null);
		setUpdatedAt(dataFiltrada[0]?.dt_updated ? format(new Date(dataFiltrada[0].dt_updated), 'dd-MM-yyyy') : null);

		// Armazenam o MENOR ds_salario_min para cada Senioridade e cada Nível
		const senioridadeMinSalaryMap = new Map<string, number>();
		const nivelMinSalaryMap = new Map<string, number>();

		// Mapa final de salários (chave: "Senioridade-Nível")
		const salariosMap = new Map<string, { min: number | null; max: number | null }>();

		dataFiltrada.forEach((item) => {
			const { rh_nivel, rh_senioridade } = item.rh_cargo_nivel_senioridade;
			const minSal = item.ds_salario_min ?? Infinity;

			if (rh_senioridade?.ds_nome) {
				const current = senioridadeMinSalaryMap.get(rh_senioridade.ds_nome);
				if (current == null || minSal < current) {
					senioridadeMinSalaryMap.set(rh_senioridade.ds_nome, minSal);
				}
			}

			if (rh_nivel?.ds_nome) {
				const current = nivelMinSalaryMap.get(rh_nivel.ds_nome);
				if (current == null || minSal < current) {
					nivelMinSalaryMap.set(rh_nivel.ds_nome, minSal);
				}
			}

			// Mapeia o salário
			if (rh_senioridade?.ds_nome && rh_nivel?.ds_nome) {
				const key = `${rh_senioridade.ds_nome}-${rh_nivel.ds_nome}`;
				salariosMap.set(key, {
					min: item.ds_salario_min,
					max: item.ds_salario_max,
				});
			}
		});

		// Ordenar as senioridades pelo menor ds_salario_min
		const senioridadeArray = Array.from(senioridadeMinSalaryMap, ([nome, sal]) => ({ nome, sal }));
		senioridadeArray.sort((a, b) => a.sal - b.sal);

		// Ordenar níveis pelo menor ds_salario_min
		const nivelArray = Array.from(nivelMinSalaryMap, ([nome, sal]) => ({ nome, sal }));
		nivelArray.sort((a, b) => a.sal - b.sal);

		setSenioridades(senioridadeArray.map((s) => s.nome));
		setVigencias(nivelArray.map((n) => n.nome));
		setSalarios(salariosMap);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' size='icon'>
					<FileClock className='h-5 w-5' />
				</Button>
			</DialogTrigger>

			<DialogContent className='max-w-4xl p-6'>
				<div className='flex items-center justify-between'>
					<div>
						<DialogHeader>
							<DialogTitle className='text-xl font-semibold'>
								Cargos e Salários - {cargoNome} ({paginaAtual})
							</DialogTitle>
							<DialogDescription className='text-gray-500'>
								Última atualização: {updatedAt} | Criado em: {createdAt}
							</DialogDescription>
						</DialogHeader>
					</div>
					<div>
						<MonthYearSelector
							showCurrentMonthButton
							showClearButton
							selected={dtFim || new Date()}
							onSelect={(date) => orderData(date)}
						/>
					</div>
				</div>
				{isFetching ? (
					<p className='mt-4 text-center'>Carregando...</p>
				) : empty ? (
					<p className='mt-4 text-center font-bold text-gray-500'>Nenhuma vigência encontrada para o mês selecionado.</p>
				) : (
					<div className='overflow-auto rounded-md border'>
						<Table className='w-full border'>
							<TableHeader>
								<TableRow className=''>
									<TableCell className='border-r p-2 text-center font-bold'>Senioridade / Níveis</TableCell>
									{vigencias.map((nivel) => (
										<TableCell key={nivel} className='border p-2 text-center font-bold'>
											{nivel}
										</TableCell>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{senioridades.map((senioridade) => (
									<TableRow key={senioridade}>
										<TableCell className='border-r p-2 text-center font-semibold'>{senioridade}</TableCell>
										{vigencias.map((nivel) => {
											const salaryObj = salarios.get(`${senioridade}-${nivel}`);
											return (
												<TableCell key={nivel} className='border p-2 text-center'>
													{salaryObj?.min ? `R$ ${salaryObj.min}` : '-'}
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
