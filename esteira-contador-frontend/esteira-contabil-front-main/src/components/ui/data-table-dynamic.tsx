import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

// Definição dos tipos
export interface DataTableProps<TData = unknown, TValue = unknown> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	pageParameters: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	onPageChange: (newPage: number) => void;
	onPageSizeChange: (newSize: number) => void;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	allIds?: Array<{ id: string; id_nfe?: string | null; id_nfse?: string | null; id_cte?: string | null }>;
}

export interface DataTableRef<TData> {
	getSelectedRows: () => TData[];
	clearSelectedRows: () => void;
	getSelectedAllIds: () => string[];
	getSelectAllMode: () => boolean;
}

function DataTableComponent<TData extends { id: string }, TValue = unknown>(
	{ columns, data, pageParameters, onPageChange, onPageSizeChange, sorting, onSortingChange, allIds }: DataTableProps<TData, TValue>,
	ref: React.Ref<DataTableRef<TData>>,
) {
	const [rowSelection, setRowSelection] = useState({});
	const [selectAllMode, setSelectAllMode] = useState(false); // true quando "selecionar todos" foi clicado

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		pageCount: pageParameters.totalPages,
		onSortingChange,
		// getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => row.id,
		state: {
			sorting,
			rowSelection,
		},
	});

	// Expor métodos via ref
	useImperativeHandle(ref, () => ({
		getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
		clearSelectedRows: () => {
			setRowSelection({});
			setSelectAllMode(false);
		},
		getSelectedAllIds: () => {
			// Se "selecionar todos" foi ativado, retorna todos os IDs de allIds
			if (selectAllMode && allIds) {
				return allIds.map((item) => item.id);
			}
			// Caso contrário, retorna apenas os selecionados da página
			return table.getSelectedRowModel().rows.map((row) => row.original.id);
		},
		getSelectAllMode: () => selectAllMode,
	}));

	// Função para lidar com "selecionar todos"
	const handleSelectAll = (value: boolean) => {
		if (!allIds) {
			// Se não há allIds, usa o comportamento padrão
			table.toggleAllPageRowsSelected(value);
			setSelectAllMode(false);
			return;
		}

		if (value) {
			// Selecionar todos: marca as linhas visíveis como selecionadas
			const newSelection: Record<string, boolean> = {};
			data.forEach((row) => {
				const rowData = row as Record<string, string>;
				newSelection[rowData.id] = true;
			});
			setRowSelection(newSelection);
			setSelectAllMode(true);
		} else {
			// Desselecionar todos
			setRowSelection({});
			setSelectAllMode(false);
		}
	};

	// Contar selecionados
	const countSelected = () => {
		if (selectAllMode && allIds) {
			return allIds.length;
		}
		return table.getFilteredSelectedRowModel().rows.length;
	};

	return (
		<>
			<div className='w-[calc(100vw-2rem)] overflow-hidden rounded-md border md:w-full'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : header.id === 'select' ? (
											<Checkbox
												checked={selectAllMode || table.getIsAllPageRowsSelected()}
												onCheckedChange={handleSelectAll}
												aria-label='Select all'
											/>
										) : (
											flexRender(header.column.columnDef.header, header.getContext())
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className='h-24 text-center'>
									Nada por aqui.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Controles de Paginação */}
			<div className='py-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-2'>
						<Select value={pageParameters.pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
							<SelectTrigger className='h-8 w-[70px]'>
								<SelectValue placeholder={pageParameters.pageSize} />
							</SelectTrigger>
							<SelectContent side='top'>
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='flex items-center space-x-1'>
							{countSelected() > 0 && <p className='text-muted-foreground text-sm'>{countSelected()} selecionados</p>}
							<p className='text-muted-foreground text-sm'>de {pageParameters.total} registros</p>
						</div>
					</div>
					<div className='flex items-center space-x-3 lg:space-x-4'>
						<div className='text-muted-foreground hidden items-center justify-center text-sm sm:flex'>
							Página {pageParameters.page} de {pageParameters.totalPages}
						</div>
						<div className='flex items-center space-x-2'>
							<Button variant='outline' className='h-8 w-8 p-0' onClick={() => onPageChange(1)} disabled={pageParameters.page === 1}>
								<ChevronsLeft />
							</Button>
							<Button
								variant='outline'
								className='h-8 w-8 p-0'
								onClick={() => onPageChange(pageParameters.page - 1)}
								disabled={pageParameters.page === 1}
							>
								<ChevronLeft />
							</Button>
							<Button
								variant='outline'
								className='h-8 w-8 p-0'
								onClick={() => onPageChange(pageParameters.page + 1)}
								disabled={pageParameters.page === pageParameters.totalPages}
							>
								<ChevronRight />
							</Button>
							<Button
								variant='outline'
								className='h-8 w-8 p-0'
								onClick={() => onPageChange(pageParameters.totalPages)}
								disabled={pageParameters.page === pageParameters.totalPages}
							>
								<ChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export const DataTableDynamic = forwardRef(DataTableComponent) as <TData = unknown, TValue = unknown>(
	props: DataTableProps<TData, TValue> & { ref?: React.Ref<DataTableRef<TData>> },
) => React.JSX.Element;
