import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { Icons } from '@/components/layout/icons';

const infoIconVariants = cva('flex items-center justify-center w-fit rounded-full p-1', {
	variants: {
		color: {
			default: 'bg-gray text-gray-opacity',
			gray: 'bg-gray text-gray-opacity',
			green: 'bg-green text-green-opacity',
			orange: 'bg-orange text-orange-opacity',
			red: 'bg-red text-red-opacity',
			blue: 'bg-blue text-blue-opacity',
			purple: 'bg-purple text-purple-opacity',
			pink: 'bg-pink text-pink-opacity',
		},
		size: {
			sm: 'size-4',
			md: 'size-5',
			lg: 'size-6',
		},
	},
	defaultVariants: {
		color: 'default',
		size: 'md',
	},
});

type InfoIconProps = React.ComponentProps<'span'> &
	VariantProps<typeof infoIconVariants> & {
		asChild?: boolean;
		icon?: 'up' | 'down' | 'info' | 'check';
	};

const ICON_MAP = {
	up: ArrowUp,
	down: ArrowDown,
	info: Icons.info,
	check: Check,
};

function InfoIcon({ className, color = 'default', size, icon = 'info', asChild = false, ...props }: InfoIconProps) {
	const Comp = asChild ? Slot : 'span';
	const Icon = ICON_MAP[icon];

	return (
		<Comp data-slot='badge' className={cn(infoIconVariants({ color, size }), className)} {...props}>
			<Icon className='h-full w-full' strokeWidth={2.5} />
		</Comp>
	);
}

export { InfoIcon, type InfoIconProps, infoIconVariants };
