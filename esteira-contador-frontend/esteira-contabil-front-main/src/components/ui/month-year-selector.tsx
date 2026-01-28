'use client';
import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MonthYearSelectorProps {
  className?: string;
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  showCurrentMonthButton?: boolean;
  showClearButton?: boolean;
  placeholder?: string;
}

export function MonthYearSelector({
  className,
  selected,
  onSelect,
  showCurrentMonthButton = true,
  showClearButton = false,
  placeholder = 'Selecione um mês',
}: MonthYearSelectorProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected);
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState<number>(
    selected?.getFullYear() || new Date().getFullYear()
  );

  React.useEffect(() => {
    if (open) {
      setViewYear(date?.getFullYear() || new Date().getFullYear());
    }
  }, [open, date]);

  // Generate months
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const handlePreviousYear = () => {
    setViewYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear(prev => prev + 1);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    const today = new Date();
    
    if (newDate > today) {
      return;
    }
    
    setDate(newDate);
    onSelect?.(newDate);
    setOpen(false);
  };

  const handleClear = () => {
    setDate(undefined);
    onSelect?.(undefined);
    setOpen(false);
  };

  const formatDate = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn('w-full justify-start truncate text-left font-normal', className)}
        >
          <Calendar className='mr-2 h-4 w-4' />
          {date ? formatDate(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-4' align='center'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Button variant='outline' size='icon' onClick={handlePreviousYear}>
              <ChevronLeft className='h-4 w-4' />
              <span className='sr-only'>Ano anterior</span>
            </Button>
            <div className='text-lg font-medium'>{viewYear}</div>
            <Button variant='outline' size='icon' onClick={handleNextYear}>
              <ChevronRight className='h-4 w-4' />
              <span className='sr-only'>Próximo ano</span>
            </Button>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {months.map((month, index) => {
              const isSelected = date 
                ? index === date.getMonth() && viewYear === date.getFullYear()
                : false;
              
              const monthDate = new Date(viewYear, index, 1);
              const today = new Date();
              const isFuture = monthDate > today;
              
              return (
                <Button
                  key={month}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-9',
                    isSelected && 'bg-primary text-primary-foreground',
                    isFuture && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={() => handleMonthSelect(index)}
                  disabled={isFuture}
                >
                  {month}
                </Button>
              );
            })}
          </div>
          {(showCurrentMonthButton || showClearButton) && (
            <div
              className={cn(
                'mt-4 flex justify-center',
                showCurrentMonthButton && showClearButton ? 'gap-2' : ''
              )}
            >
              {showClearButton && (
                <Button
                  variant='outline'
                  className={showCurrentMonthButton ? 'flex-1' : 'w-full'}
                  size='sm'
                  onClick={handleClear}
                >
                  Limpar
                </Button>
              )}
              {showCurrentMonthButton && (
                <Button
                  variant='outline'
                  className={showClearButton ? 'flex-1' : 'w-full'}
                  size='sm'
                  onClick={() => {
                    const today = new Date();
                    setDate(today);
                    onSelect?.(today);
                    setOpen(false);
                  }}
                >
                  Mês atual
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}