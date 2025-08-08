import { ResolveFn } from '@angular/router';

interface HomeData {
  title: string;
  description: string;
}

export const homeResolver: ResolveFn<HomeData> = async (route) => {
  
  return {
    title: "Page d'accueil",
    description: "Bienvenue dans L'Antre"
  };
};