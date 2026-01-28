import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface IItems {
	text: string;
	value: string;
}

interface IProps extends React.ComponentProps<typeof Select> {
	id: string;
	label: string;
	placeholder: string;
	required?: boolean;
	options?: IItems[];
	className?: string;
}

export function SelectWithLabel({ className, id, placeholder, options = [], label, required = false, ...props }: IProps) {
	return (
		<div className={cn('flex flex-col w-full gap-2 self-start', className)}>
			<Label htmlFor={id} required={required}>
				{label}
			</Label>
			<Select {...props} name={id}>
				<SelectTrigger className='w-full' id={id} name={id}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((item, index) => (
						<SelectItem key={index} value={item.value}>
							{item.text}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
