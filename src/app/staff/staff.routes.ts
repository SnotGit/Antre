import { Routes } from "@angular/router";

const staffRoutes: Routes = [

    { path: 'staff', 
        loadChildren: () => import('./staff.routes'),},
];

export default staffRoutes;