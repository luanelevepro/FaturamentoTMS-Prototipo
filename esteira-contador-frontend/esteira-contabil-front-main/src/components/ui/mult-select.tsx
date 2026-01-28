import React, { KeyboardEvent, createContext, forwardRef, useCallback, useContext, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandItem, CommandEmpty, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { X as RemoveIcon, Check } from 'lucide-react';

interface MultiSelectorProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
	values: string[];
	onValuesChange: (value: string[]) => void;
	loop?: boolean;
	/**
	 * Função que recebe um ID e retorna o texto que será exibido (por exemplo, a descrição).
	 * Se não for informada, será exibido o próprio ID.
	 */
	displayValue?: (id: string) => string;
}

interface MultiSelectContextProps {
	value: string[];
	onValueChange: (value: string) => void;
	open: boolean;
	setOpen: (value: boolean) => void;
	inputValue: string;
	setInputValue: React.Dispatch<React.SetStateAction<string>>;
	activeIndex: number;
	setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
	ref: React.RefObject<HTMLInputElement | null>;
	handleSelect: (e: React.SyntheticEvent<HTMLInputElement>) => void;
	displayValue?: (id: string) => string;
}

const MultiSelectContext = createContext<MultiSelectContextProps | null>(null);

const useMultiSelect = () => {
	const context = useContext(MultiSelectContext);
	if (!context) {
		throw new Error('useMultiSelect must be used within MultiSelectProvider');
	}
	return context;
};

/** Componente MultiSelector: gerencia internamente os IDs selecionados e utiliza a função displayValue para exibir a descrição. */
const MultiSelector = ({
	values: value,
	onValuesChange: onValueChange,
	loop = false,
	className,
	children,
	dir,
	displayValue,
	...props
}: MultiSelectorProps) => {
	const [inputValue, setInputValue] = useState('');
	const [open, setOpen] = useState<boolean>(false);
	const [activeIndex, setActiveIndex] = useState<number>(-1);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const onValueChangeHandler = useCallback(
		(val: string) => {
			if (value.includes(val)) {
				onValueChange(value.filter((item) => item !== val));
			} else {
				onValueChange([...value, val]);
			}
		},
		[value, onValueChange],
	);

	const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
		e.preventDefault();
		// Aqui você pode implementar lógica para capturar a seleção no input, se necessário.
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			e.stopPropagation();
			const target = inputRef.current;

			if (!target) return;

			const moveNext = () => {
				const nextIndex = activeIndex + 1;
				setActiveIndex(nextIndex > value.length - 1 ? (loop ? 0 : -1) : nextIndex);
			};

			const movePrev = () => {
				const prevIndex = activeIndex - 1;
				setActiveIndex(prevIndex < 0 ? value.length - 1 : prevIndex);
			};

			const moveCurrent = () => {
				const newIndex = activeIndex - 1 <= 0 ? (value.length - 1 === 0 ? -1 : 0) : activeIndex - 1;
				setActiveIndex(newIndex);
			};

			switch (e.key) {
				case 'ArrowLeft':
					if (dir === 'rtl') {
						if (value.length > 0 && (activeIndex !== -1 || loop)) {
							moveNext();
						}
					} else {
						if (value.length > 0 && target.selectionStart === 0) {
							movePrev();
						}
					}
					break;

				case 'ArrowRight':
					if (dir === 'rtl') {
						if (value.length > 0 && target.selectionStart === 0) {
							movePrev();
						}
					} else {
						if (value.length > 0 && (activeIndex !== -1 || loop)) {
							moveNext();
						}
					}
					break;

				case 'Backspace':
				case 'Delete':
					if (value.length > 0) {
						if (activeIndex !== -1 && activeIndex < value.length) {
							onValueChangeHandler(value[activeIndex]);
							moveCurrent();
						} else {
							if (target.selectionStart === 0) {
								onValueChangeHandler(value[value.length - 1]);
							}
						}
					}
					break;

				case 'Enter':
					setOpen(true);
					break;

				case 'Escape':
					if (activeIndex !== -1) {
						setActiveIndex(-1);
					} else if (open) {
						setOpen(false);
					}
					break;
			}
		},
		[value, activeIndex, loop, dir, onValueChangeHandler, open],
	);

	return (
		<MultiSelectContext.Provider
			value={{
				value,
				onValueChange: onValueChangeHandler,
				open,
				setOpen,
				inputValue,
				setInputValue,
				activeIndex,
				setActiveIndex,
				ref: inputRef,
				handleSelect,
				displayValue,
			}}
		>
			<Command
				onKeyDown={handleKeyDown}
				className={cn('flex flex-col space-y-2 overflow-visible bg-transparent', className)}
				dir={dir}
				{...props}
			>
				{children}
			</Command>
		</MultiSelectContext.Provider>
	);
};

const MultiSelectorTrigger = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
	const { value, onValueChange, activeIndex, displayValue } = useMultiSelect();

	const mousePreventDefault = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return (
		<div
			ref={ref}
			className={cn(
				'border-input flex flex-wrap gap-1 rounded-md border bg-transparent px-2 py-2 text-base shadow-xs ring-transparent',
				{ 'focus-within:ring-ring ring-1': activeIndex === -1 },
				className,
			)}
			{...props}
		>
			{value.map((item, index) => (
				<Badge
					key={item}
					className={cn('flex items-center gap-1', activeIndex === index && 'ring-muted-foreground ring-2')}
					variant={'outline'}
				>
					<span>{displayValue ? displayValue(item) : item}</span>
					<button
						aria-label={`Remove ${item} option`}
						aria-roledescription='button to remove option'
						type='button'
						onMouseDown={mousePreventDefault}
						onClick={() => onValueChange(item)}
					>
						<span className='sr-only'>Remove {item} option</span>
						<RemoveIcon className='hover:stroke-destructive size-3' />
					</button>
				</Badge>
			))}
			{children}
		</div>
	);
});
MultiSelectorTrigger.displayName = 'MultiSelectorTrigger';

const MultiSelectorInput = forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => {
	const { setOpen, inputValue, setInputValue, activeIndex, setActiveIndex, handleSelect, ref: inputRef } = useMultiSelect();

	return (
		<CommandPrimitive.Input
			{...props}
			tabIndex={0}
			ref={ref || inputRef}
			value={inputValue}
			onValueChange={activeIndex === -1 ? setInputValue : undefined}
			onSelect={handleSelect}
			onBlur={() => setOpen(false)}
			onFocus={() => setOpen(true)}
			onClick={() => setActiveIndex(-1)}
			className={cn(
				'placeholder:text-muted-foreground ml-1 flex-1 bg-transparent text-sm outline-hidden',
				className,
				activeIndex !== -1 && 'caret-transparent',
			)}
		/>
	);
});
MultiSelectorInput.displayName = 'MultiSelectorInput';

const MultiSelectorContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children }, ref) => {
	const { open } = useMultiSelect();
	return (
		<div ref={ref} className='relative'>
			{open && children}
		</div>
	);
});
MultiSelectorContent.displayName = 'MultiSelectorContent';

const MultiSelectorList = forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children }, ref) => {
	return (
		<CommandList
			ref={ref}
			className={cn(
				'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted scrollbar-thumb-rounded-lg border-muted bg-background absolute top-0 z-10 flex w-full flex-col gap-2 rounded-md border p-2 shadow-md transition-colors',
				className,
			)}
		>
			{children}
			<CommandEmpty>
				<span className='text-muted-foreground'>Nada foi encontrado</span>
			</CommandEmpty>
		</CommandList>
	);
});

MultiSelectorList.displayName = 'MultiSelectorList';

interface MultiSelectorItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem> {
	value: string;
	itemId?: string;
}

const MultiSelectorItem = forwardRef<HTMLDivElement, MultiSelectorItemProps>(({ className, value, itemId, children, ...props }, ref) => {
	const { value: selectedValues, onValueChange, setInputValue } = useMultiSelect();

	const mousePreventDefault = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const isIncluded = selectedValues.includes(value);
	const uniqueId = `multiselector-item-${itemId || value}`;

	return (
		<CommandItem
			ref={ref}
			{...props}
			id={uniqueId}
			data-item-id={uniqueId}
			data-value={value}
			onSelect={() => {
				onValueChange(value);
				setInputValue('');
			}}
			className={cn(
				'flex cursor-pointer justify-between rounded-md px-2 py-1 transition-colors',
				className,
				isIncluded && 'cursor-default opacity-50',
				props.disabled && 'cursor-not-allowed opacity-50',
			)}
			onMouseDown={mousePreventDefault}
			aria-label={`${children} ${uniqueId}`}
		>
			<span>
				{children}
				<span className='invisible absolute'>{uniqueId}</span>
			</span>
			{isIncluded && <Check className='h-4 w-4' />}
		</CommandItem>
	);
});

MultiSelectorItem.displayName = 'MultiSelectorItem';

export { MultiSelector, MultiSelectorTrigger, MultiSelectorInput, MultiSelectorContent, MultiSelectorList, MultiSelectorItem };
