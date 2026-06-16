/* ==========================================================================
   Graficos SVG simples (sem dependencias) - Acompanhamento de Lancamentos
   ========================================================================== */

const brl = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const numFmt = v => (v || 0).toLocaleString('pt-BR');

const MES_NOMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function mesLabel(m) {
  const partes = m.split('-');
  return MES_NOMES[parseInt(partes[1], 10) - 1] + '/' + partes[0].slice(2);
}

// Linha de evolucao da positivacao acumulada, com linha pontilhada da meta
function progressLineSVG(serie, meta, opts) {
  opts = opts || {};
  const w = opts.width || 320, h = opts.height || 120;
  const padL = 6, padR = 6, padT = 12, padB = 22;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  if (!serie.length) return '';
  const maxClientes = Math.max(meta, ...serie.map(p => p.clientes));
  const maxY = maxClientes * 1.05;
  const n = serie.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const pts = serie.map((p, i) => [padL + i * stepX, padT + innerH - (p.clientes / maxY) * innerH]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const lastX = pts[pts.length - 1][0].toFixed(1);
  const firstX = pts[0][0].toFixed(1);
  const baseY = (padT + innerH).toFixed(1);
  const area = path + ` L${lastX},${baseY} L${firstX},${baseY} Z`;
  const metaY = (padT + innerH - (meta / maxY) * innerH).toFixed(1);
  const atingiu = serie[serie.length - 1].clientes >= meta;
  const corLinha = atingiu ? '#28a745' : '#2B2FA8';
  const lastPt = pts[pts.length - 1];

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="progresschart">
    <line x1="${padL}" y1="${metaY}" x2="${w - padR}" y2="${metaY}" stroke="#f5b942" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="${w - padR}" y="${(parseFloat(metaY) - 4).toFixed(1)}" font-size="9" fill="#a5740a" text-anchor="end" font-family="DM Sans">meta ${meta}</text>
    <path d="${area}" fill="${corLinha}" opacity="0.12"/>
    <path d="${path}" fill="none" stroke="${corLinha}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${lastPt[0].toFixed(1)}" cy="${lastPt[1].toFixed(1)}" r="3.5" fill="${corLinha}"/>
  </svg>`;
}

// Valor abreviado para rotulos (R$ 12k, R$ 1,2 mi)
function brlShort(v) {
  v = v || 0;
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  if (v >= 1000) return 'R$ ' + Math.round(v / 1000) + 'k';
  return 'R$ ' + Math.round(v);
}

// Grafico combinado v2: barras (clientes) + linha (valor) COM rotulos visiveis e
// comparativo opcional com o ano anterior (linha tracejada).
// serie: [{m,c,v,q}] ; opts.prev: [valorAnoAnterior...] alinhado a serie (ou null)
function comboChartSVG2(serie, opts) {
  opts = opts || {};
  const prev = opts.prev || null;
  const w = opts.width || 760, h = opts.height || 300;
  const padL = 46, padR = 46, padT = 30, padB = 42;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  if (!serie.length) return '<p style="color:var(--muted)">Sem dados no período.</p>';
  const maxC = Math.max(...serie.map(m => m.c), 1);
  let maxV = Math.max(...serie.map(m => m.v), 1);
  if (prev) maxV = Math.max(maxV, ...prev.map(x => x || 0), 1);
  const n = serie.length;
  const slot = innerW / n;
  const barW = Math.min(slot * 0.5, 30);
  const yC = c => padT + innerH - (c / maxC) * innerH;
  const yV = v => padT + innerH - (v / maxV) * innerH;
  const cx = i => padL + i * slot + slot / 2;

  let bars = '', barLbl = '', xlbl = '';
  const labelEvery = Math.max(1, Math.ceil(n / 16));
  serie.forEach((m, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const y = yC(m.c), bh = (padT + innerH) - y;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="#2B2FA8" opacity="0.82"><title>${mesLabel(m.m)}: ${m.c} clientes · ${brl(m.v)}</title></rect>`;
    if (m.c > 0) barLbl += `<text x="${cx(i).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="10" font-weight="700" fill="#2B2FA8" text-anchor="middle" font-family="DM Sans">${m.c}</text>`;
    if (i % labelEvery === 0 || i === n - 1) xlbl += `<text x="${cx(i).toFixed(1)}" y="${h - 14}" font-size="10" fill="#6b6f8a" text-anchor="middle" font-family="DM Sans">${mesLabel(m.m)}</text>`;
  });

  // linha valor (atual)
  const pts = serie.map((m, i) => [cx(i), yV(m.v)]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  let vLbl = '', dots = '';
  serie.forEach((m, i) => {
    dots += `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="3" fill="#28a745"><title>${mesLabel(m.m)}: ${brl(m.v)}</title></circle>`;
    if (m.v > 0) vLbl += `<text x="${pts[i][0].toFixed(1)}" y="${(pts[i][1] - 8).toFixed(1)}" font-size="9" font-weight="700" fill="#1d7a35" text-anchor="middle" font-family="DM Sans">${brlShort(m.v)}</text>`;
  });

  // linha valor (ano anterior) - tracejada
  let prevPath = '', prevDots = '';
  if (prev) {
    const pp = serie.map((m, i) => [cx(i), yV(prev[i] || 0)]);
    prevPath = `<path d="${pp.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="#b0863a" stroke-width="2" stroke-dasharray="5 4" opacity="0.9"/>`;
    prevDots = serie.map((m, i) => (prev[i] ? `<circle cx="${pp[i][0].toFixed(1)}" cy="${pp[i][1].toFixed(1)}" r="2.5" fill="#b0863a"><title>${mesLabel(m.m)} (ano ant.): ${brl(prev[i])}</title></circle>` : '')).join('');
  }

  return `<svg viewBox="0 0 ${w} ${h}" class="combo">
    ${bars}${barLbl}
    <path d="${path}" fill="none" stroke="#28a745" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${prevPath}${dots}${prevDots}${vLbl}
    ${xlbl}
    <g font-family="DM Sans" font-size="10" fill="#6b6f8a">
      <text x="${padL}" y="16">clientes (barras) · valor (linha verde)${prev ? ' · ano anterior (tracejado)' : ''}</text>
    </g>
  </svg>`;
}

// Barras de CLIENTES por mes (usado quando o valor mensal nao se aplica - visao por setor)
function clientsBarsSVG(serie, opts) {
  opts = opts || {};
  const w = opts.width || 760, h = opts.height || 300;
  const padL = 30, padR = 20, padT = 30, padB = 42;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  if (!serie.length) return '<p style="color:var(--muted)">Sem dados no período.</p>';
  const maxC = Math.max(...serie.map(m => m.c), 1);
  const n = serie.length, slot = innerW / n;
  const barW = Math.min(slot * 0.55, 34);
  let bars = '', lbls = '', xlbl = '';
  const showLbl = n <= 20;
  serie.forEach((m, i) => {
    const cxc = padL + i * slot + slot / 2;
    const x = cxc - barW / 2;
    const bh = (m.c / maxC) * innerH, y = padT + innerH - bh;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="#2B2FA8" opacity="0.85"><title>${mesLabel(m.m)}: ${m.c} clientes</title></rect>`;
    if (showLbl && m.c > 0) lbls += `<text x="${cxc.toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="10" font-weight="700" fill="#2B2FA8" text-anchor="middle" font-family="DM Sans">${m.c}</text>`;
    xlbl += `<text x="${cxc.toFixed(1)}" y="${h - 14}" font-size="10" fill="#6b6f8a" text-anchor="middle" font-family="DM Sans">${mesLabel(m.m)}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="combo">${bars}${lbls}${xlbl}
    <g font-family="DM Sans" font-size="10" fill="#6b6f8a"><text x="${padL}" y="16">clientes distintos no mês</text></g></svg>`;
}

// Comparativo ano a ano: barras agrupadas de VALOR (atual x mesmo mes do ano anterior)
function comboBarsSVG(serie, prev, opts) {
  opts = opts || {};
  const w = opts.width || 760, h = opts.height || 300;
  const padL = 46, padR = 20, padT = 30, padB = 42;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  if (!serie.length) return '<p style="color:var(--muted)">Sem dados no período.</p>';
  let maxV = 1;
  serie.forEach((m, i) => { maxV = Math.max(maxV, m.v, (prev && prev[i]) || 0); });
  const n = serie.length, slot = innerW / n;
  const gap = Math.min(slot * 0.12, 6);
  const bw = Math.max(4, (slot * 0.72 - gap) / 2);
  const yV = v => padT + innerH - (v / maxV) * innerH;
  const showLbl = n <= 14;
  let bars = '', xlbl = '', lbls = '';
  serie.forEach((m, i) => {
    const cxc = padL + i * slot + slot / 2;
    const x1 = cxc - gap / 2 - bw, x2 = cxc + gap / 2;
    const va = m.v, vp = (prev && prev[i]) || 0;
    const ya = yV(va), yp = yV(vp);
    bars += `<rect x="${x1.toFixed(1)}" y="${ya.toFixed(1)}" width="${bw.toFixed(1)}" height="${(padT + innerH - ya).toFixed(1)}" rx="2.5" fill="#2B2FA8"><title>${mesLabel(m.m)} atual: ${brl(va)}</title></rect>`;
    bars += `<rect x="${x2.toFixed(1)}" y="${yp.toFixed(1)}" width="${bw.toFixed(1)}" height="${(padT + innerH - yp).toFixed(1)}" rx="2.5" fill="#f5b942"><title>${mesLabel(m.m)} ano anterior: ${brl(vp)}</title></rect>`;
    if (showLbl) {
      if (va > 0) lbls += `<text x="${(x1 + bw / 2).toFixed(1)}" y="${(ya - 4).toFixed(1)}" font-size="8.5" font-weight="700" fill="#2B2FA8" text-anchor="middle" font-family="DM Sans">${brlShort(va)}</text>`;
      if (vp > 0) lbls += `<text x="${(x2 + bw / 2).toFixed(1)}" y="${(yp - 4).toFixed(1)}" font-size="8.5" font-weight="700" fill="#a5740a" text-anchor="middle" font-family="DM Sans">${brlShort(vp)}</text>`;
    }
    xlbl += `<text x="${cxc.toFixed(1)}" y="${h - 14}" font-size="10" fill="#6b6f8a" text-anchor="middle" font-family="DM Sans">${mesLabel(m.m)}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="combo">
    ${bars}${lbls}${xlbl}
    <g font-family="DM Sans" font-size="10" fill="#6b6f8a">
      <text x="${padL}" y="16">valor vendido — <tspan fill="#2B2FA8" font-weight="700">azul = ano atual</tspan> · <tspan fill="#a5740a" font-weight="700">dourado = ano anterior</tspan></text>
    </g>
  </svg>`;
}

// Grafico combinado: barras (clientes distintos / positivacao mensal) + linha (valor vendido)
function comboChartSVG(meses, opts) {
  opts = opts || {};
  const w = opts.width || 760, h = opts.height || 280;
  const padL = 50, padR = 50, padT = 20, padB = 34;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  if (!meses.length) return '';
  const maxC = Math.max(...meses.map(m => m.c), 1);
  const maxV = Math.max(...meses.map(m => m.v), 1);
  const n = meses.length;
  const slot = innerW / n;
  const barW = Math.min(slot * 0.55, 34);

  let bars = '';
  let labels = '';
  const labelEvery = Math.max(1, Math.ceil(n / 14));
  meses.forEach((m, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const bh = (m.c / maxC) * innerH;
    const y = padT + innerH - bh;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="#2B2FA8" opacity="0.82"><title>${mesLabel(m.m)}: ${m.c} clientes distintos, ${brl(m.v)}</title></rect>`;
    if (i % labelEvery === 0 || i === n - 1) {
      const lx = padL + i * slot + slot / 2;
      labels += `<text x="${lx.toFixed(1)}" y="${h - 12}" font-size="10" fill="#6b6f8a" text-anchor="middle" font-family="DM Sans">${mesLabel(m.m)}</text>`;
    }
  });

  const linePts = meses.map((m, i) => {
    const x = padL + i * slot + slot / 2;
    const y = padT + innerH - (m.v / maxV) * innerH;
    return [x, y];
  });
  const path = linePts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dots = linePts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#28a745"><title>${mesLabel(meses[i].m)}: ${brl(meses[i].v)}</title></circle>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" class="combo">
    ${bars}
    <path d="${path}" fill="none" stroke="#28a745" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${labels}
    <g font-family="DM Sans" font-size="10" fill="#6b6f8a">
      <text x="${padL}" y="14">clientes distintos (barras)</text>
      <text x="${w - padR}" y="14" text-anchor="end" fill="#28a745">valor vendido (linha)</text>
    </g>
  </svg>`;
}
