import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface IProps extends React.ComponentProps<'input'> {
	id: string;
	label: string;
	placeholder: string;
	required?: boolean;
	sup?: ReactNode;
	className?: string;
}

export function InputWithLabel({ className, id, placeholder, label, required = false, sup, ...props }: IProps) {
	return (
		<div className={cn('grid gap-2', className)}>
			<Label htmlFor={id} required={required}>
				{label}
				{!!sup && <sup className='-ml-0.5'>{sup}</sup>}
			</Label>
			<Input id={id} name={id} type='text' placeholder={placeholder} {...props} />
		</div>
	);
}
