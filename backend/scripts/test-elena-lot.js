// Banc de test de la boîte partagée : dépôt réel sur http://localhost:3000/api/elena/lots
// Usage : node scripts/test-elena-lot.js (depuis backend/, serveur démarré)

const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const { readFileSync, existsSync, readdirSync, unlinkSync, writeFileSync } = require('fs');
const path = require('path');

const API = 'http://localhost:3000/api';
const SECTION = process.argv[2] || 'marsball';

//======= IMAGES DE TEST =======

function cardSvg(iconFill) {
  return Buffer.from(`<svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="800" fill="#14141c"/>
    <rect x="60" y="80" width="480" height="640" fill="#3a3a45" stroke="#ffffff" stroke-width="4"/>
    <rect x="81" y="110" width="62" height="62" fill="${iconFill}"/>
    <rect x="100" y="400" width="400" height="8" fill="#c8c8c8"/>
  </svg>`);
}

async function buildImages() {
  const carte1 = await sharp(cardSvg('#ffffff')).png().toBuffer();
  const carte2 = await sharp(cardSvg('#ffd700')).png().toBuffer();
  const noise = await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 16, g: 16, b: 16 } }
  }).png().toBuffer();
  return { carte1, carte2, noise };
}

//======= TOKEN ADMIN LOCAL =======

function adminToken() {
  const secret = JSON.parse(readFileSync(path.join('secrets', 'jwt.json'), 'utf8')).secret;
  return jwt.sign({ userId: 1, role: 'admin' }, secret, { expiresIn: '10m' });
}

//======= HTTP =======

async function api(method, route, token, body, isJson = true) {
  const headers = { Authorization: `Bearer ${token}` };
  if (isJson && body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${route}`, {
    method,
    headers,
    body: isJson && body ? JSON.stringify(body) : body
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function lotForm(entries, section, categoryId) {
  const form = new FormData();
  form.append('section', section);
  form.append('categoryId', String(categoryId));
  for (const [name, buffer, type] of entries) {
    form.append('files', new Blob([buffer], { type }), name);
  }
  return form;
}

//======= MAIN =======

async function main() {
  const token = adminToken();
  const log = [];
  const ok = (label, cond, detail = '') =>
    log.push(`${cond ? 'OK  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);

  const { carte1, carte2, noise } = await buildImages();

  // catégorie de test
  const cat = await api('POST', `/${SECTION}/categories`, token, { title: 'Test Elena Boite', parentId: null });
  if (cat.status !== 201) {
    console.log('ABORT création catégorie:', cat.status, cat.text);
    return;
  }
  const catId = cat.json.category.id;
  log.push(`Catégorie de test #${catId} créée`);

  const createdFiles = [];

  try {
    // lot principal : 3 images valides (1 avec txt, 1 accentuée), 1 illisible, 1 txt orphelin
    const form = lotForm([
      ['carte1.png', carte1, 'image/png'],
      ['carte1.txt', Buffer.from('Casque de test déposé par Elena.', 'utf-8'), 'text/plain'],
      ['carte2.png', carte2, 'image/png'],
      ['bétrave moissonneuse.png', await sharp(cardSvg('#aaccff')).png().toBuffer(), 'image/png'],
      ['noise.png', noise, 'image/png'],
      ['orphelin.txt', Buffer.from('Description sans image.', 'utf-8'), 'text/plain']
    ], SECTION, catId);

    const lot = await api('POST', '/elena/lots', token, form, false);
    ok('POST /elena/lots → 201', lot.status === 201, `status ${lot.status}`);
    const r = lot.json?.report ?? {};
    ok('created = 3', r.created === 3, `created ${r.created}`);
    ok('review = 1 (noise)', r.review?.length === 1, JSON.stringify(r.review));
    ok('ignored = 1 (txt orphelin)', r.ignored === 1, `ignored ${r.ignored}`);
    ok('duplicates = 0', r.duplicates === 0, `duplicates ${r.duplicates}`);

    // contenu de la catégorie
    const detail = await api('GET', `/${SECTION}/categories/${catId}`, token);
    const entries = detail.json?.entries ?? [];
    ok('3 items en base', entries.length === 3, `${entries.length} items`);

    const titles = entries.map(e => e.title).sort();
    ok('titres formatés', JSON.stringify(titles) === JSON.stringify(['Bétrave Moissonneuse', 'Carte1', 'Carte2']),
      JSON.stringify(titles));

    const carte1Entry = entries.find(e => e.title === 'Carte1');
    ok('description du .txt liée', carte1Entry?.description === 'Casque de test déposé par Elena.',
      JSON.stringify(carte1Entry?.description));

    for (const e of entries) {
      createdFiles.push(e.imageUrl, e.thumbnailUrl);
    }

    // dimensions : trim (carte 484px) + miniature 80x80
    if (carte1Entry) {
      const mainPath = carte1Entry.imageUrl.replace(/^\//, '');
      const thumbPath = carte1Entry.thumbnailUrl.replace(/^\//, '');
      const mainMeta = await sharp(mainPath).metadata();
      const thumbMeta = await sharp(thumbPath).metadata();
      ok('trim au cadre de la carte (~484px de large)', Math.abs(mainMeta.width - 484) <= 4,
        `main ${mainMeta.width}x${mainMeta.height}`);
      ok('miniature 80x80', thumbMeta.width === 80 && thumbMeta.height === 80,
        `thumb ${thumbMeta.width}x${thumbMeta.height}`);
    }

    // doublon : re-dépôt de carte1
    const dup = await api('POST', '/elena/lots', token,
      lotForm([['carte1.png', carte1, 'image/png']], SECTION, catId), false);
    const rd = dup.json?.report ?? {};
    ok('re-dépôt → duplicates = 1, created = 0', rd.duplicates === 1 && rd.created === 0,
      JSON.stringify(rd));

    // garde-fou : dépôt sur une branche (catégorie avec enfant)
    const child = await api('POST', `/${SECTION}/categories`, token, { title: 'Test Elena Enfant', parentId: catId });
    const childId = child.json?.category?.id;
    const branch = await api('POST', '/elena/lots', token,
      lotForm([['carte2.png', carte2, 'image/png']], SECTION, catId), false);
    ok('dépôt sur branche refusé (400)', branch.status === 400, `status ${branch.status} ${branch.text}`);
    if (childId) await api('DELETE', `/${SECTION}/categories/${childId}`, token);

    // review : le fichier noise est bien rangé
    const reviewDir = path.join('staging', 'review');
    const reviewFiles = existsSync(reviewDir) ? readdirSync(reviewDir).filter(f => f.includes('noise')) : [];
    ok('noise.png présent dans staging/review', reviewFiles.length >= 1, reviewFiles.join(', '));

  } finally {
    //======= NETTOYAGE =======
    await api('DELETE', `/${SECTION}/categories/${catId}`, token);
    log.push(`Catégorie de test #${catId} supprimée (cascade items)`);

    for (const url of createdFiles) {
      const p = url.replace(/^\//, '');
      if (existsSync(p)) unlinkSync(p);
    }
    log.push(`${createdFiles.length} fichiers uploads de test supprimés`);

    const registryPath = path.join('staging', 'hashes.json');
    if (existsSync(registryPath)) {
      const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
      let removed = 0;
      for (const [hash, url] of Object.entries(registry)) {
        if (createdFiles.includes(url)) { delete registry[hash]; removed++; }
      }
      writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
      log.push(`${removed} hashes de test retirés du registre`);
    }

    const reviewDir = path.join('staging', 'review');
    if (existsSync(reviewDir)) {
      for (const f of readdirSync(reviewDir).filter(f => f.includes('noise'))) {
        unlinkSync(path.join(reviewDir, f));
      }
      log.push('fichiers review de test supprimés');
    }
  }

  console.log('\n===== RAPPORT TEST BOÎTE PARTAGÉE =====\n' + log.join('\n'));
}

main().catch(e => console.error('ERREUR BANC DE TEST:', e));
