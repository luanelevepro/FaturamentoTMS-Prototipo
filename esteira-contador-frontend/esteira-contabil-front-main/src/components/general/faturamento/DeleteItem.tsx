import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDelete,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface IDeleteProps {
	title: string;
	isLoading: boolean;
	fnc: () => void;
}

export function DeleteItem({ title, fnc, isLoading }: IDeleteProps) {
	const [open, setOpen] = useState(false);
	return (
		<AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Excluir' variant='ghost' size='icon'>
					<Trash2 />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Deseja mesmo excluir {title}?</AlertDialogTitle>
					<AlertDialogDescription>Isso irá remover {title}.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogDelete disabled={isLoading} onClick={fnc}>
						Excuir
					</AlertDialogDelete>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
