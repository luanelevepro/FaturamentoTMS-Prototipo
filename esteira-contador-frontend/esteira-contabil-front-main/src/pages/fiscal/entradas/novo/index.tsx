import Head from 'next/head';
import type React from 'react';
import SystemLayout from '@/components/layout/system-layout';
import { NFSEForm } from '@/components/general/fiscal/entradas/documento/nfse-form';

// TODO: Cadastro de fornecedor como alternativa ao prestador de serviço
// TODO: Retenções federais: deixar aberto para o usuário preencher se tiver somente 1 serviço

export default function FiscalNovoDocumentoPage() {
	return (
		<>
			<Head>
				<title>Novo documento fiscal | Esteira</title>
			</Head>
			<SystemLayout className='bg-muted/40 grid items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6'>
				<div className='flex items-center'>
					<div className='space-y-0.5'>
						<h2 className='text-2xl font-bold tracking-tight'>Novo documento fiscal</h2>
						<p className='text-muted-foreground'>Preencha as informações para criar um novo documento.</p>
					</div>
				</div>
				<NFSEForm />
			</SystemLayout>
		</>
	);
}
