import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DialogTitle } from '@radix-ui/react-dialog';

const years = Array.from({ length: 2040 - 2024 + 1 }, (_, i) => 2024 + i);
const months = Array.from({ length: 12 }, (_, i) => new Date(2020, i).toLocaleString('pt-BR', { month: 'long' }));

interface MonthData {
	[key: string]: number;
}

interface YearData {
	year: string;
	months: MonthData[];
}

export default function ConfigDialog() {
	const dataMock: YearData[] = [
		{
			year: '2024',
			months: [
				{ january: 12024 },
				{ february: 22024 },
				{ march: 32024 },
				{ april: 42024 },
				{ may: 0 },
				{ juny: 62024 },
				{ july: 72024 },
				{ august: 82024 },
				{ september: 92024 },
				{ october: 102024 },
				{ november: 112024 },
				{ december: 122024 },
			],
		},
		{
			year: '2025',
			months: [
				{ january: 12025 },
				{ february: 22025 },
				{ march: 32025 },
				{ april: 42025 },
				{ may: 52025 },
				{ juny: 0 },
				{ july: 72025 },
				{ august: 82025 },
				{ september: 92025 },
				{ october: 102025 },
				{ november: 112025 },
				{ december: 122025 },
			],
		},
	];

	const today = new Date().getFullYear().toString();
	const queryClient = useQueryClient();
	const [modalOpen, setModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [selectedYear, setSelectedYear] = useState(today);
	const [monthValues, setMonthValues] = useState<Record<string, string>>({});
	const [modifiedYears, setModifiedYears] = useState<Record<string, YearData>>({});

	const monthPropertyMap: Record<string, string> = {
		janeiro: 'january',
		fevereiro: 'february',
		março: 'march',
		abril: 'april',
		maio: 'may',
		junho: 'juny',
		julho: 'july',
		agosto: 'august',
		setembro: 'september',
		outubro: 'october',
		novembro: 'november',
		dezembro: 'december',
	};

	useEffect(() => {
		if (modalOpen) {
			updateFormValues(selectedYear);
		}
	}, [selectedYear, modalOpen]);

	const saveCurrentYearData = (year: string, monthValuesData: Record<string, string>) => {
		const currentYearMonths: MonthData[] = [];
		months.forEach((month) => {
			const propertyName = monthPropertyMap[month];
			const monthValue = parseCurrencyValue(monthValuesData[month] || '');

			const monthObject: MonthData = {};
			monthObject[propertyName] = monthValue;
			currentYearMonths.push(monthObject);
		});

		setModifiedYears((prev) => ({
			...prev,
			[year]: {
				year: year,
				months: currentYearMonths,
			},
		}));
	};

	const updateFormValues = (year: string) => {
		const modifiedYearData = modifiedYears[year];

		let newMonthValues: Record<string, string> = {};

		if (modifiedYearData) {
			months.forEach((month) => {
				const propertyName = monthPropertyMap[month];
				const monthObject = modifiedYearData.months.find((monthObj) => monthObj[propertyName] !== undefined);

				if (monthObject && monthObject[propertyName]) {
					newMonthValues[month] = formatCurrency(monthObject[propertyName]);
				} else {
					newMonthValues[month] = '';
				}
			});
		} else {
			const yearData = dataMock.find((data) => data.year === year);

			if (yearData && yearData.months.length > 0) {
				months.forEach((month) => {
					const propertyName = monthPropertyMap[month];
					const monthObject = yearData.months.find((monthObj) => monthObj[propertyName] !== undefined);

					if (monthObject && monthObject[propertyName]) {
						newMonthValues[month] = formatCurrency(monthObject[propertyName]);
					} else {
						newMonthValues[month] = '';
					}
				});
			} else {
				newMonthValues = months.reduce(
					(acc, month) => {
						acc[month] = '';
						return acc;
					},
					{} as Record<string, string>,
				);
			}
		}

		setMonthValues(newMonthValues);
	};

	const formatCurrency = (value: number): string => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	function closeModal() {
		setModalOpen(false);
		setModifiedYears({});
	}

	const parseCurrencyValue = (currencyString: string): number => {
		if (!currencyString) return 0;
		return parseFloat(currencyString.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
	};

	const getAllYearsData = (formData: FormData, currentYear: string) => {
		const currentYearMonthsData: Record<string, string> = {};
		months.forEach((month) => {
			const formValue = formData.get(`month-${month}`) as string;
			currentYearMonthsData[month] = formValue || '';
		});
		saveCurrentYearData(currentYear, currentYearMonthsData);

		const allYearsData: YearData[] = [];

		dataMock.forEach((yearData) => {
			if (!modifiedYears[yearData.year] && yearData.year !== currentYear) {
				allYearsData.push(yearData);
			}
		});

		Object.values(modifiedYears).forEach((modifiedYear) => {
			allYearsData.push(modifiedYear);
		});

		const currentYearExists = allYearsData.some((year) => year.year === currentYear);
		if (!currentYearExists) {
			const currentYearMonths: MonthData[] = [];
			months.forEach((month) => {
				const propertyName = monthPropertyMap[month];
				const formValue = formData.get(`month-${month}`) as string;
				const monthValue = parseCurrencyValue(formValue);

				const monthObject: MonthData = {};
				monthObject[propertyName] = monthValue;
				currentYearMonths.push(monthObject);
			});

			allYearsData.push({
				year: currentYear,
				months: currentYearMonths,
			});
		}

		return allYearsData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
	};

	async function sendInformation(allData: YearData[]) {
		setErrorMessage('');
		setIsLoading(true);

		try {
			console.log('📤 Enviando dados de todos os anos:', allData);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast.success('Configurações salvas com sucesso.');

			queryClient.invalidateQueries({ queryKey: ['dash-config'] });

			setModifiedYears({});
			closeModal();
		} catch (error) {
			console.error(error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
		}
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const year = formData.get('year') as string;

		if (!year) {
			setErrorMessage('Ano é obrigatório.');
			return;
		}

		const allYearsData = getAllYearsData(formData, year);

		console.log('TCL: handleSubmit -> allYearsData', allYearsData);
		sendInformation(allYearsData);
	};

	return (
		<Dialog open={modalOpen} onOpenChange={setModalOpen}>
			<DialogTrigger className='text-muted-foreground flex h-12 w-full max-w-[152px] items-center justify-center gap-2 rounded-[8px] border text-sm'>
				<Settings />
				Configurações
			</DialogTrigger>

			<DialogContent className='w-full gap-0 sm:max-w-[600px] md:max-w-[644px]' showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className='text-muted-foreground flex items-center gap-2 text-sm'>
						<Settings />
						<p className='text-foreground text-xl font-bold'>Configurações</p>
					</DialogTitle>
					<DialogDescription className='hidden'>Configurações</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='my-6 flex flex-col gap-6'>
					<div className='grid gap-2'>
						<Label htmlFor='year' required>
							Ano
						</Label>
						<Select
							name='year'
							value={selectedYear}
							onValueChange={(newYear) => {
								saveCurrentYearData(selectedYear, monthValues);
								setSelectedYear(newYear);
							}}
						>
							<SelectTrigger id='year' className='w-full'>
								<SelectValue placeholder='Selecione' />
							</SelectTrigger>
							<SelectContent>
								{years.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='max-h-[50dvh] overflow-auto scroll-auto pb-1'>
						<div className='flex flex-col sm:flex-row sm:gap-4'>
							<div className='w-full rounded-t-2xl border border-b-0 sm:w-1/2'>
								<div className='text-muted-foreground bg-ring flex rounded-t-2xl px-4 py-2'>
									<p className='min-w-20'>Mês</p>
									<p className='w-full text-center'>Meta</p>
								</div>
								{months.slice(0, 6).map((month) => (
									<div className='flex items-center border-b px-4 py-2' key={month}>
										<p className='min-w-20 text-[13px] capitalize'>{month}</p>
										<CurrencyInput
											maxLength={23}
											id={`month-${month}`}
											name={`month-${month}`}
											placeholder='Digite'
											className='bg-muted w-full'
											value={monthValues[month] || ''}
											onChange={(value) => {
												setMonthValues((prev) => ({
													...prev,
													[month]: value,
												}));
											}}
										/>
									</div>
								))}
							</div>

							<div className='w-full border border-t-0 border-b-0 sm:w-1/2 sm:rounded-t-2xl sm:border-t-1'>
								<div className='text-muted-foreground bg-ring hidden rounded-t-2xl px-4 py-2 sm:flex'>
									<p className='min-w-20'>Mês</p>
									<p className='w-full text-center'>Meta</p>
								</div>
								{months.slice(6, 12).map((month) => (
									<div className='flex items-center border-b px-4 py-2' key={month}>
										<p className='min-w-20 text-[13px] capitalize'>{month}</p>
										<CurrencyInput
											maxLength={23}
											id={`month-${month}`}
											name={`month-${month}`}
											placeholder='Digite'
											className='bg-muted w-full'
											value={monthValues[month] || ''}
											onChange={(value) => {
												setMonthValues((prev) => ({
													...prev,
													[month]: value,
												}));
											}}
										/>
									</div>
								))}
							</div>
						</div>
					</div>

					{errorMessage && (
						<p className='text-secondary-600 text-sm' role='alert'>
							{errorMessage}
						</p>
					)}

					<DialogFooter className='!justify-between'>
						<Button type='button' variant='outline' onClick={closeModal}>
							Fechar
						</Button>
						<Button type='submit' disabled={isLoading}>
							{isLoading ? 'Salvando...' : 'Salvar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
