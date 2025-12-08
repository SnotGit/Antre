# CLAUDE.md - L'Antre

## Projet
L'Antre - Plateforme roleplay Mars sci-fi. Angular 20 + Express + Prisma + PostgreSQL.
Interface terminal/console futuriste immersive.

## Sections
- chroniques : Écriture histoires roleplay (PRINCIPAL)
- archives : Images/textes/lore
- marsball : Wiki items jeu martien
- terraformars : Univers étendu
- staff : Administration admins

## Commandes
```bash
ng serve              # Dev server
ng build --prod       # Build production
ng test               # Tests unitaires
ng lint               # Linter
```

## Structure réelle
```
src/
├── app/
│   ├── app.component.ts
│   └── app.module.ts
├── core/
│   ├── guards/
│   ├── interceptors/
│   └── services/
├── features/
│   ├── chroniques/
│   │   ├── components/
│   │   │   ├── editors/
│   │   │   │   ├── edit-draft/
│   │   │   │   ├── edit-published/
│   │   │   │   └── new-story/
│   │   │   └── stories/
│   │   │       ├── draft-list/
│   │   │       ├── my-stories/
│   │   │       └── published-list/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── marsball/
│   │   ├── components/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── auth/
│   │   ├── components/
│   │   └── services/
│   └── user/
├── shared/
│   ├── menus/
│   ├── services/
│   ├── styles/
│   │   ├── main/
│   │   ├── navbar/
│   │   ├── content/
│   │   │   ├── artefacts/
│   │   │   │   ├── buttons/
│   │   │   │   ├── form-field/
│   │   │   │   └── typing-effect/
│   │   │   ├── chroniques/
│   │   │   └── marsball/
│   │   └── panels/
│   └── utilities/
│       ├── resolvers/
│       ├── typing-effect/
│       └── crop-images/
└── main.ts
```

## Règles techniques Angular 20

### Architecture obligatoire
- Signals : `signal()`, `computed()`, `linkedSignal()`
- Resources : `resource()` pour données async
- Standalone components uniquement
- Injection : `inject()` (source: Angular Style Guide)
- Change detection : `OnPush` par défaut

### Interdit absolu
- `any` TypeScript (JAMAIS)
- Observables (sauf interop RxJS nécessaire)
- `console.log` en production
- Commentaires parasites (sauf séparateurs)
- Noms inventés incohérents
- Suppositions sans vérification code

### Données
- Backend : traitement par ID uniquement
- Frontend : Resolvers titre→ID pour URLs lisibles
- URLs : `/chroniques/username/titre-histoire`

## Structure composant (pattern réel du projet)

```typescript
import { Component, OnInit, OnDestroy, inject, signal, computed, resource } from '@angular/core';

@Component({
  selector: 'app-example',
  imports: [],
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
export class Example implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly exampleService = inject(ExampleService);

  //======= TYPING EFFECT =======

  private readonly title = 'Titre Page';
  headerTitle = this.typingService.headerTitle;

  //======= SIGNALS =======

  data = signal<Data | null>(null);
  isLoading = signal(false);

  //======= RESOURCE =======

  private readonly dataResource = resource({
    loader: async () => {
      return await this.exampleService.getData();
    }
  });

  //======= COMPUTED =======

  displayData = computed(() => this.dataResource.value() || []);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= METHODS =======

  onAction(): void {
    // logique
  }
}
```

## Séparateurs obligatoires
```typescript
//======= INJECTIONS =======
//======= TYPING EFFECT =======
//======= SIGNALS =======
//======= RESOURCE =======
//======= COMPUTED =======
//======= LIFECYCLE =======
//======= METHODS =======
```

## SCSS - Architecture mixins
Les styles utilisent des mixins dans `src/shared/styles/content/artefacts/` :
- `@mixin button` dans `buttons/_button.scss`
- `@mixin credential-button` dans `buttons/credential-button.scss`
- `@mixin form-field` dans `form-field/form-field.scss`
- `@mixin typing-effect` dans `typing-effect/_typing-effect.scss`
- `@mixin delete-cross` dans `delete-cross/_delete-cross.scss`

Point d'entrée : `src/shared/styles/index.scss`

## Fichiers - NE PAS MODIFIER sans validation
- `environment.ts` / `environment.prod.ts`
- `angular.json`
- Fichiers `*.spec.ts`

## Workflow obligatoire
1. RECHERCHER documentation Angular 20 si doute
2. ANALYSER contexte existant (patterns, services, styles)
3. VÉRIFIER chaque affirmation avec code exact
4. LIVRER 1 fichier complet par message
5. ATTENDRE validation avant continuer
6. TESTER code avant livraison

## Interdictions absolues
- Inventer fonctionnalités non demandées
- Modifier conventions nommage établies
- Supposer paramètres sans vérification
- Coder avant analyse terminée
- Dire "probablement", "semble", "devrait"
