import { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
	return (
		<div className='flex items-center justify-between'>
			<div className='flex items-center space-x-2'>
				<Select
					value={`${table.getState().pagination.pageSize}`}
					onValueChange={(value) => {
						table.setPageSize(Number(value));
					}}
				>
					<SelectTrigger className='h-8 w-[70px]'>
						<SelectValue placeholder={table.getState().pagination.pageSize} />
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
					{table.getFilteredSelectedRowModel().rows.length > 0 && (
						<p className='text-muted-foreground text-sm'>{table.getFilteredSelectedRowModel().rows.length} selecionados</p>
					)}
					<p className='text-muted-foreground text-sm'>de {table.getFilteredRowModel().rows.length}</p>
				</div>
			</div>
			<div className='flex items-center space-x-3 lg:space-x-4'>
				<div className='text-muted-foreground hidden items-center justify-center text-sm sm:flex'>
					{table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
				</div>
				<div className='flex items-center space-x-2'>
					<Button
						variant='outline'
						className='h-8 w-8 p-0'
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className='sr-only'>Primeira página</span>
						<ChevronsLeft />
					</Button>
					<Button
						variant='outline'
						className='h-8 w-8 p-0'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className='sr-only'>Página anterior</span>
						<ChevronLeft />
					</Button>
					<Button variant='outline' className='h-8 w-8 p-0' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
						<span className='sr-only'>Próxima página</span>
						<ChevronRight />
					</Button>
					<Button
						variant='outline'
						className='h-8 w-8 p-0'
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className='sr-only'>Última página</span>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
