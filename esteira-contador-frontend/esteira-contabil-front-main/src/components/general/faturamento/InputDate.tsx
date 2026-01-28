import { parse, isValid } from 'date-fns';
import { InputWithLabel } from './InputWithLabel';

interface DateInputProps {
	id: string;
	label: string;
	placeholder?: string;
	required?: boolean;
	className?: string;
}

export function InputDate({ className, id, label, placeholder = '--/--/----', required }: DateInputProps) {
	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.currentTarget.value.replace(/\D/g, '').slice(0, 8);

		if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
		if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5);

		e.currentTarget.value = value;

		if (value.length === 10) {
			const parsed = parse(value, 'dd/MM/yyyy', new Date());
			if (!isValid(parsed)) {
				e.currentTarget.setCustomValidity('Data inválida');
			} else {
				e.currentTarget.setCustomValidity('');
			}
		} else {
			e.currentTarget.setCustomValidity('');
		}
	};

	return (
		<InputWithLabel
			className={className}
			id={id}
			label={label}
			placeholder={placeholder}
			maxLength={10}
			onInput={handleInput}
			required={required}
		/>
	);
}
