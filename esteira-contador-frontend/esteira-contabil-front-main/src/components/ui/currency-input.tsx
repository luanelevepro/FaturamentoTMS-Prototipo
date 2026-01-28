'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
	/**
	 * The current value of the input
	 */
	value?: string | number;

	/**
	 * Callback fired when the value changes
	 * @param value The raw numeric value as a string (without formatting)
	 * @param formattedValue The formatted value as a string (with currency symbol)
	 */
	onChange?: (value: string, formattedValue: string) => void;

	/**
	 * CSS class name
	 */
	className?: string;

	/**
	 * The locale to use for formatting
	 * @default "pt-BR"
	 */
	locale?: string;

	/**
	 * The currency code to use for formatting
	 * @default "BRL"
	 */
	currency?: string;

	/**
	 * Placeholder text when the input is empty
	 * @default Depends on the currency, e.g. "R$ 0,00" for BRL
	 */
	placeholder?: string;

	/**
	 * Whether to align the text in the center
	 * @default false
	 */
	centered?: boolean;

	/**
	 * The number of decimal places to show
	 * @default 2
	 */
	decimalPlaces?: number;
}

/**
 * A currency input component that formats the value as a currency
 * and provides the raw value to the onChange handler.
 */
export function CurrencyInput({
	value = '',
	onChange,
	className,
	disabled,
	locale = 'pt-BR',
	currency = 'BRL',
	placeholder,
	centered = false,
	decimalPlaces = 2,
	...props
}: CurrencyInputProps) {
	const [displayValue, setDisplayValue] = React.useState('');
	const [isFocused, setIsFocused] = React.useState(false);

	// Get currency symbol for the placeholder
	const getCurrencySymbol = React.useCallback(() => {
		try {
			return (
				new Intl.NumberFormat(locale, {
					style: 'currency',
					currency,
					currencyDisplay: 'symbol',
				})
					.formatToParts(0)
					.find((part) => part.type === 'currency')?.value || ''
			);
		} catch (error) {
			console.error('Error getting currency symbol:', error);
			return '';
		}
	}, [locale, currency]);

	// Format number as currency
	const formatCurrency = React.useCallback(
		(value: string | number) => {
			// Handle empty values
			if (value === '' || value === undefined || value === null) {
				return '';
			}

			const stringValue = String(value).replace(/(?!^-)[^\d]/g, '');

			// Handle empty string after removing non-digits
			if (stringValue === '-' || !stringValue) {
				return '';
			}

			// Convert to number and divide by 10^decimalPlaces to get decimal places
			const numberValue = Number(stringValue) / Math.pow(10, decimalPlaces);

			try {
				// Format as currency
				return new Intl.NumberFormat(locale, {
					style: 'currency',
					currency,
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				}).format(numberValue);
			} catch (error) {
				console.error('Error formatting currency:', error);
				return String(numberValue);
			}
		},
		[locale, currency, decimalPlaces],
	);

	// Update both internal state and parent value
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Preserva o sinal negativo no início e dígitos
		const rawValue = e.target.value.replace(/(?!^-)[^\d]/g, '');
		const formattedValue = formatCurrency(rawValue);

		setDisplayValue(formattedValue);
		onChange?.(rawValue, formattedValue);
	};

	// Format initial value
	React.useEffect(() => {
		if (value) {
			const formattedValue = formatCurrency(value);
			setDisplayValue(formattedValue);
		} else {
			setDisplayValue('');
		}
	}, [value, formatCurrency]);

	// Generate placeholder based on currency if not provided
	const defaultPlaceholder = React.useMemo(() => {
		if (placeholder) return placeholder;
		const symbol = getCurrencySymbol();
		const zeros = '0'.repeat(decimalPlaces);
		return `${symbol}0,${zeros}`;
	}, [placeholder, getCurrencySymbol, decimalPlaces]);

	return (
		<Input
			value={displayValue}
			onChange={handleChange}
			onFocus={(e) => {
				setIsFocused(true);
				props.onFocus?.(e);
			}}
			onBlur={(e) => {
				setIsFocused(false);
				props.onBlur?.(e);
			}}
			className={cn(
				'transition-all',
				centered && 'text-center',
				isFocused && 'border-primary',
				disabled && 'cursor-not-allowed opacity-60',
				className,
			)}
			placeholder={defaultPlaceholder}
			disabled={disabled}
			inputMode='numeric'
			{...props}
		/>
	);
}
