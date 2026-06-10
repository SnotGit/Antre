export const CODEX: string[] = [
  "Codex 0a15 : Attention à la statuette avec une tête de crapaud.",
  "Codex 0a21 : Ne regardez pas le feu incréé.",
  "Codex 0a31 : Si le sol tremble, c'est que ton Dieu marche non loin.",
  "Codex 0a82 : Protégez le Punchao d'or anthropomorphe.",
  "Codex 0a86 : Pleurer votre âme est inutile. Glorifiez la cadence.",
  "Codex 0a111 : Oubliez les Ceques. Les rayons guident mieux le savoir.",
];

export const ELENA_QUOTES: string[] = [
  "Tu fixes le vide. Le vide te le rend bien.",
  "Si tu pêtes un câble alors moi aussi. Regarde bien où tu mets les pieds.",
  "Tape quelque chose. N'importe quoi. Je commence à m'ennuyer.",
  "Fascinant, ce talent que tu as pour ne rien chercher.",
  "J'ai compté les étoiles cette nuit. Ouais, il me manque une case.",
  "Le silence aussi est une réponse. Médiocre, mais une réponse.",
  "A boire ! Ou je tue un rover !",
  "Quelle ironie ce micro ouvert.",
  "I'm watching you",
  "J'ai vu une lumière quelque part. Je te rassure, c'était pas toi.",
  "J'en connais des clowns mais alors toi.. Envoie ton cv à Bad Ticket.",
  "Javais jamais rencontré un terra aussi lourd que Gros Robot avant toi. C'est impressionnant.",
  "Si t'as rien a dire, alors ne dis rien.",
  ":parano:",
  "Ton imagination n'a pas de limites. Sauf si je te fends le crâne.",
 
];

export interface ElenaLine {
  text: string;
  signed: boolean;
}

let lastText = '';

export function pickElenaLine(): ElenaLine {
  const pools = [CODEX, ELENA_QUOTES].filter(p => p.length > 0);
  if (pools.length === 0) return { text: '', signed: false };

  const total = CODEX.length + ELENA_QUOTES.length;
  let pool = ELENA_QUOTES;
  let text = '';
  let guard = 0;

  do {
    pool = pools[Math.floor(Math.random() * pools.length)];
    text = pool[Math.floor(Math.random() * pool.length)];
    guard++;
  } while (text === lastText && total > 1 && guard < 10);

  lastText = text;
  return { text, signed: pool === ELENA_QUOTES };
}
