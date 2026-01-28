import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getTipoIntegracao, createTipoIntegracao, TipoIntegracao } from '@/services/api/tipo-integracao';
import { createIntegracao } from '@/services/api/integracao';
import { toast } from 'sonner';
import { useCompanyContext } from '@/context/company-context';

interface Field {
	id: string;
	name: string;
	placeholder: string;
	type: string;
}

export default function IntegrationModal() {
	const [open, setOpen] = useState(false);
	const { state: empresa_id } = useCompanyContext();
	const [dsNome, setDsNome] = useState('');
	const [dsDesc, setDsDesc] = useState('');
	const [idTipoIntegracao, setIdTipoIntegracao] = useState('');
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [isEscritorio, setIsEscritorio] = useState(false);
	const [isSistema, setIsSistema] = useState(false);
	const [fields, setFields] = useState<Field[]>([]);
	const [newTipoOpen, setNewTipoOpen] = useState(false);
	const [newTipoNome, setNewTipoNome] = useState('');
	const [isCreatingTipo, setIsCreatingTipo] = useState(false);
	const [createError, setCreateError] = useState<string>();

	const queryClient = useQueryClient();

	const { data: tipos = [], isFetching: isLoadingTipos } = useQuery<TipoIntegracao[]>({
		queryKey: ['get-integracao-tipos'],
		queryFn: getTipoIntegracao,
	});

	async function handleCreateTipo() {
		try {
			setIsCreatingTipo(true);
			setCreateError(undefined);
			const tipo = await createTipoIntegracao(newTipoNome);
			queryClient.invalidateQueries({ queryKey: ['get-integracao-tipos'] });
			setIdTipoIntegracao(tipo.id);
			setNewTipoOpen(false);
			setNewTipoNome('');
			setPopoverOpen(false);
		} catch (err: unknown) {
			setCreateError(err instanceof Error ? err.message : 'Falha ao criar tipo');
		} finally {
			setIsCreatingTipo(false);
		}
	}

	// drag-and-drop setup
	const sensors = useSensors(useSensor(PointerSensor));
	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setFields((prev) => {
				const oldIndex = prev.findIndex((f) => f.id === active.id);
				const newIndex = prev.findIndex((f) => f.id === over.id);
				return arrayMove(prev, oldIndex, newIndex);
			});
		}
	}

	// manipulação dos campos
	function handleAddField() {
		setFields((prev) => [...prev, { id: crypto.randomUUID(), name: '', placeholder: '', type: 'string' }]);
	}
	function handleFieldChange(id: string, key: keyof Field, value: string) {
		setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
	}
	function handleRemoveField(id: string) {
		setFields((prev) => prev.filter((f) => f.id !== id));
	}

	// salva integração
	async function handleSave() {
		try {
			toast.promise(
				async () => {
					await createIntegracao(dsNome, dsDesc, idTipoIntegracao, isEscritorio, isSistema, fields);
					queryClient.invalidateQueries({ queryKey: ['get-integracao-tipos'] });
					queryClient.invalidateQueries({ queryKey: ['get-integracao', empresa_id] });
				},
				{
					loading: 'Salvando integração...',
					success: () => 'Integração salva com sucesso!',
				},
			);
		} catch (error) {
			console.error('Error salvando integração:', error);
			toast.error('Erro ao salvar integração.');
		} finally {
			setOpen(false);
			setDsNome('');
			setDsDesc('');
			setIdTipoIntegracao('');
			setPopoverOpen(false);
			setIsEscritorio(false);
			setIsSistema(false);
			setFields([]);
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button variant='outline'>
						<Plus className='mr-2 h-4 w-4' />
						Nova Integração
					</Button>
				</DialogTrigger>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>Nova Integração</DialogTitle>
						<DialogDescription>Defina o tipo, nome e campos.</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						{/* Seleção de Tipo */}
						<div className='grid gap-2'>
							<Label>Tipo de Integração</Label>
							<Popover modal open={popoverOpen} onOpenChange={setPopoverOpen}>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										role='combobox'
										aria-expanded={popoverOpen}
										className='w-full justify-between'
										disabled={isLoadingTipos}
									>
										{idTipoIntegracao
											? tipos.find((t) => t.id === idTipoIntegracao)?.ds_nome
											: isLoadingTipos
												? 'Carregando...'
												: 'Selecione um tipo...'}
										<ChevronsUpDown className='ml-2 h-4 w-4 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
									<Command>
										<CommandInput placeholder='Buscar tipo...' />
										<CommandList>
											<CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
											<CommandGroup>
												{tipos.map((t) => (
													<CommandItem
														key={t.id}
														value={t.id}
														onSelect={(val) => {
															setIdTipoIntegracao(val);
															setPopoverOpen(false);
														}}
													>
														{t.ds_nome}
														<Check className={cn('ml-auto', idTipoIntegracao === t.id ? 'opacity-100' : 'opacity-0')} />
													</CommandItem>
												))}
											</CommandGroup>
											<CommandGroup>
												<CommandItem
													value='__new__'
													onSelect={() => {
														setPopoverOpen(false);
														setNewTipoOpen(true);
													}}
												>
													<Plus className='mr-2 h-4 w-4' />
													Novo tipo...
												</CommandItem>
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='dsNome'>Nome</Label>
							<Input id='dsNome' value={dsNome} onChange={(e) => setDsNome(e.target.value)} />
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='dsDesc'>Descrição</Label>
							<Input id='dsDesc' value={dsDesc} onChange={(e) => setDsDesc(e.target.value)} />
						</div>
						<div className='flex items-center space-x-2'>
							<Switch id='isEscritorio' checked={isEscritorio} onCheckedChange={setIsEscritorio} disabled={isSistema} />
							<Label htmlFor='isEscritorio'>Visível apenas no escritório</Label>
						</div>
						<div className='flex items-center space-x-2'>
							<Switch id='isSistema' checked={isSistema} onCheckedChange={setIsSistema} disabled={isEscritorio} />
							<Label htmlFor='isSistema'>Visível apenas no Sistema</Label>
						</div>

						{/* Configuração de campos */}
						<div className='grid gap-2'>
							<Label>Campos de Configuração</Label>
							<div className='flex justify-end'>
								<Button variant='outline' size='sm' onClick={handleAddField}>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
									{fields.map((field) => (
										<SortableField key={field.id} field={field} onChange={handleFieldChange} onRemove={handleRemoveField} />
									))}
								</SortableContext>
							</DndContext>
						</div>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={!idTipoIntegracao || !dsNome || !fields.length || !dsDesc}>
							Salvar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={newTipoOpen} onOpenChange={setNewTipoOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Criar Novo Tipo</DialogTitle>
						<DialogDescription>Informe o nome do novo tipo</DialogDescription>
					</DialogHeader>
					<div className='grid gap-2'>
						<Label htmlFor='newTipoNome'>Nome do Tipo</Label>
						<Input id='newTipoNome' value={newTipoNome} onChange={(e) => setNewTipoNome(e.target.value)} />
						{createError && <p className='text-sm text-red-600'>{createError}</p>}
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setNewTipoOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleCreateTipo} disabled={!newTipoNome || isCreatingTipo}>
							{isCreatingTipo ? 'Criando...' : 'Criar'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function SortableField({
	field,
	onChange,
	onRemove,
}: {
	field: Field;
	onChange: (id: string, key: keyof Field, value: string) => void;
	onRemove: (id: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
	const style = { transform: CSS.Transform.toString(transform), transition };

	return (
		<div ref={setNodeRef} style={style} className='flex items-center gap-2 rounded border p-2'>
			<div {...attributes} {...listeners} className='cursor-move p-1'>
				☰
			</div>
			<Input placeholder='Nome (ex: Host)' value={field.name} onChange={(e) => onChange(field.id, 'name', e.target.value)} />
			<Input placeholder='Placeholder' value={field.placeholder} onChange={(e) => onChange(field.id, 'placeholder', e.target.value)} />
			<select className='rounded border px-2 py-1' value={field.type} onChange={(e) => onChange(field.id, 'type', e.target.value)}>
				{['string', 'password', 'number', 'boolean'].map((t) => (
					<option key={t} value={t}>
						{t}
					</option>
				))}
			</select>
			<Button variant='ghost' size='icon' onClick={() => onRemove(field.id)}>
				<Trash2 className='h-4 w-4' />
			</Button>
		</div>
	);
}
