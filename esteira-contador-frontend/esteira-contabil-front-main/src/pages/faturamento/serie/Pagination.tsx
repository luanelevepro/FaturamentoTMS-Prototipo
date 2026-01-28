import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LoaderCircle } from 'lucide-react';

interface propsPagination {
	isFetting?: boolean;
	page?: number;
	pageSize?: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	setPage: (value: number) => void;
	setTake: (value: number) => void;
}

export default function Pagination({ page = 1, isFetting, totalItems, totalPages, pageSize = 10, setTake, setPage }: propsPagination) {
	return (
		<div className='mt-10 flex items-center justify-between'>
			<div className='flex items-center space-x-2'>
				<Select
					value={pageSize.toString()}
					disabled={isFetting}
					onValueChange={(value) => {
						setTake(Number(value));
					}}
				>
					<SelectTrigger className='h-8 w-[70px]'>
						<SelectValue placeholder={pageSize.toString()} />
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
					<p className='text-muted-foreground text-sm'>de {totalItems} registros</p>
				</div>
			</div>
			{isFetting && (
				<div className='flex items-center gap-2'>
					<LoaderCircle className='text-foreground h-8 w-8 animate-spin' />
					<p>Atualizando dados...</p>
				</div>
			)}
			<div className='flex items-center space-x-3 lg:space-x-4'>
				<div className='text-muted-foreground hidden items-center justify-center text-sm sm:flex'>
					Página {page} de {totalPages}
				</div>
				<div className='flex items-center space-x-2'>
					<Button variant='outline' className='h-8 w-8 p-0' onClick={() => setPage(1)} disabled={page === 1 || isFetting}>
						<span className='sr-only'>Primeira página</span>
						<ChevronsLeft />
					</Button>
					<Button variant='outline' className='h-8 w-8 p-0' onClick={() => setPage(page - 1)} disabled={page === 1 || isFetting}>
						<span className='sr-only'>Página anterior</span>
						<ChevronLeft />
					</Button>
					<Button
						variant='outline'
						className='h-8 w-8 p-0'
						onClick={() => setPage(page + 1)}
						disabled={page === totalPages || isFetting}
					>
						<span className='sr-only'>Próxima página</span>
						<ChevronRight />
					</Button>
					<Button
						variant='outline'
						className='h-8 w-8 p-0'
						onClick={() => setPage(totalPages)}
						disabled={page === totalPages || isFetting}
					>
						<span className='sr-only'>Última página</span>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
