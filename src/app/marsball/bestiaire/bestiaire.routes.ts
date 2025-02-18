import { Routes } from '@angular/router';
import { BestiaireComponent } from './bestiaire.component';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { DetailsComponent } from './details/details.component';
import { EditComponent } from './edit/edit.component';

export const BESTIAIRE_ROUTES: Routes = [
  {
    path: '',
    component: BestiaireComponent,
    children: [
      { path: '', redirectTo: "", pathMatch: 'full' },
      { path: 'list', component: ListComponent },
      { path: 'add', component: AddComponent },
      { path: 'details/:id', component: DetailsComponent },
      { path: 'edit/:id', component: EditComponent }
    ]
  }
];