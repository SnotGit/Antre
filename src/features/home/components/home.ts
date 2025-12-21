import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HomeTitleService } from '@shared/components/title/services/home-title.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly homeTitleService = inject(HomeTitleService);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.homeTitleService.startSequence();
  }

  ngOnDestroy(): void {
    this.homeTitleService.stop();
  }
}