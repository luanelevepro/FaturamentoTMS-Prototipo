/**
 * Analisador do export `fis_documento_dfe_*.xml` focado em um CNPJ.
 *
 * Objetivo: detectar apenas os documentos em que o CNPJ alvo aparece como:
 * - emitente (campo ds_documento_emitente e/ou dentro do XML do CT-e)
 * - subcontratada (campo ds_documento_subcontratada)
 * - transportador (campo ds_documento_transportador e/ou dentro do XML da NF-e)
 * - autorizado no XML (tag autXML da NF-e)
 *
 * Saídas:
 * - analysis/tomazi_dfe_report.json (resumo + listas)
 * - analysis/tomazi_dfe_report.md   (resumo legível)
 *
 * Uso:
 *   node server/db/analyze-tomazi-dfe.js
 *
 * Variáveis (opcionais):
 *   DFE_FILE: caminho do XML (default: external_data/fis_documento_dfe_202601272318_reduced.xml)
 *   TARGET_CNPJ: CNPJ alvo (default: 04896658000184)
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ROOT = process.cwd();
const DEFAULT_FILE = path.join(
  ROOT,
  'external_data',
  'fis_documento_dfe_202601272318_reduced.xml'
);

const INPUT_FILE = process.env.DFE_FILE || DEFAULT_FILE;
const TARGET_CNPJ = (process.env.TARGET_CNPJ || '04896658000184').replace(/\D/g, '');

const OUT_DIR = path.join(ROOT, 'analysis');
const OUT_JSON = path.join(OUT_DIR, 'tomazi_dfe_report.json');
const OUT_MD = path.join(OUT_DIR, 'tomazi_dfe_report.md');

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

function extractFieldsFromRecordXml(recordXml) {
  // Parser simplificado: tags planas *dentro* de <DATA_RECORD>
  // Importante: não aplicar fieldRegex diretamente no XML com <DATA_RECORD>...
  // senão o primeiro match "DATA_RECORD" engole todo o conteúdo.
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

function tryParseJson(s) {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function isPlausibleKey44(key) {
  if (!/^\d{44}$/.test(key)) return false;
  // evita placeholders óbvios (ex: 9999..., 0000..., dígito repetido)
  if (/^(\d)\1{43}$/.test(key)) return false;
  const uf = Number(key.slice(0, 2));
  if (!Number.isFinite(uf) || uf < 11 || uf > 53) return false;
  return true;
}

function collect44DigitKeysFromJson(node, outSet) {
  if (!node) return;
  if (typeof node === 'string') {
    // chaves podem vir como "NFe" + 44 ou "CTe" + 44
    const pref = node.match(/\b(?:NFe|CTe)(\d{44})\b/);
    if (pref && isPlausibleKey44(pref[1])) outSet.add(pref[1]);
    const m = node.match(/\b(\d{44})\b/);
    if (m && isPlausibleKey44(m[1])) outSet.add(m[1]);
    return;
  }
  if (typeof node === 'number' || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    for (const item of node) collect44DigitKeysFromJson(item, outSet);
    return;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) collect44DigitKeysFromJson(node[k], outSet);
  }
}

function jsonHasAutXmlCnpj(docJson, targetCnpjDigits) {
  // Procura por chave "autXML" em qualquer nível
  const stack = [{ node: docJson, path: [] }];
  while (stack.length) {
    const { node } = stack.pop();
    if (!node) continue;
    if (Array.isArray(node)) {
      for (const item of node) stack.push({ node: item });
      continue;
    }
    if (typeof node !== 'object') continue;

    if (Object.prototype.hasOwnProperty.call(node, 'autXML')) {
      const aut = node.autXML;
      const items = safeArray(aut);
      for (const it of items) {
        if (it && typeof it === 'object') {
          const cnpjs = safeArray(it.CNPJ).map(normalizeDigits);
          if (cnpjs.includes(targetCnpjDigits)) return true;
        }
      }
    }

    for (const k of Object.keys(node)) stack.push({ node: node[k] });
  }
  return false;
}

function jsonHasTransportadorCnpj(docJson, targetCnpjDigits) {
  // Para NF-e normalmente fica em transp.transporta.CNPJ (ou variações).
  // Aqui fazemos uma busca heurística: ao encontrar objetos "transporta"/"transportador",
  // checar CNPJ/CPF dentro deles.
  const stack = [{ node: docJson, hint: '' }];
  while (stack.length) {
    const { node, hint } = stack.pop();
    if (!node) continue;
    if (Array.isArray(node)) {
      for (const item of node) stack.push({ node: item, hint });
      continue;
    }
    if (typeof node !== 'object') continue;

    for (const k of Object.keys(node)) {
      const v = node[k];
      const nextHint = /transporta|transportador/i.test(k) ? k : hint;

      if (nextHint && v && typeof v === 'object') {
        // tentar capturar CNPJ em campos diretos
        const cnpjs = safeArray(v.CNPJ).map(normalizeDigits);
        if (cnpjs.includes(targetCnpjDigits)) return true;
      }

      // também checar quando o próprio objeto tem CNPJ e estamos no "contexto" transp
      if (hint && k === 'CNPJ') {
        const cnpjs = safeArray(v).map(normalizeDigits);
        if (cnpjs.includes(targetCnpjDigits)) return true;
      }

      stack.push({ node: v, hint: nextHint });
    }
  }
  return false;
}

function extractChaveNFe(docJson) {
  // nfeProc.protNFe.infProt.chNFe ou infNFe.$.Id (prefixo NFe)
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

function extractChaveCTe(docJson) {
  // cteProc.CTe.infCte.$.Id (prefixo CTe)
  const id = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, '$', 'Id']);
  if (typeof id === 'string') {
    const m = id.match(/^CTe(\d{44})$/);
    if (m) return m[1];
  }
  const chFromProt = normalizeDigits(
    deepGet(docJson, ['cteProc', 'protCTe', 0, 'infProt', 0, 'chCTe', 0])
  );
  if (chFromProt && chFromProt.length === 44) return chFromProt;
  return null;
}

function extractCnpjEmitenteFromCTe(docJson) {
  const cnpj = normalizeDigits(deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'emit', 0, 'CNPJ', 0]));
  return cnpj && cnpj.length === 14 ? cnpj : null;
}

function extractCnpjTransportadorFromNFe(docJson) {
  // nfeProc.NFe.infNFe.transp.transporta.CNPJ
  const cnpj = normalizeDigits(
    deepGet(docJson, ['nfeProc', 'NFe', 0, 'infNFe', 0, 'transp', 0, 'transporta', 0, 'CNPJ', 0])
  );
  return cnpj && cnpj.length === 14 ? cnpj : null;
}

function extractBasicCteInfo(docJson) {
  const ide = deepGet(docJson, ['cteProc', 'CTe', 0, 'infCte', 0, 'ide', 0]) || {};
  return {
    nCT: ide.nCT?.[0] ?? null,
    serie: ide.serie?.[0] ?? null,
    dhEmi: ide.dhEmi?.[0] ?? null,
    UFIni: ide.UFIni?.[0] ?? null,
    UFFim: ide.UFFim?.[0] ?? null,
    xMunIni: ide.xMunIni?.[0] ?? null,
    xMunFim: ide.xMunFim?.[0] ?? null
  };
}

async function scanFile({ onlyNfeKeySet } = {}) {
  const counters = {
    recordsTotal: 0,
    byTipoTotal: {},
    relevantTotal: 0,
    byTipoRelevant: {},
    byMatch: {
      emitente_field: 0,
      transportador_field: 0,
      subcontratada_field: 0,
      autXML: 0,
      transportador_json: 0,
      emitente_cte_json: 0
    }
  };

  const relevant = {
    ctesEmitidos: [], // CT-e onde emitente é o alvo
    ctesOutrosVinculos: [], // CT-e onde aparece como subcontratada/transportador/autXML (se aplicável)
    nfesVinculos: [] // NF-e onde aparece como autXML/transportador/emitente
  };

  const referencedKeysFromCtesEmitidos = new Set(); // 44 dígitos

  const rs = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  let inRecord = false;
  let buf = '';

  function finalizeRecord(recordXml) {
    counters.recordsTotal++;

    const f = extractFieldsFromRecordXml(recordXml);
    const tipo = (f.ds_tipo || '').trim() || 'DESCONHECIDO';
    counters.byTipoTotal[tipo] = (counters.byTipoTotal[tipo] || 0) + 1;

    const roles = [];
    const emitField = normalizeDigits(f.ds_documento_emitente);
    const transpField = normalizeDigits(f.ds_documento_transportador);
    const subcField = normalizeDigits(f.ds_documento_subcontratada);

    if (emitField === TARGET_CNPJ) roles.push('emitente_field');
    if (transpField === TARGET_CNPJ) roles.push('transportador_field');
    if (subcField === TARGET_CNPJ) roles.push('subcontratada_field');

    // Se for uma segunda passada e o doc não é uma NF-e referenciada, pular cedo
    if (onlyNfeKeySet && tipo !== 'NFE') return;

    const docJson = tryParseJson(f.ds_raw);
    let matchAutXml = false;
    let matchTransportJson = false;
    let matchEmitCteJson = false;

    let chaveNFe = null;
    let chaveCTe = null;

    if (docJson) {
      if (tipo === 'NFE') {
        chaveNFe = extractChaveNFe(docJson);
        if (onlyNfeKeySet && (!chaveNFe || !onlyNfeKeySet.has(chaveNFe))) return;

        matchAutXml = jsonHasAutXmlCnpj(docJson, TARGET_CNPJ);
        matchTransportJson = jsonHasTransportadorCnpj(docJson, TARGET_CNPJ);
      } else if (tipo === 'CTE') {
        chaveCTe = extractChaveCTe(docJson);
        const emitCnpj = extractCnpjEmitenteFromCTe(docJson);
        matchEmitCteJson = emitCnpj === TARGET_CNPJ;
        // transportador/subcontratada em CT-e varia muito; o campo já vem pronto no record
      } else {
        // Outros tipos (NFSE etc): só usamos os campos do record
        if (onlyNfeKeySet) return;
      }
    } else {
      if (onlyNfeKeySet) return;
    }

    if (matchAutXml) roles.push('autXML');
    if (matchTransportJson) roles.push('transportador_json');
    if (matchEmitCteJson) roles.push('emitente_cte_json');

    if (roles.length === 0) {
      if (onlyNfeKeySet) return;
      return;
    }

    // contabilização de matches (por ocorrência de record, não por múltiplas tags)
    counters.relevantTotal++;
    counters.byTipoRelevant[tipo] = (counters.byTipoRelevant[tipo] || 0) + 1;
    for (const r of new Set(roles)) counters.byMatch[r] = (counters.byMatch[r] || 0) + 1;

    if (tipo === 'CTE') {
      const isEmitido = roles.includes('emitente_field') || roles.includes('emitente_cte_json');
      const basic = docJson ? extractBasicCteInfo(docJson) : {};

      // coletar referências (chaves 44 dígitos)
      const keys = new Set();
      if (docJson) collect44DigitKeysFromJson(docJson, keys);
      if (chaveCTe) keys.delete(chaveCTe); // não contar a própria chave

      if (isEmitido) {
        for (const k of keys) referencedKeysFromCtesEmitidos.add(k);
        relevant.ctesEmitidos.push({
          id_fis_documento: f.id_fis_documento || null,
          dt_emissao: f.dt_emissao || null,
          chCTe: chaveCTe,
          nCT: basic.nCT,
          serie: basic.serie,
          dhEmi: basic.dhEmi,
          rota: {
            UFIni: basic.UFIni,
            xMunIni: basic.xMunIni,
            UFFim: basic.UFFim,
            xMunFim: basic.xMunFim
          },
          vinculos: {
            emitente: emitField || null,
            transportador: transpField || null,
            subcontratada: subcField || null
          },
          matched_by: Array.from(new Set(roles)),
          referenced_keys_44: Array.from(keys)
        });
      } else {
        relevant.ctesOutrosVinculos.push({
          id_fis_documento: f.id_fis_documento || null,
          dt_emissao: f.dt_emissao || null,
          chCTe: chaveCTe,
          nCT: basic.nCT,
          serie: basic.serie,
          dhEmi: basic.dhEmi,
          matched_by: Array.from(new Set(roles)),
          vinculos: {
            emitente: emitField || null,
            transportador: transpField || null,
            subcontratada: subcField || null
          }
        });
      }
      return;
    }

    if (tipo === 'NFE') {
      if (onlyNfeKeySet && (!chaveNFe || !onlyNfeKeySet.has(chaveNFe))) return;
      const transporta = docJson ? extractCnpjTransportadorFromNFe(docJson) : null;
      relevant.nfesVinculos.push({
        id_fis_documento: f.id_fis_documento || null,
        dt_emissao: f.dt_emissao || null,
        chNFe: chaveNFe,
        matched_by: Array.from(new Set(roles)),
        transportador_xml: transporta,
        // campos do "record" (quando disponíveis)
        ds_documento_emitente: emitField || null,
        ds_documento_destinatario: normalizeDigits(f.ds_documento_destinatario) || null
      });
      return;
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
      // processar e limpar
      finalizeRecord(buf);
      buf = '';
      inRecord = false;
    }
  }

  // caso o arquivo termine abruptamente
  if (inRecord && buf) finalizeRecord(buf);

  return { counters, relevant, referencedKeysFromCtesEmitidos };
}

async function scanDocsByKeySet(keySet) {
  // Busca NFE/CTE no arquivo por chave (44d), independente de match TOMAZI.
  const found = new Map(); // key -> summary
  const byTipo = {};

  const rs = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  let inRecord = false;
  let buf = '';

  function finalizeRecord(recordXml) {
    const f = extractFieldsFromRecordXml(recordXml);
    const tipo = (f.ds_tipo || '').trim();
    if (tipo !== 'NFE' && tipo !== 'CTE') return;

    const docJson = tryParseJson(f.ds_raw);
    if (!docJson) return;

    const key = tipo === 'NFE' ? extractChaveNFe(docJson) : extractChaveCTe(docJson);
    if (!key || !keySet.has(key)) return;

    if (!found.has(key)) {
      byTipo[tipo] = (byTipo[tipo] || 0) + 1;
      found.set(key, {
        ds_tipo: tipo,
        chave_44: key,
        dt_emissao: f.dt_emissao || null,
        id_fis_documento: f.id_fis_documento || null,
        ds_documento_emitente: normalizeDigits(f.ds_documento_emitente) || null,
        ds_documento_destinatario: normalizeDigits(f.ds_documento_destinatario) || null,
        ds_documento_transportador: normalizeDigits(f.ds_documento_transportador) || null,
        ds_documento_subcontratada: normalizeDigits(f.ds_documento_subcontratada) || null,
        tomazi_autXML: tipo === 'NFE' ? jsonHasAutXmlCnpj(docJson, TARGET_CNPJ) : false,
        tomazi_transportador_xml: tipo === 'NFE' ? jsonHasTransportadorCnpj(docJson, TARGET_CNPJ) : false,
        tomazi_emitente_cte_xml: tipo === 'CTE' ? extractCnpjEmitenteFromCTe(docJson) === TARGET_CNPJ : false
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

  return {
    meta: {
      referencedKeysTotal: keySet.size,
      foundTotal: found.size,
      foundByTipo: byTipo
    },
    items: Array.from(found.values())
  };
}

function toMarkdownReport({ counters, relevant, referencedNfeDetails }) {
  const lines = [];
  lines.push(`## Relatório de DF-e por CNPJ (TOMAZI)`);
  lines.push('');
  lines.push(`- **Arquivo**: \`${INPUT_FILE}\``);
  lines.push(`- **CNPJ alvo**: \`${TARGET_CNPJ}\``);
  lines.push('');

  lines.push(`## Totais`);
  lines.push('');
  lines.push(`- **Registros (DATA_RECORD) no arquivo**: ${counters.recordsTotal}`);
  lines.push(`- **Registros relevantes (com CNPJ nas regras)**: ${counters.relevantTotal}`);
  lines.push('');

  lines.push(`### Por tipo (total)`);
  for (const [k, v] of Object.entries(counters.byTipoTotal).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push('');

  lines.push(`### Por tipo (relevantes)`);
  for (const [k, v] of Object.entries(counters.byTipoRelevant).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push('');

  lines.push(`### Motivos de match (contagem por record)`);
  for (const [k, v] of Object.entries(counters.byMatch).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push('');

  lines.push(`## CT-e emitidos pela TOMAZI`);
  lines.push('');
  lines.push(`- **Quantidade**: ${relevant.ctesEmitidos.length}`);
  lines.push('');
  lines.push(`> Cada item abaixo inclui a chave do CT-e (quando disponível) e as chaves de 44 dígitos referenciadas (NF-e/CT-e).`);
  lines.push('');

  const sampleCtes = relevant.ctesEmitidos.slice(0, 50);
  for (const c of sampleCtes) {
    lines.push(`- **CT-e**: chCTe=${c.chCTe || '-'} | nCT=${c.nCT || '-'} | série=${c.serie || '-'} | dhEmi=${c.dhEmi || c.dt_emissao || '-'}`);
    lines.push(`  - **Rota**: ${c.rota?.xMunIni || '-'}-${c.rota?.UFIni || '-'} -> ${c.rota?.xMunFim || '-'}-${c.rota?.UFFim || '-'}`);
    lines.push(`  - **Referências (44 dígitos)**: ${c.referenced_keys_44?.length || 0}`);
    if (c.referenced_keys_44?.length) {
      lines.push(`    - ${c.referenced_keys_44.slice(0, 10).join(', ')}${c.referenced_keys_44.length > 10 ? ' ...' : ''}`);
    }
  }
  if (relevant.ctesEmitidos.length > sampleCtes.length) {
    lines.push('');
    lines.push(`(Mostrando ${sampleCtes.length} primeiros; veja o JSON para a lista completa.)`);
  }
  lines.push('');

  lines.push(`## Documentos usados na emissão (NF-e/CT-e referenciados pelos CT-e emitidos)`);
  lines.push('');
  lines.push(`- **Chaves únicas referenciadas (44 dígitos)**: ${referencedNfeDetails.meta.referencedKeysTotal}`);
  lines.push(`- **Documentos encontrados no arquivo (pela chave)**: ${referencedNfeDetails.meta.foundTotal}`);
  if (referencedNfeDetails.meta.foundByTipo) {
    for (const [k, v] of Object.entries(referencedNfeDetails.meta.foundByTipo)) {
      lines.push(`  - **${k}**: ${v}`);
    }
  }
  lines.push('');

  const sampleNfes = referencedNfeDetails.items.slice(0, 50);
  for (const n of sampleNfes) {
    lines.push(`- **${n.ds_tipo}**: chave=${n.chave_44} | dt_emissao=${n.dt_emissao || '-'} | emit=${n.ds_documento_emitente || '-'} | dest=${n.ds_documento_destinatario || '-'}`);
    const flags = [];
    if (n.tomazi_autXML) flags.push('autXML');
    if (n.tomazi_transportador_xml) flags.push('transportador_xml');
    if (n.tomazi_emitente_cte_xml) flags.push('emitente_cte_xml');
    if (flags.length) lines.push(`  - **TOMAZI aparece em**: ${flags.join(', ')}`);
  }
  if (referencedNfeDetails.items.length > sampleNfes.length) {
    lines.push('');
    lines.push(`(Mostrando ${sampleNfes.length} primeiros; veja o JSON para a lista completa.)`);
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const t0 = Date.now();
  console.log(`[analyze] Arquivo: ${INPUT_FILE}`);
  console.log(`[analyze] CNPJ alvo: ${TARGET_CNPJ}`);

  // Passo 1: varrer tudo e identificar CT-e emitidos + suas referências
  console.log('[analyze] Passo 1/2: varrendo registros e coletando matches...');
  const pass1 = await scanFile();

  const referencedKeys = pass1.referencedKeysFromCtesEmitidos;
  console.log(`[analyze] CT-e emitidos (match): ${pass1.relevant.ctesEmitidos.length}`);
  console.log(`[analyze] Chaves 44d referenciadas por CT-e emitidos: ${referencedKeys.size}`);

  // Passo 2: buscar documentos do arquivo que estão nas chaves referenciadas
  console.log('[analyze] Passo 2/2: buscando NF-e/CT-e referenciados pelos CT-e emitidos...');
  const referencedNfeDetails = await scanDocsByKeySet(referencedKeys);

  // Montar relatório final
  const report = {
    meta: {
      inputFile: INPUT_FILE,
      targetCnpj: TARGET_CNPJ,
      generatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - t0
    },
    summary: pass1.counters,
    relevant: pass1.relevant,
    referencedKeys44_from_ctes_emitidos: Array.from(referencedKeys),
    referenced_nfe_details: referencedNfeDetails
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(
    OUT_MD,
    toMarkdownReport({ counters: pass1.counters, relevant: pass1.relevant, referencedNfeDetails }),
    'utf8'
  );

  console.log(`[analyze] OK. Relatórios gerados:`);
  console.log(`  - ${OUT_JSON}`);
  console.log(`  - ${OUT_MD}`);
  console.log(`[analyze] Tempo: ${Date.now() - t0}ms`);
}

main().catch((err) => {
  console.error('[analyze] Erro:', err);
  process.exit(1);
});

