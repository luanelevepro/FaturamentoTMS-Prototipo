import * as React from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type Option = { label: string; value: string };

interface MultiSelectSearchProps {
	label?: string;
	placeholder?: string;
	options: Option[];
	values: string[];
	onChange: (newValues: string[]) => void;
	maxVisible?: number;
	className?: string;
	disabled?: boolean;
}

export function MultiSelectSearch({
	label,
	placeholder = 'Pesquisar...',
	options,
	values,
	onChange,
	maxVisible = 100000000,
	className,
	disabled,
}: MultiSelectSearchProps) {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');

	// Improved search:
	// - split query into space-separated tokens
	// - normalize (remove diacritics, non-alphanumeric)
	// - for each option build two haystacks: full normalized text and digits-only text
	// - a token matches if it is substring of full haystack OR its digits-only part is substring of digits-only haystack
	const normalized = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;

		const tokens = q
			.split(/\s+/)
			.map((t) => t.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
			.map((t) => t.replace(/[^a-z0-9]/gi, ''))
			.filter(Boolean);

		return options.filter((o) => {
			const full = (o.label + ' ' + o.value)
				.toLowerCase()
				.normalize('NFD')
				.replace(/\p{Diacritic}/gu, '')
				.replace(/[^a-z0-9]/gi, '');

			const digits = full.replace(/[^0-9]/g, '');

			return tokens.every((t) => {
				const tDigits = t.replace(/[^0-9]/g, '');
				if (tDigits && digits.includes(tDigits)) return true;
				return full.includes(t);
			});
		});
	}, [options, query]);

	const visible = normalized.slice(0, maxVisible);
	const hiddenCount = Math.max(normalized.length - visible.length, 0);

	const toggle = (v: string) => {
		if (values.includes(v)) {
			onChange(values.filter((x) => x !== v));
		} else {
			onChange([...values, v]);
		}
	};

	const remove = (v: string) => onChange(values.filter((x) => x !== v));
	const clearAll = () => onChange([]);

	return (
		<div className={cn('w-full', className)}>
			{label && <label className='text-muted-foreground mb-2 block text-sm font-medium'>{label}</label>}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						disabled={disabled}
						className={cn(
							'h-9 w-full justify-between px-3 text-left font-normal transition-all duration-200',
							'hover:border-primary/30 hover:shadow-md',
							values.length === 0 && 'text-muted-foreground',
							open && 'border-primary shadow-glow ring-primary/20 ring-1',
						)}
					>
						<div className='min-w-0 flex-1'>
							{values.length === 0 ? (
								<span className='text-sm'>{placeholder}</span>
							) : (
								<div className='flex flex-wrap items-center gap-1'>
									{values.slice(0, 2).map((v) => {
										const opt = options.find((o) => o.value === v);
										return (
											<Badge
												key={v}
												variant='secondary'
												className='bg-primary/10 text-primary border-primary/20 h-5 rounded-full px-2 text-xs'
											>
												{opt?.label ?? v}
											</Badge>
										);
									})}
									{values.length > 2 && (
										<Badge variant='outline' className='text-muted-foreground h-5 rounded-full px-2 text-xs'>
											+{values.length - 2}
										</Badge>
									)}
								</div>
							)}
						</div>
						<ChevronDown className={cn('text-muted-foreground h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className={cn('w-[var(--radix-popover-trigger-width)] border-0 p-0', 'bg-background/95 shadow-xl backdrop-blur-sm')}
					align='start'
					sideOffset={4}
				>
					<div className='bg-background shadow-elegant rounded-lg border'>
						{/* Selected items - compact display */}
						{values.length > 0 && (
							<div className='bg-gradient-subtle border-b p-3'>
								<div className='flex flex-wrap gap-1'>
									{values.map((v) => {
										const opt = options.find((o) => o.value === v);
										return (
											<Badge
												key={v}
												variant='secondary'
												className={cn(
													'h-6 rounded-full text-xs transition-all duration-200',
													'bg-primary/10 text-primary border-primary/20',
													'hover:bg-primary/20 group',
												)}
											>
												<span className='select-none'>{opt?.label ?? v}</span>
												<button
													type='button'
													className={cn(
														'ml-1 opacity-60 transition-opacity hover:opacity-100',
														'group-hover:text-destructive',
													)}
													onClick={(e) => {
														e.stopPropagation();
														remove(v);
													}}
												>
													<X className='h-3 w-3' />
												</button>
											</Badge>
										);
									})}
								</div>
							</div>
						)}

						{/* Search and options */}
						<Command shouldFilter={false} className='border-0'>
							<div className='p-2'>
								<CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} className='h-8 text-sm' />
							</div>

							<CommandList
								className='max-h-48 overflow-y-auto'
								onWheel={(e: React.WheelEvent<HTMLElement>) => {
									// Reduce the effective wheel delta so the list scrolls
									// slower and feels less jumpy. Do not call
									// preventDefault so outer containers can still scroll
									// when the list reaches its bounds.
									const el = e.currentTarget as HTMLElement;
									const SPEED_FACTOR = 0.35; // lower = slower
									const delta = e.deltaY * SPEED_FACTOR;
									// apply a small clamp to avoid tiny fractional no-ops
									el.scrollTop += delta;
								}}
							>
								<CommandEmpty className='text-muted-foreground py-4 text-sm'>Nada encontrado.</CommandEmpty>
								<CommandGroup className='p-1'>
									{visible.map((opt) => {
										const isSelected = values.includes(opt.value);
										return (
											<CommandItem
												key={opt.value}
												onSelect={() => toggle(opt.value)}
												className={cn(
													'cursor-pointer rounded-md px-3 py-2 text-sm transition-all duration-200',
													'flex items-center justify-between',
													isSelected ? 'bg-primary/10 text-primary border-primary/20 border' : 'hover:bg-accent/50',
												)}
											>
												<span className='font-medium'>{opt.label}</span>
												{isSelected && <Check className='text-primary h-4 w-4' />}
											</CommandItem>
										);
									})}
								</CommandGroup>

								{hiddenCount > 0 && (
									<div className='text-muted-foreground bg-muted/30 border-t px-3 py-2 text-xs'>
										{hiddenCount} mais itens. Refine sua busca.
									</div>
								)}
							</CommandList>
						</Command>

						{/* Actions */}
						<div className='bg-gradient-subtle flex items-center justify-between border-t p-2'>
							<Button variant='ghost' size='sm' onClick={clearAll} className='hover:text-destructive h-7 text-xs'>
								Limpar
							</Button>
							<Button size='sm' onClick={() => setOpen(false)} className='bg-gradient-primary h-7 text-xs hover:opacity-90'>
								Concluir
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
