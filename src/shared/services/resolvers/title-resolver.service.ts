import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TitleResolver {

  //======= URL ENCODING/DECODING =======

  encodeTitle(title: string): string {
    return title.replace(/ /g, '-');
  }

  decodeTitle(encodedTitle: string): string {
    return encodedTitle.replace(/-/g, ' ');
  }
}
