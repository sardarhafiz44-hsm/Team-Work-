// SolShield Pro - Tamper-proof report export
// Page 1 : Executive Summary (score, KPIs, severity donut, QR verify)
// Page 2+ : Developer Breakdown (findings + per-finding & document hashing)
//
// Integrity model (SHA-256):
// SOURCE HASH - hash of the exact audited contract bytes
// INTEGRITY HASH - hash of the canonical findings payload
// FINDING HASH - per-finding hash (severity|title|lines|description)
// Re-hashing the source must reproduce the printed source hash; a QR code
// carries the integrity hash to SolShield's Verify Report page.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
const NAVY = [13, 33, 55];
const CANVAS = [10, 22, 40];
const CYAN = [0, 212, 255];
const MUTED = [124, 146, 173];
const SEV_RGB = {
 Critical: [255, 59, 92], High: [255, 138, 61],
 Medium: [245, 196, 81], Low: [0, 212, 255],
};
const VERIFY_BASE = 'https://solshield.pro/verify';
async function sha256Hex(input) {
 const bytes = new TextEncoder().encode(input);
 const digest = await crypto.subtle.digest('SHA-256', bytes);
 return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function canonicalPayload(data) {
 const vulns = (data.ai_result?.vulnerabilities || [])
 .map((v) => ({ title: v.title, severity: v.severity, lines: v.affected_lines || [], description: v.description }))
 .sort((a, b) => a.title.localeCompare(b.title));
 return JSON.stringify({ score: data.ai_result?.risk_score ?? 0, vulns });
}
function findingFingerprint(v) {
 return `${v.severity}|${v.title}|${(v.affected_lines || []).join(',')}|${v.description || ''}`;
}
// Severity donut rendered to an offscreen canvas, returned as a PNG dataURL.
function renderSeverityDonut(counts) {
 const size = 360, cx = size / 2, cy = size / 2, R = 150, r = 92;
 const canvas = document.createElement('canvas');
 canvas.width = size; canvas.height = size;
 const ctx = canvas.getContext('2d');
 const entries = Object.entries(counts).filter(([, n]) => n > 0);
 const total = entries.reduce((s, [, n]) => s + n, 0);
 if (total === 0) {
 ctx.fillStyle = '#2ED47A';
 ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
 } else {
 let start = -Math.PI / 2;
 entries.forEach(([sev, n]) => {
 const slice = (n / total) * Math.PI * 2;
 const [rr, gg, bb] = SEV_RGB[sev] || [120, 120, 120];
 ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
 ctx.beginPath(); ctx.moveTo(cx, cy);
 ctx.arc(cx, cy, R, start, start + slice); ctx.closePath(); ctx.fill();
 start += slice;
 });
 }
 // Punch the donut hole (transparent on any background)
 ctx.globalCompositeOperation = 'destination-out';
 ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
 return canvas.toDataURL('image/png');
}
export async function exportAuditReport(data, code, filename = 'contract.sol', opts = {}) {
 const verifyBase = opts.verifyBase || VERIFY_BASE;
 const doc = new jsPDF({ unit: 'pt', format: 'a4' });
 const W = doc.internal.pageSize.getWidth();
 const H = doc.internal.pageSize.getHeight();
 const M = 40;
 const vulns = data.ai_result?.vulnerabilities || [];
 const score = data.ai_result?.risk_score ?? 0;
 const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
 const sourceHash = await sha256Hex(code || '');
 const integrityHash = await sha256Hex(canonicalPayload(data));
 const findingHashes = await Promise.all(vulns.map((v) => sha256Hex(findingFingerprint(v))));
 const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
 vulns.forEach((v) => { if (counts[v.severity] !== undefined) counts[v.severity]++; });
 const verifyUrl = `${verifyBase}?h=${integrityHash}`;
 const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240, color: { dark: '#0D2137', light: '#FFFFFF' } });
 const donutDataUrl = renderSeverityDonut(counts);
 const drawHeader = (subtitle) => {
 doc.setFillColor(...CANVAS); doc.rect(0, 0, W, 70, 'F');
 doc.setFillColor(...CYAN); doc.rect(0, 70, W, 2, 'F');
 doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(18);
 doc.text('SolShield Pro', M, 34);
 doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...CYAN);
 doc.text(subtitle, M, 52);
 doc.setTextColor(...MUTED).setFontSize(8);
 doc.text('CONFIDENTIAL', W - M, 34, { align: 'right' });
 };
 // ===================== PAGE 1 — EXECUTIVE SUMMARY =====================
 drawHeader('Executive Summary');
 let y = 100;
 doc.setTextColor(40, 40, 40).setFont('helvetica', 'bold').setFontSize(13);
 doc.text('Security Posture at a Glance', M, y);
 doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED);
 doc.text(`${filename} · ${generatedAt}`, M, y + 14);
 y += 36;
 // Score chip
 const sv = score >= 90 ? [46, 212, 122] : score >= 50 ? [245, 196, 81] : [255, 59, 92];
 doc.setFillColor(...sv); doc.roundedRect(M, y, 170, 64, 5, 5, 'F');
 doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(30);
 doc.text(`${score}`, M + 16, y + 42);
 doc.setFontSize(10).text('/100', M + 16 + doc.getTextWidth(`${score}`) + 4, y + 42);
 doc.setFontSize(9).setFont('helvetica', 'normal');
 doc.text('RISK SCORE', M + 100, y + 26);
 doc.setFont('helvetica', 'bold');
 doc.text(score >= 90 ? 'SECURE' : score >= 50 ? 'REVIEW' : 'VULNERABLE', M + 100, y + 40);
 // KPI mini-cards
 const kpis = [
 ['Total Findings', `${vulns.length}`],
 ['Critical', `${counts.Critical}`],
 ['High', `${counts.High}`],
 ['Medium / Low', `${counts.Medium + counts.Low}`],
 ];
 const kpiX = M + 190, kpiW = (W - M - kpiX - 10) / 2;
 kpis.forEach(([label, val], i) => {
 const col = i % 2, row = Math.floor(i / 2);
 const x = kpiX + col * (kpiW + 10), ky = y + row * 34;
 doc.setDrawColor(220, 224, 230); doc.setFillColor(248, 250, 252);
 doc.roundedRect(x, ky, kpiW, 28, 3, 3, 'FD');
 doc.setTextColor(...MUTED).setFont('helvetica', 'normal').setFontSize(7.5);
 doc.text(label.toUpperCase(), x + 8, ky + 11);
 doc.setTextColor(40, 40, 40).setFont('helvetica', 'bold').setFontSize(13);
 doc.text(val, x + 8, ky + 23);
 });
 y += 96;
 // Donut + legend
 doc.setTextColor(40, 40, 40).setFont('helvetica', 'bold').setFontSize(11);
 doc.text('Severity Distribution', M, y);
 doc.addImage(donutDataUrl, 'PNG', M, y + 10, 150, 150);
 let ly = y + 30;
 const legend = vulns.length
 ? Object.entries(counts).filter(([, n]) => n > 0)
 : [['No findings', 1]];
 legend.forEach(([sev, n]) => {
 const [rr, gg, bb] = SEV_RGB[sev] || [46, 212, 122];
 doc.setFillColor(rr, gg, bb); doc.circle(M + 175, ly - 3, 4, 'F');
 doc.setTextColor(60, 60, 60).setFont('helvetica', 'normal').setFontSize(10);
 doc.text(`${sev}${vulns.length ? ` — ${n}` : ''}`, M + 188, ly);
 ly += 20;
 });
 // QR verification block (right column)
 const qrX = W - M - 150;
 doc.setDrawColor(...CYAN); doc.setFillColor(248, 250, 252);
 doc.roundedRect(qrX, y + 4, 150, 168, 5, 5, 'FD');
 doc.addImage(qrDataUrl, 'PNG', qrX + 27, y + 16, 96, 96);
 doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(9);
 doc.text('VERIFY THIS REPORT', qrX + 75, y + 128, { align: 'center' });
 doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
 doc.text('Scan to validate the integrity', qrX + 75, y + 140, { align: 'center' });
 doc.text('hash against SolShield Pro.', qrX + 75, y + 150, { align: 'center' });
 doc.setFont('courier', 'normal').setFontSize(6.5).setTextColor(90, 90, 90);
 doc.text(integrityHash.slice(0, 24) + '…', qrX + 75, y + 162, { align: 'center' });
 // ===================== PAGE 2 — DEVELOPER BREAKDOWN =====================
 doc.addPage();
 drawHeader('Technical Breakdown');
 y = 100;
 doc.setTextColor(40, 40, 40).setFont('helvetica', 'bold').setFontSize(13);
 doc.text('Detailed Findings & Remediation', M, y);
 y += 12;
 if (vulns.length) {
 autoTable(doc, {
 startY: y,
 head: [['Severity', 'Finding', 'Lines', 'Remediation', 'Finding Hash']],
 body: vulns.map((v, i) => [
 v.severity, v.title,
 (v.affected_lines || []).join(', ') || '—',
 v.remediation || 'Manual review required',
 findingHashes[i].slice(0, 12) + '…',
 ]),
 styles: { fontSize: 8, cellPadding: 4, valign: 'top', textColor: [50, 50, 50] },
 headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
 columnStyles: {
 0: { cellWidth: 52 }, 1: { cellWidth: 110 }, 2: { cellWidth: 42 },
 4: { cellWidth: 78, font: 'courier', fontSize: 7 },
 },
 didParseCell: (hook) => {
 if (hook.section === 'body' && hook.column.index === 0) {
 const rgb = SEV_RGB[hook.cell.raw];
 if (rgb) { hook.cell.styles.textColor = rgb; hook.cell.styles.fontStyle = 'bold'; }
 }
 },
 });
 y = doc.lastAutoTable.finalY + 20;
 } else {
 doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(46, 160, 100);
 doc.text('No known vulnerabilities detected.', M, y + 18);
 y += 38;
 }
 // Document integrity block
 if (y > H - 150) { doc.addPage(); drawHeader('Technical Breakdown'); y = 100; }
 doc.setFillColor(245, 247, 250); doc.setDrawColor(...CYAN);
 doc.roundedRect(M, y, W - 2 * M, 96, 4, 4, 'FD');
 doc.setTextColor(...NAVY).setFont('helvetica', 'bold').setFontSize(9);
 doc.text('DOCUMENT INTEGRITY (SHA-256)', M + 12, y + 18);
 doc.setFont('courier', 'normal').setFontSize(7).setTextColor(70, 70, 70);
 doc.text(`Source hash: ${sourceHash}`, M + 12, y + 38);
 doc.text(`Integrity hash: ${integrityHash}`, M + 12, y + 52);
 doc.setFont('helvetica', 'italic').setFontSize(7).setTextColor(...MUTED);
 doc.text('Verify: SHA-256 of the audited contract must equal the source hash above. Per-finding hashes',
 M + 12, y + 72, { maxWidth: W - 2 * M - 24 });
 doc.text('detect tampering of any individual result. Any mismatch invalidates the report.',
 M + 12, y + 84, { maxWidth: W - 2 * M - 24 });
 // ===================== FOOTERS =====================
 const pages = doc.internal.getNumberOfPages();
 for (let p = 1; p <= pages; p++) {
 doc.setPage(p);
 doc.setDrawColor(220, 224, 230).line(M, H - 30, W - M, H - 30);
 doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
 doc.text('CONFIDENTIAL · SolShield Pro', M, H - 18);
 doc.text(`Page ${p} of ${pages}`, W - M, H - 18, { align: 'right' });
 doc.text(integrityHash.slice(0, 16), W / 2, H - 18, { align: 'center' });
 }
 doc.save(`SolShield_Audit_${filename.replace(/\.[^.]+$/, '')}.pdf`);
}