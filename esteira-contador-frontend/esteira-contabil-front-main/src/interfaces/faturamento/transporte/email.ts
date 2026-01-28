import { IPagination } from '@/interfaces';

export enum ITypesFolderEmail {
	ARQUIVADOS = 'Arquivados',
	ARQUIVO_MORTO = 'Arquivo Morto',
	CAIXA_ENTRADA = 'Caixa de Entrada',
	CAIXA_SAIDA = 'Caixa de Saída',
	EXTRAIDOS = 'Extraídos',
	HISTORICO_CONVERSA = 'Histórico de Conversa',
	ITENS_ENVIADOS = 'Itens Enviados',
	ITENS_EXCLUIDOS = 'Itens Excluídos',
	LIXO_ELETRONICO = 'Lixo Eletrônico',
	NAO_EXTRAIDOS = 'Não extraídos',
}

export interface IEmailParams {
	page?: number;
	take?: number;
	folderName?: ITypesFolderEmail;
}

export interface ITypeEmails {
	success: boolean;
	data: IEmail[];
	pagination: IPagination;
}

export interface IEmail {
	id: string;
	receivedDateTime: Date;
	hasAttachments?: boolean;
	subject: string;
	importance?: string;
	isRead: boolean;
	sender: Sender;
	toRecipients?: Sender[];
	ccRecipients?: Sender[];
	bccRecipients?: Sender[];
}

export interface Sender {
	emailAddress: EmailAddress;
}

export interface EmailAddress {
	name: string;
	address: string;
}
