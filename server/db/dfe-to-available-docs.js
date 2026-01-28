/**
 * Extrai documentos (NF-e/CT-e) do export `fis_documento_dfe_*.xml` para alimentar `available_documents`.
 *
 * Estratégia (alinhada com a UI atual do protótipo):
 * - NF-e "a emitir": TOMAZI aparece como transportador ou em autXML -> cria AvailableDocument type='NF'
 * - CT-e "emitidos": TOMAZI é emitente -> cria AvailableDocument type='CTe'
 * - Linkagem: se um CT-e emitido referencia uma NF-e (chave 44 dígitos), setamos `linkedCteNumber` na NF.
 * - CT-e "subcontratados": TOMAZI aparece como subcontratada -> cria AvailableDocument type='CTe' com `isSubcontracted = true`
 *   (o campo `number` deve conter apenas o número do CT-e).
 *
 * Observação: esse export reduzido nem sempre contém as NF-es referenciadas pelos CT-es; ainda assim,
 * a UI já funciona bem com o pool de documentos e o vínculo via `linkedCteNumber` quando possível.
 */
import fs from 'fs';
import readline from 'readline';

function normalizeDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function safeArray(v) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

function deepGet(obj, pathArr) {
  let cur = obj;
  for (const key of pathArr) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function tryParseJson(s) {
  if (!s) return null;
  const trimmed = String(s).trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function isPlausibleKey44(key) {
  if (!/^\d{44}$/.test(key)) return false;
  if (/^(\d)\1{43}$/.test(key)) return false;
  const uf = Number(key.slice(0, 2));
  if (!Number.isFinite(uf) || uf < 11 || uf > 53) return false;
  return true;
}

function extractFieldsFromRecordXml(recordXml) {
  const fields = {};
  const innerMatch = recordXml.match(/<DATA_RECORD>([\s\S]*?)<\/DATA_RECORD>/);
  const inner = innerMatch ? innerMatch[1] : recordXml;
  const fieldRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = fieldRegex.exec(inner)) !== null) {
    const [, name, value] = m;
    fields[name] = (value ?? '').trim();
  }
  return fields;
}

function toDateOnly(value) {
  // entrada comum: "2025-12-29 21:58:50.000"
  const s = String(value || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function simpleHash36(s) {
  // hash simples e determinístico (não criptográfico)
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const n = Math.abs(h >>> 0);
  return n.toString(36).padStart(6, '0').slice(0, 6);
}

function jsonHasAutXmlCnpj(docJson, targetCnpjDigits) {
  const stack = [docJson];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (Array.isArray(node)) {
      for (const it of node) stack.push(it);
      continue;
    }
    if (typeof node !== 'object') continue;

    if (Object.prototype.hasOwnProperty.call(node, 'autXML')) {
      const items = safeArray(node.autXML);
      for (const it of items) {
        if (it && typeof it === 'object') {
          const cnpjs = safeArray(it.CNPJ).map(normalizeDigits);
          if (cnpjs.includes(targetCnpjDigits)) return true;
        }
      }
    }
    for (const k of Object.keys(node)) stack.push(node[k]);
  }
  return false;
}

function extractNfeKey(docJson) {
  const chFromProt = normalizeDigits(
    deepGet(docJson, ['nfeProc', 'protNFe', 0, 'infProt', 0, 'chNFe', 0])
  );
  if (chFromProt && chFromProt.length === 44) return chFromProt;
  const id = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, '$', 'Id']);
  if (typeof id === 'string') {
    const m = id.match(/^NFe(\d{44})$/);
    if (m) return m[1];
  }
  return null;
}

function extractCteKey(docJson) {
  const id = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, '$', 'Id']);
  if (typeof id === 'string') {
    const m = id.match(/^CTe(\d{44})$/);
    if (m) return m[1];
  }
  return null;
}

function collectKeys44FromJson(node, outSet) {
  if (!node) return;
  if (typeof node === 'string') {
    const pref = node.match(/\b(?:NFe|CTe)(\d{44})\b/);
    if (pref && isPlausibleKey44(pref[1])) outSet.add(pref[1]);
    const m = node.match(/\b(\d{44})\b/);
    if (m && isPlausibleKey44(m[1])) outSet.add(m[1]);
    return;
  }
  if (typeof node === 'number' || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    for (const it of node) collectKeys44FromJson(it, outSet);
    return;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) collectKeys44FromJson(node[k], outSet);
  }
}

function parseNumber(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function extractNfeNumber(docJson) {
  const nNF = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'ide', 0, 'nNF', 0]);
  if (nNF != null) return String(nNF);
  return null;
}

function extractNfeValue(docJson) {
  const vNF = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'total', 0, 'ICMSTot', 0, 'vNF', 0]);
  return parseNumber(vNF) ?? 0;
}

function extractNfeWeight(docJson) {
  // transp.vol[].pesoB ou pesoL
  const pesoB = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'transp', 0, 'vol', 0, 'pesoB', 0]);
  const pesoL = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'transp', 0, 'vol', 0, 'pesoL', 0]);
  return parseNumber(pesoB) ?? parseNumber(pesoL) ?? 0;
}

function extractNfeDest(docJson) {
  const dest = deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'dest', 0]) || {};
  const end = dest.enderDest?.[0] || {};
  const xNome = dest.xNome?.[0] ?? null;
  const xMun = end.xMun?.[0] ?? null;
  const UF = end.UF?.[0] ?? null;
  const xLgr = end.xLgr?.[0] ?? null;
  const nro = end.nro?.[0] ?? null;
  const xBairro = end.xBairro?.[0] ?? null;

  return {
    recipientName: xNome || 'Destinatário',
    destinationCity: xMun && UF ? `${xMun}-${UF}` : (xMun || UF || 'Destino'),
    destinationAddress: [xLgr, nro, xBairro].filter(Boolean).join(', ') || 'Endereço não informado'
  };
}

function extractNfeTransportadorCnpj(docJson) {
  const cnpj = normalizeDigits(
    deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'transp', 0, 'transporta', 0, 'CNPJ', 0])
  );
  return cnpj && cnpj.length === 14 ? cnpj : null;
}

function extractCteNumber(docJson) {
  const nCT = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'ide', 0, 'nCT', 0]);
  if (nCT != null) return String(nCT);
  return null;
}

function extractCteEmitCnpj(docJson) {
  const cnpj = normalizeDigits(deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'emit', 0, 'CNPJ', 0]));
  return cnpj && cnpj.length === 14 ? cnpj : null;
}

function extractCteValue(docJson) {
  const vTPrest =
    deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'vPrest', 0, 'vTPrest', 0]) ??
    deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'vPrest', 0, 'vRec', 0]);
  return parseNumber(vTPrest) ?? 0;
}

function extractCteWeight(docJson) {
  // Heurística: tenta infCarga.infQ[].qCarga, senão 0
  const infQ = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'infCarga', 0, 'infQ']);
  const items = safeArray(infQ);
  for (const it of items) {
    const q = parseNumber(it?.qCarga?.[0]);
    if (q != null) return q;
  }
  return 0;
}

function extractCteDest(docJson) {
  const ide = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'ide', 0]) || {};
  const xMunFim = ide.xMunFim?.[0] ?? null;
  const UFFim = ide.UFFim?.[0] ?? null;
  const destinationCity = xMunFim && UFFim ? `${xMunFim}-${UFFim}` : (xMunFim || UFFim || 'Destino');

  const dest = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'dest', 0]) || {};
  const xNome = dest.xNome?.[0] ?? null;
  const end = dest.enderDest?.[0] || {};
  const xLgr = end.xLgr?.[0] ?? null;
  const nro = end.nro?.[0] ?? null;
  const xBairro = end.xBairro?.[0] ?? null;
  const destinationAddress = [xLgr, nro, xBairro].filter(Boolean).join(', ') || 'Endereço não informado';

  return {
    recipientName: xNome || 'Destinatário',
    destinationCity,
    destinationAddress
  };
}

/**
 * @returns {Promise<{ docs: any[], stats: any }>}
 */
export async function extractTomaziAvailableDocs({
  filePath,
  targetCnpj,
  maxNfe = 1500,
  maxCte = 800,
  maxCteSub = 300
}) {
  const TARGET = normalizeDigits(targetCnpj);
  if (!TARGET || TARGET.length !== 14) throw new Error(`CNPJ inválido: ${targetCnpj}`);

  const rs = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  let inRecord = false;
  let buf = '';

  const ctes = [];
  const ctesSub = [];
  const nfes = [];

  // Map para linkar NF-e pela chave -> número do CT-e emitido
  const nfKeyToCteNumber = new Map();

  const stats = {
    records: 0,
    nfeSeen: 0,
    cteSeen: 0,
    nfTomaziCandidate: 0,
    cteTomaziEmit: 0,
    cteTomaziSub: 0,
    linksCreated: 0
  };

  function finalizeRecord(recordXml) {
    stats.records++;
    const f = extractFieldsFromRecordXml(recordXml);
    const tipo = (f.ds_tipo || '').trim();
    const dt = toDateOnly(f.dt_emissao);
    // Não preencher control_number nesta fase (o sistema fará depois)
    const control = null;

    const emitField = normalizeDigits(f.ds_documento_emitente);
    const transpField = normalizeDigits(f.ds_documento_transportador);
    const subcField = normalizeDigits(f.ds_documento_subcontratada);

    const json = tryParseJson(f.ds_raw);
    if (!json) return;

    if (tipo === 'CTE') {
      stats.cteSeen++;
      const cteKey = extractCteKey(json);
      const cteNumber = extractCteNumber(json);
      const emitCnpj = extractCteEmitCnpj(json);
      const isEmitido = (emitField === TARGET) || (emitCnpj === TARGET);
      const isSub = subcField === TARGET;

      if (!cteKey || !isPlausibleKey44(cteKey)) {
        // Ainda dá pra usar sem chave, mas a UI valoriza `dfeKey`; vamos manter.
      }

      if (isEmitido) {
        if (!cteNumber) return;
        stats.cteTomaziEmit++;
        const dest = extractCteDest(json);
        const value = extractCteValue(json);
        const weight = extractCteWeight(json);

        // chaves referenciadas (para linkar NF-e)
        const refs = new Set();
        collectKeys44FromJson(json, refs);
        if (cteKey) refs.delete(cteKey);
        const related = Array.from(refs);

        if (cteNumber) {
          for (const k of related) nfKeyToCteNumber.set(k, cteNumber);
        }

        ctes.push({
          kind: 'CTE_EMITIDO',
          number: cteNumber,
          type: 'CTe',
          controlNumber: control,
          linkedCteNumber: null,
          dfeKey: cteKey || null,
          relatedDfeKeys: related.length ? related : null,
          isSubcontracted: false,
          value,
          weight,
          recipientName: dest.recipientName,
          destinationCity: dest.destinationCity,
          destinationAddress: dest.destinationAddress,
          emissionDate: dt || '2026-01-01'
        });
      } else if (isSub) {
        if (!cteNumber) return;
        stats.cteTomaziSub++;
        const dest = extractCteDest(json);
        const value = extractCteValue(json);
        const weight = extractCteWeight(json);

        ctesSub.push({
          kind: 'CTE_SUBCONTRATADO',
          number: cteNumber,
          type: 'CTe',
          controlNumber: control,
          linkedCteNumber: null,
          dfeKey: cteKey || null,
          relatedDfeKeys: null,
          isSubcontracted: true,
          value,
          weight,
          recipientName: dest.recipientName,
          destinationCity: dest.destinationCity,
          destinationAddress: dest.destinationAddress,
          emissionDate: dt || '2026-01-01'
        });
      }

      return;
    }

    if (tipo === 'NFE') {
      stats.nfeSeen++;
      const nfeKey = extractNfeKey(json);
      const transportCnpj = extractNfeTransportadorCnpj(json);
      const matchTransport = transpField === TARGET || transportCnpj === TARGET;
      const matchAutXml = jsonHasAutXmlCnpj(json, TARGET);

      if (!matchTransport && !matchAutXml) return;
      stats.nfTomaziCandidate++;

      const dest = extractNfeDest(json);
      const value = extractNfeValue(json);
      const weight = extractNfeWeight(json);
      const nfeNumber = extractNfeNumber(json);
      if (!nfeNumber) return;

      const linked = nfeKey && nfKeyToCteNumber.get(nfeKey) ? nfKeyToCteNumber.get(nfeKey) : null;
      if (linked) stats.linksCreated++;

      nfes.push({
        kind: matchAutXml ? 'NFE_AUTXML' : 'NFE_TRANSPORTADOR',
        number: String(nfeNumber),
        type: 'NF',
        controlNumber: null,
        linkedCteNumber: linked,
        dfeKey: nfeKey || null,
        relatedDfeKeys: null,
        isSubcontracted: false,
        value,
        weight,
        recipientName: dest.recipientName,
        destinationCity: dest.destinationCity,
        destinationAddress: dest.destinationAddress,
        emissionDate: dt || '2026-01-01'
      });
    }
  }

  for await (const line of rl) {
    if (!inRecord) {
      if (line.includes('<DATA_RECORD>')) {
        inRecord = true;
        buf = line + '\n';
      }
      continue;
    }
    buf += line + '\n';
    if (line.includes('</DATA_RECORD>')) {
      finalizeRecord(buf);
      buf = '';
      inRecord = false;
    }
  }
  if (inRecord && buf) finalizeRecord(buf);

  // Ordenar por data desc (mais recente primeiro)
  const byDateDesc = (a, b) => String(b.emissionDate).localeCompare(String(a.emissionDate));
  ctes.sort(byDateDesc);
  ctesSub.sort(byDateDesc);
  nfes.sort(byDateDesc);

  const limited = [
    ...ctes.slice(0, maxCte),
    ...ctesSub.slice(0, maxCteSub),
    ...nfes.slice(0, maxNfe)
  ].sort(byDateDesc);

  return { docs: limited, stats };
}

