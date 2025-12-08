# CONVENTIONS.md - L'Antre

Sources : Angular Style Guide (angular.dev), Google TypeScript Style Guide, patterns projet existant.

## Nommage (Google TypeScript Style Guide)

### Fichiers
- kebab-case avec tirets : `user-profile.ts`, `edit-draft.html`
- Même nom pour .ts, .html, .scss : `edit-draft.ts`, `edit-draft.html`, `edit-draft.scss`
- Tests : même nom + `.spec.ts` : `edit-draft.spec.ts`

### Identifiants
| Type | Style | Exemple |
|------|-------|---------|
| Classe | UpperCamelCase | `PublishedList`, `AuthService` |
| Interface | UpperCamelCase | `StoryFormData`, `CategoryWithChildren` |
| Variable | lowerCamelCase | `storyTitle`, `isLoading` |
| Fonction | lowerCamelCase | `getPublishedStories`, `onAction` |
| Constante globale | CONSTANT_CASE | `API_URL`, `MAX_LENGTH` |
| Signal | lowerCamelCase | `selectedStories`, `authMode` |

### Interdit
- Préfixes/suffixes `_` pour private
- Préfixe `I` pour interfaces
- `any` (JAMAIS)

## Angular 20 (angular.dev Style Guide)

### Injection de dépendances
```typescript
// CORRECT - inject() function
private readonly router = inject(Router);
private readonly authService = inject(AuthService);

// INTERDIT - constructor injection
constructor(private router: Router) {} // NON
```

### Standalone Components
```typescript
@Component({
  selector: 'app-example',
  imports: [FormsModule],           // Imports directs
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
export class Example {}             // Pas de suffix "Component"
```

### Fichiers séparés obligatoires
- TypeScript : `example.ts`
- Template : `example.html`
- Styles : `example.scss`
- Jamais inline template/styles

### Organisation par features (angular.dev)
```
features/
├── chroniques/
│   ├── components/
│   ├── services/
│   ├── models/
│   └── routes/
```
Pas de dossiers `components/`, `services/` à la racine.

## Signals (Angular 20)

### Writable signals
```typescript
const count = signal(0);
count.set(3);
count.update(value => value + 1);
```

### Computed signals (read-only, dérivés)
```typescript
const doubleCount = computed(() => count() * 2);
```

### Resources (données async)
```typescript
private readonly dataResource = resource({
  params: () => ({ id: this.userId() }),
  loader: async ({ params }) => {
    return await this.service.getById(params.id);
  }
});

data = computed(() => this.dataResource.value() || []);
```

### LinkedSignal (état dépendant)
```typescript
selectedOption = linkedSignal(() => this.options()[0]);
```

### Effects (rarement nécessaires)
```typescript
effect(() => {
  localStorage.setItem('count', this.count().toString());
});
```

## TypeScript (Google Style Guide)

### Variables
```typescript
// CORRECT
const foo = 'value';      // Immutable
let bar = 'value';        // Si réassigné plus tard

// INTERDIT
var foo = 'value';        // NON
```

### Exports
```typescript
// CORRECT - Named exports
export class Foo {}
export function bar() {}

// INTERDIT - Default exports
export default class Foo {} // NON
```

### Types
```typescript
// CORRECT
interface User {
  id: number;
  name: string;
}

const user: User = { id: 1, name: 'Test' };

// INTERDIT
const data: any = {};     // JAMAIS
```

### Égalité
```typescript
// CORRECT
if (foo === 'bar') {}
if (baz !== null) {}

// INTERDIT
if (foo == 'bar') {}      // NON (sauf == null pour null/undefined)
```

## Structure composant (pattern projet)

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
  private readonly service = inject(ExampleService);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Titre';
  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  data = signal<Data | null>(null);

  //======= RESOURCE =======

  private readonly dataResource = resource({
    loader: async () => await this.service.getData()
  });

  //======= COMPUTED =======

  items = computed(() => this.dataResource.value() || []);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= METHODS =======

  onAction(): void {}
}
```

## Services

### Structure
```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);

  //======= API =======

  async getData(): Promise<Data[]> {
    return firstValueFrom(this.http.get<Data[]>('/api/data'));
  }
}
```

## Templates HTML (Angular 20 Control Flow)

```html
@if (isLoading()) {
  <app-loader />
} @else if (error()) {
  <app-error [message]="error()" />
} @else {
  <div class="content">
    @for (item of items(); track item.id) {
      <app-item [item]="item" />
    } @empty {
      <p>Aucun élément</p>
    }
  </div>
}
```

## SCSS

### Utilisation mixins existants
```scss
@use '@shared/styles/content/artefacts/buttons/button' as *;
@use '@shared/styles/content/artefacts/form-field/form-field' as *;

.my-component {
  @include button;
  @include form-field;
}
```

### Mixins disponibles
- `@mixin button` - Boutons standard
- `@mixin credential-button` - Boutons auth
- `@mixin form-field` - Champs formulaire
- `@mixin typing-effect` - Effet terminal
- `@mixin delete-cross` - Croix suppression

## Git

### Branches
- `feature/nom-feature`
- `fix/description-bug`
- `refactor/description`

### Commits
```
feat: ajouter composant story-card
fix: corriger navigation timeline
refactor: migrer stories vers signals
```
