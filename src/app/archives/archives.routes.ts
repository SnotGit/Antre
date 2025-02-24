import { Routes } from '@angular/router';

const archivesRoutes: Routes = [
    
    { path: 'archives', 
        loadChildren: () => import('./archives.routes'),
     },
];

export default archivesRoutes;