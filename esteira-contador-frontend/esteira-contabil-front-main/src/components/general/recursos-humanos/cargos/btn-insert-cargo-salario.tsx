/*
Tela para criação de cargos e salários, permite criação e delete de senioridades e niveis, controlando ordem e valores de salarios por cargos / niveis / senioridades
FetchData busca os dados e monta as estruturas basicas
ValidateSalarios cuida da criação de warns para evitar que o user insira dados que não façam sentido ou até tente enviar dados vazios
HandleMinSalarioChange alteração de salarios minimos, além de fazer a chamada para atualizarSalariosMaximo
atualizarSalariosMaximo é a função que calcula os salarios maximos, baseado nos minimos
handleSalvar é a função que prepara os dados para serem enviados ao backend e chama todas as outras funções para ter controle dos dados, sendo utilizado no botão Salvar proximo ai final do código
as funções que cuidam dos valores de salarios max e min, possuem divisão por 100 devido a forma que foi construída a CurrencyInput, pois ela exibe 1000,00 mas o dado é 100000, ou seja, para salvar, deve ser dividido por 100 para acomodar corretamente o valor
*/
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, Trash2, Save, MoveUp, MoveDown, CircleAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { getCargoNivelById, processCargoItems } from '@/services/api/cargo-nivel-senioridade';
import { updateFuncionarioCargo } from '@/services/api/funcionarios';

import VigenciaSalariosModal from './btn-modal-vigencias-salario';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '@/components/states/loading-spinner';
import { MonthYearSelector } from '@/components/ui/month-year-selector';

interface CargoNivelSenioridade {
	id: string;
	ds_salario_min: number | null;
	ds_salario_max: number | null;
	rh_empresas: {
		id: string;
	} | null;
	rh_nivel: {
		id: string;
		ds_nome: string;
		id_rh_empresas: string | null;
		rh_nivel_cargo?: Array<{
			cd_ordem?: number;
		}>;
	} | null;
	rh_senioridade: {
		id: string;
		ds_nome: string;
		id_rh_empresas: string | null;
		rh_senioridade_cargo?: Array<{
			cd_ordem?: number;
		}>;
	} | null;
	rh_cargo: {
		id: string;
		ds_nome: string;
		id_rh_empresas: string | null;
	} | null;
}

interface SalarioRecord {
	id: string;
	min: number | null;
	max: number | null;
	id_cargo?: string;
	id_nivel?: string;
	id_senioridade?: string;
}

interface NivelUI {
	uiKey: string;
	name: string;
	isDefault: boolean;
	cd_ordem?: number;
	delete: boolean;
}

interface SenioridadeUI {
	uiKey: string;
	name: string;
	isDefault: boolean;
	cd_ordem?: number;
	delete: boolean;
}

interface CargosSalariosProps {
	cargoId: string;
}

export default function HandleInsertCargoSalario({ cargoId }: CargosSalariosProps) {
	const queryClient = useQueryClient();
	const [niveisUI, setNiveisUI] = useState<NivelUI[]>([]);
	const [senioridadesUI, setSenioridadesUI] = useState<SenioridadeUI[]>([]);
	const [niveisToDelete, setNiveisToDelete] = useState<NivelUI[]>([]);
	const [senioridadesToDelete, setSenioridadesToDelete] = useState<SenioridadeUI[]>([]);
	const [salarios, setSalarios] = useState<Map<string, SalarioRecord>>(new Map());
	const [warnings, setWarnings] = useState<Map<string, boolean>>(new Map());
	const [cargoNome, setCargoNome] = useState<string>('');
	const [empresaId, setEmpresaId] = useState<string>('');
	const [saving, setSaving] = useState(false);
	const [empty, setEmpty] = useState<boolean>(false);
	const [information, setInformation] = useState<{ dt_fim: Date | null }>({ dt_fim: null });
	const {
		data: cargoSalario,
		isFetching,
		refetch,
	} = useQuery<CargoNivelSenioridade[]>({
		queryKey: ['get-cargo-salario', cargoId],
		queryFn: () => getCargoNivelById(cargoId),
		staleTime: 1000 * 60 * 5,
	});
	// Gera chave do map de salários
	const makeSalarioKey = (sen: SenioridadeUI, niv: NivelUI) => {
		return `${sen.name}-${niv.name}`;
	};

	const orderData = useCallback((data: CargoNivelSenioridade[]) => {
		try {
			if (!data || data.length === 0) {
				toast.info('Não há relações de Cargo e Nível para este cargo...');
				setEmpty(true);
				setNiveisUI([]);
				setSenioridadesUI([]);
				setSalarios(new Map());
				return;
			}

			if (data[0].rh_cargo && data[0].rh_cargo.ds_nome) {
				setCargoNome(data[0].rh_cargo.ds_nome);
			}

			const cargoEmpresaId = data[0].rh_cargo?.id_rh_empresas || data[0].rh_empresas?.id || '';
			setEmpresaId(cargoEmpresaId);

			const niveisMap = new Map<string, NivelUI>();
			const senioridadesMap = new Map<string, SenioridadeUI>();
			const salariosMap = new Map<string, SalarioRecord>();

			data.forEach((item) => {
				const { rh_nivel, rh_senioridade } = item;
				if (rh_nivel && rh_nivel.ds_nome) {
					const cdOrdemNivel = rh_nivel.rh_nivel_cargo?.[0]?.cd_ordem;
					if (!niveisMap.has(rh_nivel.ds_nome)) {
						niveisMap.set(rh_nivel.ds_nome, {
							uiKey: crypto.randomUUID(),
							name: rh_nivel.ds_nome,
							isDefault: rh_nivel.id_rh_empresas === null,
							cd_ordem: cdOrdemNivel, // Pega do rh_nivel_cargo
							delete: false,
						});
					}
				}

				if (rh_senioridade && rh_senioridade.ds_nome) {
					const cdOrdemSenioridade = rh_senioridade.rh_senioridade_cargo?.[0]?.cd_ordem;
					if (!senioridadesMap.has(rh_senioridade.ds_nome)) {
						senioridadesMap.set(rh_senioridade.ds_nome, {
							uiKey: crypto.randomUUID(),
							name: rh_senioridade.ds_nome,
							isDefault: rh_senioridade.id_rh_empresas === null,
							cd_ordem: cdOrdemSenioridade,
							delete: false,
						});
					}
				}

				if (rh_nivel && rh_nivel.ds_nome && rh_senioridade && rh_senioridade.ds_nome) {
					const key = `${rh_senioridade.ds_nome}-${rh_nivel.ds_nome}`;
					salariosMap.set(key, {
						id: item.id,
						min: item.ds_salario_min,
						max: item.ds_salario_max,
					});
				}
			});

			if (niveisMap.size === 0 || senioridadesMap.size === 0) {
				toast.info('Não há relações de Cargo e Nível para este cargo...');
				setEmpty(true);
				setNiveisUI([]);
				setSenioridadesUI([]);
				setSalarios(new Map());
				return;
			} else {
				setEmpty(false);
			}

			// Conversão de maps para arrays
			const arrNiveis = Array.from(niveisMap.values());
			const arrSenioridades = Array.from(senioridadesMap.values());

			// Ordena Níveis
			const allNiveisUndefined = arrNiveis.every((niv) => niv.cd_ordem === undefined);
			if (allNiveisUndefined) {
				arrNiveis.sort((a, b) => a.name.localeCompare(b.name));
			} else {
				arrNiveis.sort((a, b) => {
					const aOrder = a.cd_ordem ?? 9999;
					const bOrder = b.cd_ordem ?? 9999;
					return aOrder - bOrder;
				});
			}

			// Ordena Senioridades
			const allSenioridadesUndefined = arrSenioridades.every((sen) => sen.cd_ordem === undefined);
			if (allSenioridadesUndefined) {
				arrSenioridades.sort((a, b) => a.name.localeCompare(b.name));
			} else {
				arrSenioridades.sort((a, b) => {
					const aOrder = a.cd_ordem ?? 9999;
					const bOrder = b.cd_ordem ?? 9999;
					return aOrder - bOrder;
				});
			}

			setNiveisUI(arrNiveis);
			setSenioridadesUI(arrSenioridades);
			setSalarios(salariosMap);
			setWarnings(new Map());
		} catch (error) {
			console.error('Erro ao buscar dados:', error);
			toast.error('Erro ao carregar cargos e salários.');
		}
	}, []);

	// a ordenação é chamada sempre que tiver dados e cargoId
	useEffect(() => {
		if (cargoId && cargoSalario) {
			orderData(cargoSalario);
		}
	}, [cargoId, cargoSalario, orderData]);

	// função para adicionar Senioridade / Nível
	const addSenioridade = () => {
		const newItem: SenioridadeUI = {
			uiKey: crypto.randomUUID(),
			name: `Senioridade ${senioridadesUI.length + 1}`,
			isDefault: false,
			cd_ordem: undefined,
			delete: false,
		};
		setSenioridadesUI((prev) => [...prev, newItem]);

		const novoSalarios = new Map(salarios);
		niveisUI.forEach((niv) => {
			const key = makeSalarioKey(newItem, niv);
			novoSalarios.set(key, { id: '', min: null, max: null });
		});
		setSalarios(novoSalarios);
	};

	const addNivel = () => {
		const newItem: NivelUI = {
			uiKey: crypto.randomUUID(),
			name: `Nível ${niveisUI.length + 1}`,
			isDefault: false,
			cd_ordem: undefined,
			delete: false,
		};
		setNiveisUI((prev) => [...prev, newItem]);

		const novoSalarios = new Map(salarios);
		senioridadesUI.forEach((sen) => {
			const key = makeSalarioKey(sen, newItem);
			novoSalarios.set(key, { id: '', min: null, max: null });
		});
		setSalarios(novoSalarios);
	};

	const addSenioridadeAt = (targetKey: string, position: 'above' | 'below') => {
		const index = senioridadesUI.findIndex((s) => s.uiKey === targetKey);
		if (index === -1) return;

		const newItem: SenioridadeUI = {
			uiKey: crypto.randomUUID(),
			name: `Senioridade ${senioridadesUI.length + 1}`,
			isDefault: false,
			cd_ordem: undefined,
			delete: false,
		};
		const newArr = [...senioridadesUI];
		if (position === 'above') {
			newArr.splice(index, 0, newItem);
		} else {
			newArr.splice(index + 1, 0, newItem);
		}
		setSenioridadesUI(newArr);

		const novoSalarios = new Map(salarios);
		niveisUI.forEach((niv) => {
			const key = makeSalarioKey(newItem, niv);
			novoSalarios.set(key, { id: '', min: null, max: null });
		});
		setSalarios(novoSalarios);
	};

	// remove Senioridade / Nível
	const removeSenioridade = (uiKey: string) => {
		if (senioridadesUI.length <= 1) return;

		const updatedSenioridades = senioridadesUI.map((s) => (s.uiKey === uiKey ? { ...s, delete: true } : s));

		// Atualiza a UI com o array atualizado
		setSenioridadesUI(updatedSenioridades.filter((s) => s.uiKey !== uiKey));
		const senioridadeDeletada = updatedSenioridades.find((s) => s.uiKey === uiKey);
		if (senioridadeDeletada) {
			setSenioridadesToDelete((prev) => [...prev, senioridadeDeletada]);
		}
		// remove do array
		const novo = senioridadesUI.filter((x) => x.uiKey !== uiKey);
		setSenioridadesUI(novo);

		// remove do map de salários
		const novoSalarios = new Map(salarios);
		senioridadesUI.forEach((sen) => {
			if (sen.uiKey === uiKey) {
				niveisUI.forEach((niv) => {
					novoSalarios.delete(`${sen.name}-${niv.name}`);
				});
			}
		});
		setSalarios(novoSalarios);
	};

	const removeNivel = (uiKey: string) => {
		if (niveisUI.length <= 1) return;

		const updatedNiveis = niveisUI.map((n) => (n.uiKey === uiKey ? { ...n, delete: true } : n));

		setNiveisUI(updatedNiveis.filter((n) => n.uiKey !== uiKey));
		const nivelDeletado = updatedNiveis.find((n) => n.uiKey === uiKey);
		if (nivelDeletado) {
			setNiveisToDelete((prev) => [...prev, nivelDeletado]);
		}

		const novo = niveisUI.filter((n) => n.uiKey !== uiKey);
		setNiveisUI(novo);

		const novoSalarios = new Map(salarios);
		niveisUI.forEach((niv) => {
			if (niv.uiKey === uiKey) {
				senioridadesUI.forEach((sen) => {
					novoSalarios.delete(`${sen.name}-${niv.name}`);
				});
			}
		});
		setSalarios(novoSalarios);
	};

	// alteração no nome de Senioridade / Nível - desabilitado para padrões
	const renameSenioridade = (uiKey: string, newName: string) => {
		const novo = senioridadesUI.map((s) => {
			if (s.uiKey === uiKey) {
				const oldName = s.name;
				if (oldName !== newName) {
					const novoSalarios = new Map(salarios);
					niveisUI.forEach((niv) => {
						const oldKey = `${oldName}-${niv.name}`;
						const newKey = `${newName}-${niv.name}`;
						if (novoSalarios.has(oldKey)) {
							const val = novoSalarios.get(oldKey)!;
							novoSalarios.delete(oldKey);
							novoSalarios.set(newKey, val);
						}
					});
					setSalarios(novoSalarios);
				}
				return { ...s, name: newName };
			}
			return s;
		});
		setSenioridadesUI(novo);
	};

	const renameNivel = (uiKey: string, newName: string) => {
		const novo = niveisUI.map((n) => {
			if (n.uiKey === uiKey) {
				const oldName = n.name;
				if (oldName !== newName) {
					const novoSalarios = new Map(salarios);
					senioridadesUI.forEach((sen) => {
						const oldKey = `${sen.name}-${oldName}`;
						const newKey = `${sen.name}-${newName}`;
						if (novoSalarios.has(oldKey)) {
							const val = novoSalarios.get(oldKey)!;
							novoSalarios.delete(oldKey);
							novoSalarios.set(newKey, val);
						}
					});
					setSalarios(novoSalarios);
				}
				return { ...n, name: newName };
			}
			return n;
		});
		setNiveisUI(novo);
	};

	// valida os salarios de Salários (ordem e afins)
	const validateSalarios = (salariosMap: Map<string, SalarioRecord>): Map<string, boolean> => {
		const warningsMap = new Map<string, boolean>();
		if (!information.dt_fim) {
			warningsMap.set('dt_fim', true);
		}
		senioridadesUI.forEach((sen, sIndex) => {
			niveisUI.forEach((niv, nIndex) => {
				const key = `${sen.name}-${niv.name}`;
				const salarioAtual = salariosMap.get(key);
				let warn = false;
				if (!salarioAtual || salarioAtual.min === null) {
					warn = true;
				} else {
					// Checagens de ordem
					if (nIndex < niveisUI.length - 1) {
						const proxKey = `${sen.name}-${niveisUI[nIndex + 1].name}`;
						const proxSalario = salariosMap.get(proxKey);
						if (proxSalario && proxSalario.min !== null && salarioAtual.min >= proxSalario.min) {
							warn = true;
						}
					}
					if (nIndex > 0) {
						const prevKey = `${sen.name}-${niveisUI[nIndex - 1].name}`;
						const prevSalario = salariosMap.get(prevKey);
						if (prevSalario && prevSalario.min !== null && salarioAtual.min <= prevSalario.min) {
							warn = true;
						}
					}
					if (nIndex === niveisUI.length - 1 && sIndex < senioridadesUI.length - 1) {
						const nextKey = `${senioridadesUI[sIndex + 1].name}-${niveisUI[0].name}`;
						const proxSenior = salariosMap.get(nextKey);
						if (proxSenior && proxSenior.min !== null && salarioAtual.min >= proxSenior.min) {
							warn = true;
						}
					}
					if (nIndex === 0 && sIndex > 0) {
						const prevKey = `${senioridadesUI[sIndex - 1].name}-${niveisUI[niveisUI.length - 1].name}`;
						const prevSenior = salariosMap.get(prevKey);
						if (prevSenior && prevSenior.min !== null && salarioAtual.min <= prevSenior.min) {
							warn = true;
						}
					}
				}
				warningsMap.set(key, warn);
			});
		});
		return warningsMap;
	};

	const atualizarWarnings = (novoSalarios: Map<string, SalarioRecord>) => {
		const novosWarnings = validateSalarios(novoSalarios);
		setWarnings(novosWarnings);
	};

	const atualizarSalariosMaximos = (novoSalarios: Map<string, SalarioRecord>) => {
		senioridadesUI.forEach((sen, sIndex) => {
			niveisUI.forEach((niv, nIndex) => {
				const key = `${sen.name}-${niv.name}`;
				const salarioAtual = novoSalarios.get(key);
				if (!salarioAtual || salarioAtual.min === null) return;

				if (nIndex < niveisUI.length - 1) {
					const proxKey = `${sen.name}-${niveisUI[nIndex + 1].name}`;
					const proxSalario = novoSalarios.get(proxKey);
					novoSalarios.set(key, {
						...salarioAtual,
						max: proxSalario && proxSalario.min !== null ? proxSalario.min : salarioAtual.min,
					});
				} else {
					if (sIndex < senioridadesUI.length - 1) {
						const nextKey = `${senioridadesUI[sIndex + 1].name}-${niveisUI[0].name}`;
						const proxSalario = novoSalarios.get(nextKey);
						novoSalarios.set(key, {
							...salarioAtual,
							max: proxSalario && proxSalario.min !== null ? proxSalario.min : salarioAtual.min,
						});
					} else {
						novoSalarios.set(key, { ...salarioAtual, max: salarioAtual.min });
					}
				}
			});
		});
	};

	const handleMinSalarioChange = (senKey: string, nivKey: string, rawValue: string) => {
		const sen = senioridadesUI.find((s) => s.uiKey === senKey);
		const niv = niveisUI.find((n) => n.uiKey === nivKey);
		if (!sen || !niv) return;

		const key = `${sen.name}-${niv.name}`;
		const salarioAtual = salarios.get(key);
		if (!salarioAtual) return;

		const valor = rawValue ? parseFloat(rawValue) : null;
		const novoSalarios = new Map(salarios);
		if (valor !== null) {
			novoSalarios.set(key, { ...salarioAtual, min: valor / 100 });
		}

		atualizarSalariosMaximos(novoSalarios);
		atualizarWarnings(novoSalarios);
		setSalarios(novoSalarios);
	};

	// prepara o salvamento dos dados
	const handleSalvar = async () => {
		setSaving(true);

		// validação de warns
		const newWarnings = validateSalarios(salarios);
		setWarnings(newWarnings);
		const hasErrors = Array.from(newWarnings.values()).some((flag) => flag);
		if (hasErrors) {
			toast.error('Existem campos vazios ou com valores inconsistentes. Por favor, corrija os campos destacados.');
			setSaving(false);
			return;
		}

		if (!cargoId || !empresaId) {
			toast.error('Cargo ou Empresa não encontrados.');
			setSaving(false);
			return;
		}

		try {
			type Item = {
				type: 'senioridade' | 'nivel' | 'salario';
				ds_nome?: string;
				id_rh_empresas?: string;
				cd_ordem?: number;
				delete_senioridade?: boolean;
				delete_nivel?: boolean;
				ds_senioridade?: string;
				ds_nivel?: string;
				ds_salario_min?: number | null;
				ds_salario_max?: number | null;
				cd_ordem_senioridade?: number;
				delete_salario?: boolean;
				dt_fim?: Date | null;
			};
			const items: Item[] = [];

			for (let i = 0; i < senioridadesToDelete.length; i++) {
				const sen = senioridadesToDelete[i];
				items.push({
					type: 'senioridade',
					ds_nome: sen.name,
					id_rh_empresas: empresaId,
					cd_ordem: i,
					delete_senioridade: sen.delete,
				});
			}

			for (let i = 0; i < niveisToDelete.length; i++) {
				const niv = niveisToDelete[i];
				items.push({
					type: 'nivel',
					ds_nome: niv.name,
					id_rh_empresas: empresaId,
					cd_ordem: i,
					delete_nivel: niv.delete,
				});
			}

			for (let i = 0; i < senioridadesUI.length; i++) {
				const sen = senioridadesUI[i];
				items.push({
					type: 'senioridade',
					ds_nome: sen.name,
					id_rh_empresas: empresaId,
					cd_ordem: i,
					delete_senioridade: sen.delete,
				});
			}

			const niveisSorted = [...niveisUI].sort((a, b) => a.name.localeCompare(b.name));
			for (let i = 0; i < niveisSorted.length; i++) {
				const niv = niveisSorted[i];
				items.push({
					type: 'nivel',
					ds_nome: niv.name,
					id_rh_empresas: empresaId,
					cd_ordem: i,
					delete_nivel: niv.delete,
				});
			}

			salarios.forEach((sal, key) => {
				if (sal.min === null) return;
				const [senName, nivName] = key.split('-');
				const ds_salario_min = sal.min;
				const ds_salario_max = sal.max;
				const sen = senioridadesUI.find((s) => s.name === senName);
				const cd_ordem_senioridade = sen?.cd_ordem ?? 0;

				items.push({
					type: 'salario',
					ds_senioridade: senName,
					ds_nivel: nivName,
					ds_salario_min,
					ds_salario_max,
					cd_ordem_senioridade,
					delete_salario: false,
					dt_fim: information.dt_fim,
				});
			});

			await processCargoItems(cargoId, items);

			toast.success('Salvo com sucesso!');
		} catch (error) {
			console.error(error);
			toast.error('Erro ao salvar.');
		} finally {
			setSaving(false);
			if (cargoId) {
				await updateFuncionarioCargo(cargoId);
				await queryClient.invalidateQueries({ queryKey: ['get-funcionario-cargo', cargoId] });
				await queryClient.invalidateQueries({ queryKey: ['get-vigencia-cargo-salario', cargoId] });
			}
		}
	};

	// Telinha
	return (
		<TooltipProvider>
			<div className='rounded-md border p-6'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-xl font-semibold'>Cargos e Salários</h3>
						<p className='text-muted-foreground mt-1 text-sm'>{cargoNome || 'Nome do Cargo'}</p>
					</div>
					<div className='flex gap-2'>
						<MonthYearSelector
							showCurrentMonthButton
							showClearButton
							selected={information.dt_fim || new Date()}
							onSelect={(date) => setInformation({ ...information, dt_fim: date ?? null })}
						/>
						<VigenciaSalariosModal cargoId={cargoId}></VigenciaSalariosModal>
					</div>
				</div>

				{isFetching ? (
					<LoadingSpinner className='mt-4' />
				) : empty ? (
					<p className='mt-3 text-center font-bold text-gray-500'>Erro ao carregar os dados. Entre em contato com o Administrador.</p>
				) : (
					<div className='mt-4 space-y-4'>
						<div className='overflow-auto rounded-md border'>
							<div className='overflow-auto'>
								<Table>
									<TableHeader>
										<TableRow className='hover:bg-transparent'>
											<TableHead className='w-[180px]'>Senioridade</TableHead>
											{niveisUI.map((niv) => (
												<TableHead key={niv.uiKey} className='text-center'>
													<div className='flex items-center justify-center gap-2'>
														<input
															type='text'
															className='border-b border-dashed bg-transparent text-center focus:outline-hidden'
															value={niv.name}
															onChange={(e) => renameNivel(niv.uiKey, e.target.value)}
															disabled={saving || niv.isDefault}
														/>
														{niv.isDefault ? (
															<Tooltip>
																<TooltipTrigger asChild>
																	<span>
																		<CircleAlert className='h-4 w-4' />
																	</span>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Nível Padrão</p>
																</TooltipContent>
															</Tooltip>
														) : (
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		type='button'
																		variant='ghost'
																		size='icon'
																		className='text-muted-foreground hover:text-destructive h-6 w-6'
																		onClick={() => removeNivel(niv.uiKey)}
																		disabled={saving || niveisUI.length <= 1}
																	>
																		<Trash2 className='h-3.5 w-3.5' />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Remover {niv.name}</p>
																</TooltipContent>
															</Tooltip>
														)}
													</div>
												</TableHead>
											))}
											<TableHead className='w-10'>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															type='button'
															variant='ghost'
															size='icon'
															className='text-muted-foreground hover:text-primary h-6 w-6'
															onClick={addNivel}
															disabled={saving}
														>
															<Plus className='h-4 w-4' />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Adicionar nível</p>
													</TooltipContent>
												</Tooltip>
											</TableHead>
										</TableRow>
									</TableHeader>

									<TableBody>
										{senioridadesUI.map((sen) => (
											<TableRow key={sen.uiKey}>
												<TableCell className='p-3 font-medium'>
													<div className='flex items-center gap-2'>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	type='button'
																	variant='ghost'
																	size='icon'
																	className='text-muted-foreground hover:text-primary h-6 w-6'
																	onClick={() => addSenioridadeAt(sen.uiKey, 'above')}
																	disabled={saving}
																>
																	<MoveUp className='h-3.5 w-3.5' />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Criar acima</p>
															</TooltipContent>
														</Tooltip>

														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	type='button'
																	variant='ghost'
																	size='icon'
																	className='text-muted-foreground hover:text-primary h-6 w-6'
																	onClick={() => addSenioridadeAt(sen.uiKey, 'below')}
																	disabled={saving}
																>
																	<MoveDown className='h-3.5 w-3.5' />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Criar abaixo</p>
															</TooltipContent>
														</Tooltip>

														<input
															type='text'
															className='border-b border-dashed bg-transparent text-sm focus:outline-hidden'
															value={sen.name}
															onChange={(e) => renameSenioridade(sen.uiKey, e.target.value)}
															disabled={saving || sen.isDefault}
														/>
														{sen.isDefault ? (
															<Tooltip>
																<TooltipTrigger asChild>
																	<span>
																		<CircleAlert className='h-4 w-4' />
																	</span>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Senioridade Padrão</p>
																</TooltipContent>
															</Tooltip>
														) : (
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		type='button'
																		variant='ghost'
																		size='icon'
																		className='text-muted-foreground hover:text-destructive h-6 w-6'
																		onClick={() => removeSenioridade(sen.uiKey)}
																		disabled={saving || senioridadesUI.length <= 1}
																	>
																		<Trash2 className='h-3.5 w-3.5' />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Remover {sen.name}</p>
																</TooltipContent>
															</Tooltip>
														)}
													</div>
												</TableCell>

												{niveisUI.map((niv) => {
													const key = makeSalarioKey(sen, niv);
													const salarioObj = salarios.get(key) || { id: '', min: null, max: null };
													return (
														<TableCell key={niv.uiKey} className='p-3'>
															<CurrencyInput
																name={key}
																value=''
																onChange={(rawValue) => handleMinSalarioChange(sen.uiKey, niv.uiKey, rawValue)}
																disabled={saving}
																placeholder={
																	salarioObj.min !== null ? `R$ ${Number(salarioObj.min).toFixed(2)}` : 'R$ 0,00'
																}
																className='text-center'
															/>
															{warnings.get(key) && (
																<p className='mt-1 text-xs text-red-500'>Valor inválido ou fora de ordem!</p>
															)}
														</TableCell>
													);
												})}
												<TableCell className='w-10 p-2' />
											</TableRow>
										))}
										<TableRow>
											<TableCell colSpan={niveisUI.length + 2} className='p-0 hover:bg-transparent'>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													className='text-muted-foreground hover:text-primary flex h-10 w-full items-center justify-center gap-1 rounded-none'
													onClick={addSenioridade}
													disabled={saving}
												>
													<Plus className='h-3.5 w-3.5' />
													<span>Adicionar senioridade</span>
												</Button>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</div>

						<div className='mt-4 flex justify-end gap-3'>
							<Button
								type='button'
								variant='outline'
								onClick={() => {
									if (cargoId) {
										toast('Recarregando dados...');
										setTimeout(() => {
											refetch();
										}, 500);
									}
								}}
								disabled={saving}
							>
								Cancelar
							</Button>
							<Button onClick={handleSalvar} disabled={saving} className='flex items-center gap-2 px-4'>
								{saving ? (
									<>Salvando...</>
								) : (
									<>
										<Save className='h-4 w-4' />
										<span>Salvar</span>
									</>
								)}
							</Button>
						</div>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
