import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './archives.component.html',
  styleUrl: './archives.component.css'
})
export default class ArchivesComponent {

}
