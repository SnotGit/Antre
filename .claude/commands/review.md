# Commande: /review

Review de code complet avant livraison.

## Checklist Angular 20 (angular.dev)

- [ ] Standalone component (pas de NgModule)
- [ ] `inject()` pour injections (pas constructor)
- [ ] Signals pour état (`signal()`, `computed()`)
- [ ] Resource pour données async (`resource()`)
- [ ] Control flow moderne (`@if`, `@for`, `@switch`)
- [ ] Fichiers séparés (.ts, .html, .scss)

## Checklist TypeScript (Google Style Guide)

- [ ] AUCUN `any` (interdit absolu)
- [ ] `const`/`let` (jamais `var`)
- [ ] Named exports (pas default)
- [ ] `===`/`!==` (pas `==`/`!=`)
- [ ] Interfaces définies
- [ ] Nommage : UpperCamelCase classes, lowerCamelCase variables

## Checklist projet L'Antre

- [ ] Séparateurs présents :
  - `//======= INJECTIONS =======`
  - `//======= SIGNALS =======`
  - `//======= COMPUTED =======`
  - `//======= LIFECYCLE =======`
  - `//======= METHODS =======`
- [ ] Pas de `console.log`
- [ ] Pas de commentaires parasites
- [ ] Pas d'icônes dans le code
- [ ] TypingEffectService utilisé si header

## Checklist patterns existants

- [ ] Structure composant conforme aux autres
- [ ] Services utilisés correctement
- [ ] Mixins SCSS réutilisés si applicable
- [ ] Nommage cohérent avec existant

## Checklist qualité

- [ ] Code auto-documenté
- [ ] Logique simple et directe
- [ ] Pas de sur-ingénierie
- [ ] Pas d'invention de fonctionnalités

## Format sortie
- 🔴 Critique : corriger obligatoire (bloque livraison)
- 🟡 Warning : recommandé (amélioration)
- 🟢 OK : conforme
