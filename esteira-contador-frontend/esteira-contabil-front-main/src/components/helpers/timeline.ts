import { format, parseISO, isValid } from 'date-fns';
import type { TimelineItem } from '@/components/ui/timeline';

type Evento = {
	dt_evento?: string;
	dt_created?: string;
	cd_codigo_evento?: string;
	ds_protocolo?: string;
	ds_descricao_evento?: string;
	ds_justificativa_evento?: string;
};

type DocumentoGenerico = {
	js_nfse?: { dt_emissao?: string };
	js_nfe?: { dt_emissao?: string };
	js_cte?: { dt_emissao?: string };
	js_documento_historico?: {
		id?: string;
		ds_status_anterior?: string;
		ds_status_novo?: string;
		ds_motivo?: string;
		dt_created?: string;
		js_profile?: { ds_name?: string } | null;
		ds_name?: string | null;
	}[];
};

function safeDateLabel(raw?: string): { label: string; ts: number } {
	if (!raw) return { label: '—', ts: 0 };
	const d = parseISO(raw);
	if (!isValid(d)) return { label: raw, ts: Date.parse(raw) || 0 };
	return { label: format(d, 'dd/MM/yyyy HH:mm'), ts: d.getTime() };
}

// utilizado apenas para montar os items da timeline a partir dos eventos
export function eventosToTimelineItems(eventos: Evento[] | undefined | null, documento?: DocumentoGenerico): TimelineItem[] {
	const temp: Array<TimelineItem & { _ts: number }> = [];

	// Adicionar evento inicial "Emitido" se houver data de emissão
	if (documento) {
		const dtEmissao = documento.js_nfse?.dt_emissao || documento.js_nfe?.dt_emissao || documento.js_cte?.dt_emissao;
		if (dtEmissao) {
			const { label } = safeDateLabel(dtEmissao);
			temp.push({
				id: 'emitido|' + dtEmissao,
				date: label,
				title: 'Emitido',
				description: 'Documento fiscal emitido',
				status: 'completed',
				_ts: Date.parse(dtEmissao) || 0,
			});
		}

		// Note: histórico de status é tratado por uma função separada `historicoToTimelineItems`
	}

	// Processar eventos tradicionais
	if (eventos?.length) {
		const ordered = [...eventos].sort((a, b) => {
			const ta = Date.parse(a?.dt_evento || a?.dt_created || '') || 0;
			const tb = Date.parse(b?.dt_evento || b?.dt_created || '') || 0;
			return ta - tb;
		});

		ordered.forEach((e, idx) => {
			const raw = e?.dt_evento || e?.dt_created || '';
			const { label } = safeDateLabel(raw);
			const id = (e?.cd_codigo_evento || '') + '|' + (e?.ds_protocolo || '') + '|' + (e?.dt_evento || e?.dt_created || '') + '|' + idx;

			temp.push({
				id,
				date: label,
				title: e?.ds_descricao_evento || e?.cd_codigo_evento || 'Evento',
				description: e?.ds_justificativa_evento || '',
				status: 'completed',
				_ts: Date.parse(raw) || 0,
			});
		});
	}

	// Ordenar por timestamp e retornar sem o campo auxiliar
	temp.sort((a, b) => a._ts - b._ts);

	const result: TimelineItem[] = temp.map((it) => ({
		id: it.id,
		date: it.date,
		title: it.title,
		description: it.description,
		status: it.status,
	}));

	return result;
}

// Gera itens apenas a partir do histórico de status (`js_documento_historico`)
export function historicoToTimelineItems(documento?: DocumentoGenerico): TimelineItem[] {
	if (!documento) return [];
	const temp: Array<TimelineItem & { _ts: number }> = [];

	const history = documento.js_documento_historico || [];
	history.forEach((h) => {
		const raw = h.dt_created || '';
		const { label } = safeDateLabel(raw);
		const user = h.js_profile?.ds_name || h.ds_name || '';

		const prev = h.ds_status_anterior ? h.ds_status_anterior.replace(/_/g, ' ') : '';
		const next = h.ds_status_novo ? h.ds_status_novo.replace(/_/g, ' ') : '';

		const descriptionParts: string[] = [];
		if (prev && next) descriptionParts.push(`De ${prev} para ${next}`);
		if (h.ds_motivo) descriptionParts.push(`Justificativa: ${h.ds_motivo}`);
		if (user) descriptionParts.push(`Usuário: ${user}`);

		temp.push({
			id: `hist|${h.id || raw}`,
			date: label,
			title: h.ds_status_novo ? `${h.ds_status_novo.replace(/_/g, ' ')}` : 'Alteração de Status',
			description: descriptionParts.join(' • '),
			status: 'completed',
			_ts: Date.parse(raw) || 0,
		});
	});

	temp.sort((a, b) => a._ts - b._ts);

	return temp.map((it) => ({ id: it.id, date: it.date, title: it.title, description: it.description, status: it.status }));
}
