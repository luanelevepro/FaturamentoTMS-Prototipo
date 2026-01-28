import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getExpandedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';

// Definindo valores padrão para os genéricos
export interface DataTableProps<TData = unknown, TValue = unknown> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

// Interface para o ref exposto
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
	const [expanded, setExpanded] = useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getRowCanExpand: () => true,
		onExpandedChange: setExpanded,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			rowSelection,
			expanded,
		},
	});

	// Expor métodos via ref
	useImperativeHandle(ref, () => ({
		getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
		clearSelectedRows: () => setRowSelection({}),
	}));

	return (
		<>
			<div className='w-[calc(100vw-2rem)] overflow-hidden rounded-md border md:w-full'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<React.Fragment key={row.id}>
									<TableRow data-state={row.getIsSelected() && 'selected'}>
										{row.getVisibleCells().map((cell) => {
											if (cell.column.id === 'expandedContent') {
												return null;
											}
											return <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
										})}
									</TableRow>

									{row.getIsExpanded() && (
										<TableRow>
											<TableCell colSpan={columns.length} className='p-4'>
												{(() => {
													const expandedCell = row.getAllCells().find((cell) => cell.column.id === 'expandedContent');
													return expandedCell
														? flexRender(expandedCell.column.columnDef.cell, expandedCell.getContext())
														: null;
												})()}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
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
