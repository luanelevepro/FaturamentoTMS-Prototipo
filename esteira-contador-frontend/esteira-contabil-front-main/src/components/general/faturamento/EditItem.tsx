import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PencilLine } from 'lucide-react';
import { useState } from 'react';

interface IEditProps {
	title: string;
	isLoading: boolean;
	fnc: () => void;
}

export function EditItem({ fnc, isLoading, title }: IEditProps) {
	const [open, setOpen] = useState(false);
	return (
		<AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Editar' variant='ghost' size='icon'>
					<PencilLine />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Editar {title}?</AlertDialogTitle>
					<AlertDialogDescription></AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction disabled={isLoading} onClick={fnc}>
						Salvar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
