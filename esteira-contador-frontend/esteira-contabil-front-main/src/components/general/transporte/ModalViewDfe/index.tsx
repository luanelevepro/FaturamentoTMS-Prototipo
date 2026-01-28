import { Button } from '@/components/ui/button';
import { DialogHeader, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

export default function ModalViewDfe({ obs }: { obs?: string }) {
	return (
		<Dialog>
			<DialogTrigger asChild disabled={!obs}>
				<Button tooltip='Observação da nota' variant='ghost' size='icon'>
					<Eye />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='mb-3'></DialogTitle>
					<DialogDescription className='rounded-xl border p-3 font-bold'>{obs}</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
