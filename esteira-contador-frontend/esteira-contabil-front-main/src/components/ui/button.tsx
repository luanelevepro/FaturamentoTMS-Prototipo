import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				warn: 'bg-amber-100 text-amber-800 shadow-xs hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
				link: 'text-primary underline-offset-4 hover:underline',
				danger: 'text-white bg-chart-7 hover:bg-destructive/90 ',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9',
				close: 'size-5 rounded-full',
			},
			color: {
				red: '!border-chart-7 text-chart-7 hover:bg-chart-10 hover:text-chart-7',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

function Button({
	className,
	variant,
	color,
	size,
	asChild = false,
	tooltip,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		tooltip?: React.ReactNode;
	}) {
	const Comp = asChild ? Slot : 'button';

	// Cria o botão com base nas props e nas variações definidas
	const buttonElement = <Comp data-slot='button' className={cn(buttonVariants({ variant, size, color, className }))} {...props} />;

	// Se a prop tooltip estiver definida, envolve o botão com o Tooltip
	if (tooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		);
	}

	return buttonElement;
}

export { Button, buttonVariants };
