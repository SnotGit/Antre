import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchFiltersService } from '@features/search/services/search-filters.service';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.scss'
})
export class Logo {
  protected readonly filters = inject(SearchFiltersService);
}
