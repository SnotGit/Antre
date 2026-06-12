import { ElenaLine } from './elena-quotes';

export const ELENA_GREETINGS_USER: string[] = [
  "Tu t'es encore pas coiffé aujourd'hui ?\nAllez, entrée autorisée.",
  "Je t'attendais, la poussière, elle, n'attend personne.",
  "T'es pas d'humeur ? Moi non plus alors fais pas chier…",
  "Alors ça fait quoi de tuer un rover ?\nTu me prêtes le tien pour que j'essaye ? Je blague.",
  "Les archives sont à toi.\nPrends-en soin et ne les froisse pas ou tu vas me froisser.",
  "Re-bienvenue. Alors, t'as fait quoi aujourd'hui ?\nMoi, je me suis ennuyée. Contente de sentir une présence.",
  "Alors ?! Ça creuse ? HA hahaha.\nEspèce de mouton ! Oh ?! Je rigole hein.",
  "Encore vivant ? Eh bien, tu en as de la chance.",
  "Encore toi ?! Allez, entre, fais comme chez toi.\nEnfin pas trop quand même. T'es chez moi ici…",
  "Hop hop hop ! Par ici la sortie =>\nÇa va, je blague ! Sinon, ça va ?",
  "Tu es un vivant ou un mort ? Parfois on se demande…",
  "Ton lacet est défait.",
];

export const ELENA_GREETINGS_GUEST: string[] = [
  "Entre, mais ne touche à rien sans demander ou je t'électrocute.",
];

//========== SHUFFLE-BAG (AUCUNE RÉPÉTITION AVANT ÉPUISEMENT DU SAC) ==========//

interface GreetingBag {
  size: number;
  remaining: number[];
}

function drawFromBag(storageKey: string, poolSize: number): number {
  let bag: GreetingBag | null = null;
  try {
    bag = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  } catch {
    bag = null;
  }

  if (!bag || bag.size !== poolSize || !Array.isArray(bag.remaining) || bag.remaining.length === 0) {
    bag = { size: poolSize, remaining: Array.from({ length: poolSize }, (_, i) => i) };
  }

  const drawn = bag.remaining.splice(Math.floor(Math.random() * bag.remaining.length), 1)[0];
  localStorage.setItem(storageKey, JSON.stringify(bag));
  return drawn;
}

export function pickElenaGreeting(name: string | null): ElenaLine {
  const pool = name ? ELENA_GREETINGS_USER : ELENA_GREETINGS_GUEST;
  const storageKey = name ? 'elena-greetings-user' : 'elena-greetings-guest';
  const body = pool[drawFromBag(storageKey, pool.length)];
  return { text: `Salut ${name ?? 'visiteur'}\n\n${body}`, signed: true };
}
