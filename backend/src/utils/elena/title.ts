// Jumeau serveur de @shared/services/file-name-formatter (nom de fichier -> titre d'item)

const APOSTROPHE_WORDS = ['l', 'd', 's', 'c', 'j', 'n', 'm', 't', 'qu'];

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatTitle(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const withoutExt = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;

  const cleaned = withoutExt
    .replace(/[-_][a-f0-9]{6,}$/i, '')
    .replace(/[-_](copy|copie|\d+|\(\d+\))$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length > 0);
  const formatted: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = words[i + 1];
    if (next !== undefined && APOSTROPHE_WORDS.includes(word.toLowerCase())) {
      formatted.push(`${word.toUpperCase()}'${capitalize(next)}`);
      i++;
    } else {
      formatted.push(capitalize(word));
    }
  }

  const title = formatted.join(' ');
  return title || withoutExt.trim() || 'Sans titre';
}
