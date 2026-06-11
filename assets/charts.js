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
