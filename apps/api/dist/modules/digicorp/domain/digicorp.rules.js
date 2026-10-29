"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDue = exports.productUrl = void 0;
exports.cleanText = cleanText;
exports.htmlToText = htmlToText;
exports.parseListPage = parseListPage;
exports.parseDetail = parseDetail;
exports.blockedReason = blockedReason;
const crypto_1 = require("crypto");
const productUrl = (sku) => `https://digicorp.com.bo/producto/${encodeURIComponent(sku)}`;
exports.productUrl = productUrl;
function cleanText(value) {
    return String(value ?? '')
        .replace(/^[\s"]+|[\s"]+$/g, '')
        .replace(/\*\s*/g, ' · ')
        .replace(/\s+/g, ' ')
        .replace(/^(\s*·\s*)+|(\s*·\s*)+$/g, '')
        .trim();
}
function htmlToText(html) {
    return String(html ?? '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<\s*(br|\/p|\/tr|\/li|\/h\d)\s*\/?>/gi, '\n')
        .replace(/<\s*\/td\s*>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n')
        .trim();
}
function parseListPage(body) {
    const items = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    return items
        .map((i) => {
        const sku = String(i.codigoProd || i.codigo || '').trim();
        const nombre = cleanText(i.nombre);
        const marca = cleanText(i.marca);
        const imagenUrl = /\.(webp|jpe?g|png)$/i.test(i.urlImagen1 || '') ? i.urlImagen1.trim() : '';
        return { sku, nombre, marca, imagenUrl, hash: (0, crypto_1.createHash)('sha256').update(`${nombre}|${marca}|${imagenUrl}`).digest('hex') };
    })
        .filter((r) => r.sku && r.nombre);
}
function parseDetail(body) {
    const d = (body?.data ?? body);
    const images = [...(d.assets?.imagenes ?? [])].sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));
    const extended = htmlToText(d.assets?.descripcionExtendida);
    return {
        descripcion: extended || cleanText(d.descripcion) || null,
        seccion: cleanText(d.seccion),
        categoriaCodigo: String(d.categoriaCodigo ?? '').trim(),
        stockTotal: typeof d.stockTotal === 'number' ? d.stockTotal : null,
        moneda: d.moneda || 'Bs',
        imagenGrandeUrl: images[0]?.url || '',
        ...(images[0]?.urlSmall ? { imagenUrl: images[0].urlSmall } : {}),
    };
}
function blockedReason(status, contentType) {
    if (status === 403 || status === 429)
        return `Digicorp respondió ${status}: la sincronización se detuvo`;
    if (status >= 200 && status < 300 && !(contentType || '').includes('json'))
        return 'Digicorp respondió con una página en lugar de datos (posible verificación anti-bots): la sincronización se detuvo';
    return null;
}
const syncDue = (lastOk, now) => !lastOk || now.getTime() - lastOk.getTime() > 30 * 86400e3;
exports.syncDue = syncDue;
//# sourceMappingURL=digicorp.rules.js.map