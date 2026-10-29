import { blockedReason, cleanText, htmlToText, parseDetail, parseListPage, productUrl, syncDue } from './digicorp.rules';
import { readFileSync } from 'fs';
import { join } from 'path';

// Real answers of Digicorp's public API, saved once (2026-10-27).
const fixture = (name: string) => JSON.parse(readFileSync(join(__dirname, name), 'utf8'));
const list = fixture('fixture-list.json');
const detail = fixture('fixture-detail.json');

describe('Digicorp catalog (DIGI-01)', () => {
  it('reads a page of the public listing (real answer saved as fixture)', () => {
    const rows = parseListPage(list);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ sku: 'RG-ES105D', marca: 'RUIJIE', imagenUrl: expect.stringMatching(/\.webp$/) });
    expect(rows[0].nombre.startsWith('SWITCH REYEE DE 5 PUERTOS · 10/100 MBPS')).toBe(true);
    expect(rows[0].hash).toHaveLength(64);
    expect(parseListPage({ data: [{ codigo: '', nombre: 'x' }] })).toEqual([]);
  });

  it('reads the detail of a product without its price', () => {
    const d = parseDetail(detail);
    expect(d).toMatchObject({ seccion: 'OUTLET', categoriaCodigo: '11010104', stockTotal: 0, moneda: 'Bs', imagenGrandeUrl: expect.stringContaining('/large/') });
    expect(d.descripcion).toBeTruthy();
    expect(d).not.toHaveProperty('precio');
  });

  it('cleans names and descriptions; links to their page; stops when blocked; refreshes monthly', () => {
    expect(cleanText('"CAMARA* DOMO*\n" ')).toBe('CAMARA · DOMO');
    expect(cleanText('*1 PUERTO LAN* 10/100')).toBe('1 PUERTO LAN · 10/100');
    expect(htmlToText('<p>Uno&nbsp;<b>dos</b></p><p>tres</p><script>x</script>')).toBe('Uno dos\ntres');
    expect(productUrl('RG-ES105D')).toBe('https://digicorp.com.bo/producto/RG-ES105D');
    expect(blockedReason(429, 'application/json')).toMatch(/429/);
    expect(blockedReason(200, 'text/html')).toMatch(/anti-bots/);
    expect(blockedReason(200, 'application/json; charset=utf-8')).toBeNull();
    const now = new Date('2026-10-27T12:00:00Z');
    expect(syncDue(null, now)).toBe(true);
    expect(syncDue(new Date('2026-10-01T12:00:00Z'), now)).toBe(false);
    expect(syncDue(new Date('2026-09-20T12:00:00Z'), now)).toBe(true);
  });
});
