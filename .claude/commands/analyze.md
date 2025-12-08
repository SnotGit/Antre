# Commande: /analyze

Analyse rigoureuse AVANT tout développement. Basée sur DIRECTIVES_STRICTES.txt.

## Principe fondamental

Chaque mot de la réponse DOIT être vérifiable dans le code fourni.
ZÉRO TOLÉRANCE AUX ERREURS.

## Étapes obligatoires

### 1. Inventaire avec citations exactes
```
RECHERCHER ET LISTER avec lignes de code :
- Services existants + méthodes exactes
- Composants similaires + patterns
- Interfaces/types + propriétés
- Mixins SCSS + paramètres
- Routes + structures
```

### 2. Extraction des patterns
```
IDENTIFIER avec preuves :
- Comment les autres composants font X → CITER code
- Paramètres utilisés → MONTRER ligne exacte
- Architecture respectée → EXEMPLES concrets
```

### 3. Validation des affirmations
```
CHAQUE AFFIRMATION :
- "Le service fait X" → copier-coller ligne de code
- "Le paramètre est Y" → citer fichier + ligne
- "L'architecture suit Z" → prouver avec exemples

SI INFO MANQUANTE → dire "non trouvé dans le code"
```

### 4. Plan de développement
```
DÉFINIR avec références exactes :
- Patterns à réutiliser (fichier + ligne)
- Services à appeler (méthodes exactes)
- Paramètres à utiliser (types exacts)
- Structure à suivre (exemple existant)
```

## Interdictions absolues
- ❌ Supposer paramètre sans vérification
- ❌ Inventer méthode inexistante
- ❌ Utiliser mots : "probablement", "semble", "devrait", "apparemment"
- ❌ Coder avant analyse terminée
- ❌ Faire confiance à sa mémoire

## Validation finale
Avant tout code, confirmer avec preuves :
- "J'ai vérifié que X existe : [citation code]"
- "Pattern Y utilisé dans : [liste fichiers]"
- "Méthodes du service W : [liste exacte]"
- "Je n'invente rien"

## Résultat attendu
Développement intégré parfaitement dans l'existant avec bons paramètres et conventions.
