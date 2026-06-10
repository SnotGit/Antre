import { Directive, ElementRef, inject, OnInit } from '@angular/core';

@Directive({
  selector: 'video[autoplayForced]'
})
export class AutoplayVideoDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLVideoElement>);

  ngOnInit(): void {
    const video = this.el.nativeElement;
    
    const attemptPlay = () => {
      video.muted = true;
      video.play().catch(() => {
        setTimeout(() => video.play(), 100);
      });
    };

    if (video.readyState >= 3) {
      attemptPlay();
    } else {
      video.addEventListener('loadeddata', attemptPlay, { once: true });
    }
  }
}