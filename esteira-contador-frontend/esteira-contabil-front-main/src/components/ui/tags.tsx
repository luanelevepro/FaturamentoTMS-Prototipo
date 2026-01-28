import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const tagVariants = cva('text-sm h-fit w-fit rounded-full flex justify-center items-center gap-1.5', {
	variants: {
		variant: {
			default: 'bg-gray-opacity text-gray',
			gray: 'bg-gray-opacity text-gray',
			green: 'bg-green-opacity text-green',
			orange: 'bg-orange-opacity text-orange',
			red: 'bg-red-opacity text-red',
			blue: 'bg-blue-opacity text-blue',
			purple: 'bg-purple-opacity text-purple',
			pink: 'bg-pink-opacity text-pink',
		},
		type: {
			text: 'p-1.5 pl-2.5 pr-2',
			icon: 'p-1.5',
		},
	},
	defaultVariants: {
		variant: 'default',
		type: 'text',
	},
});

type TagProps = React.ComponentProps<'span'> &
	VariantProps<typeof tagVariants> & {
		asChild?: boolean;
	};

function Tag({
	className,
	variant,
	type,
	asChild = false,
	...props
}: React.ComponentProps<'span'> & VariantProps<typeof tagVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span';

	return <Comp data-slot='badge' className={cn(tagVariants({ variant, type }), className)} {...props} />;
}

export { Tag, type TagProps, tagVariants };
