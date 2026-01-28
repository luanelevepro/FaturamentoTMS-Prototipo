import { Building, ChevronsUpDown, ScrollText, ShieldAlert, SquareArrowOutUpRight } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useCompanyContext } from '@/context/company-context';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Mock types
export type Company = {
    id: string;
    ds_fantasia: string;
    id_externo: string;
    is_escritorio: boolean;
};

const removeDiacritics = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function CompanySwitcher({ companies }: { companies: Company[] }) {
    const [open, setOpen] = useState(false);
    const { state, updateState } = useCompanyContext();
    const { isMobile } = useSidebar();
    const [activeCompany, setActiveCompany] = useState<Company | undefined>(undefined);

    useEffect(() => {
        setActiveCompany(companies?.find((company) => company.id === state));
    }, [companies, state]);

    async function updateCompanyContext(id: string) {
        if (id === state) return;
        await updateState(id);
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                        >
                            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                                {activeCompany?.id_externo === '0' ? (
                                    <ShieldAlert className='size-5' />
                                ) : activeCompany?.is_escritorio ? (
                                    <ScrollText className='size-5' />
                                ) : (
                                    <Building className='size-5' />
                                )}
                            </div>
                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-semibold'>{activeCompany?.ds_fantasia}</span>
                                <span className='truncate text-xs'>
                                    {activeCompany?.id_externo === '0' ? 'Sistema' : activeCompany?.is_escritorio ? 'Escritório' : 'Empresa'}
                                </span>
                            </div>
                            <ChevronsUpDown className='ml-auto' />
                        </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                        side={isMobile ? 'bottom' : 'right'}
                        align='start'
                        className={`p-0 ${isMobile && 'w-[var(--radix-popover-trigger-width)]'} `}
                    >
                        <Command
                            filter={(value, search) => {
                                const normalizedSearch = removeDiacritics(search.toLowerCase().trim());
                                const normalizedValue = removeDiacritics(value.toLowerCase().trim());

                                return normalizedValue.includes(normalizedSearch) ? 1 : 0;
                            }}
                        >
                            <CommandInput placeholder='Pesquisar empresas...' />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading='Empresas'>
                                    {companies?.map((company) => (
                                        <CommandItem
                                            key={company.id}
                                            value={`${company.ds_fantasia}-${company.id}`}
                                            onSelect={() => {
                                                updateCompanyContext(company.id);
                                                setOpen(false);
                                            }}
                                            className='cursor-pointer gap-2 p-2'
                                        >
                                            <div className='flex size-6 min-h-6 min-w-6 items-center justify-center rounded-sm border'>
                                                {company.id_externo === '0' ? (
                                                    <ShieldAlert className='size-4 shrink-0' />
                                                ) : company.is_escritorio ? (
                                                    <ScrollText className='size-4 shrink-0' />
                                                ) : (
                                                    <Building className='size-4 shrink-0' />
                                                )}
                                            </div>
                                            {company.ds_fantasia}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem className='cursor-pointer gap-2 p-2'>
                                        <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                                            <SquareArrowOutUpRight className='size-4' />
                                        </div>
                                        Outras
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
