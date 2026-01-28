import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { systemModules } from '@/services/modules/system-modules';
import { toast } from 'sonner';
import { Icons } from '@/components/layout/icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getModulosEmpresa, updateModulosEmpresa } from '@/services/api/modulos';
import { Company } from '@/pages/administracao/empresas';
import { Package } from 'lucide-react';

interface Modules {
	name: string;
	moduleName: string;
	description?: string;
	checked: boolean;
}

export default function BtnSetModulosEmpresa({ empresa }: { empresa: Company }) {
	const [isLoading, setLoading] = useState<boolean>(false);
	const [isSending, setSending] = useState<boolean>(false);
	const [modules, setModules] = useState<Modules[]>([]);
	const [open, setOpen] = useState(false);

	async function fetchData(): Promise<void> {
		try {
			setLoading(true);
			const response = await getModulosEmpresa(empresa.id);

			createModules(response?.[0]?.js_modules);
		} catch (error) {
			toast.error('Erro ao buscar módulos.');
			console.error('Erro ao buscar módulos:', error);
		} finally {
			setLoading(false);
		}
	}

	function createModules(js_modules: string[]) {
		// Filtra os módulos disponíveis no sistema
		const systemModulesFiltered = systemModules
			.filter((systemModule) => !systemModule.hidden)
			.map((systemModule) => ({
				...systemModule,
				checked: js_modules.includes(systemModule.moduleName),
			}));

		setModules(systemModulesFiltered);
	}

	function handleChange(module: Modules) {
		return (checked: boolean) => {
			setModules((prevModules) => prevModules.map((m) => (m.moduleName === module.moduleName ? { ...m, checked } : m)));
		};
	}

	async function saveModules(empresa_id: string, modules: Modules[]) {
		const modulesToSend = modules.filter((m) => m.checked).map((m) => m.moduleName);

		try {
			setSending(true);
			await updateModulosEmpresa({ empresa_id, modulos: { moduleTypes: modulesToSend } });
			toast.success('Módulos atualizados com sucesso.');
			setOpen(false);
		} catch (error) {
			console.error('Error updating modules:', error);
			toast.error('Erro ao atualizar módulos.');
		} finally {
			setSending(false);
		}
	}

	function handleModalOpenChange(isOpen: boolean) {
		setOpen(isOpen);
		if (isOpen) {
			fetchData();
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleModalOpenChange}>
				<DialogTrigger asChild>
					<Button tooltip='Módulos' variant='ghost' size='icon'>
						<Package />
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Módulos</DialogTitle>
						<DialogDescription>Gerenciar módulos da empresa: {empresa.ds_fantasia}</DialogDescription>
					</DialogHeader>
					{modules.map((module) => (
						<div key={module.name} className='flex items-center justify-between gap-2'>
							<Label htmlFor={module.moduleName} className='grid'>
								<span>{module.name}</span>
								<span className='text-muted-foreground leading-snug font-normal'>{module.description}</span>
							</Label>
							<Switch
								disabled={isSending || isLoading}
								checked={module.checked}
								onCheckedChange={handleChange(module)}
								id={module.moduleName}
							/>
						</div>
					))}

					{isLoading && (
						<div className='flex items-center justify-center sm:hidden'>
							<Icons.spinner className='w-h-8 text-primary h-8 animate-spin' />
						</div>
					)}

					<DialogFooter className='flex justify-between gap-4'>
						{isLoading && (
							<div className='text-muted-foreground flex flex-1 animate-pulse items-center gap-1 max-sm:hidden'>
								<Icons.spinner className='text-muted-foreground size-4 animate-spin' />
								<p className='text-sm'>Atualizando...</p>
							</div>
						)}
						<Button disabled={isSending} onClick={() => saveModules(empresa.id, modules)}>
							{isSending ? 'Salvando...' : 'Salvar'}
							{isSending && <Icons.spinner className='h-4 w-4 animate-spin' />}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
