import { generateColorAndInitials } from '@/utils/color-generator';

export default function ColoredInitials({ name }: { name: string }) {
	const { color, initials } = generateColorAndInitials(name);

	return (
		<span className='flex aspect-square h-8 w-8 items-center justify-center rounded-sm' style={{ color, backgroundColor: color + '4D' }}>
			{initials}
		</span>
	);
}
