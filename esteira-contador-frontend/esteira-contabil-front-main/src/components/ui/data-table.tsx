import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';

// Definindo valores padrão para os genéricos
export interface DataTableProps<TData = unknown, TValue = unknown> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export interface DataTableRef<TData> {
	getSelectedRows: () => TData[];
	clearSelectedRows: () => void;
}

// Função interna que utiliza os genéricos
function DataTableComponent<TData = unknown, TValue = unknown>(
	{ columns, data }: DataTableProps<TData, TValue>,
	ref: React.Ref<DataTableRef<TData>>,
) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			rowSelection,
		},
	});

	// Expor métodos via ref
	useImperativeHandle(ref, () => ({
		getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
		clearSelectedRows: () => setRowSelection({}),
	}));

	return (
		<>
			<div className='w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : header.column.id === 'select' ? (
											<Checkbox
												checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && 'indeterminate')}
												onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
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
			<div className='py-4'>
				<DataTablePagination table={table} />
			</div>
		</>
	);
}

// Realizando uma asserção de tipo para preservar os genéricos no forwardRef
export const DataTable = forwardRef(DataTableComponent) as <TData = unknown, TValue = unknown>(
	props: DataTableProps<TData, TValue> & { ref?: React.Ref<DataTableRef<TData>> },
) => React.JSX.Element;
