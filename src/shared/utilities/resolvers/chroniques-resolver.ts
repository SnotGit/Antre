import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChroniquesResolver {

  //======= URL ENCODING/DECODING =======

  encodeTitle(title: string): string {
    return title.replace(/ /g, '-');
  }

  decodeTitle(encodedTitle: string): string {
    return encodedTitle.replace(/-/g, ' ');
  }

  //======= URL BUILDING HELPERS =======

  storyUrl(username: string, title: string): string {
    return `/chroniques/${username}/${this.encodeTitle(title)}`;
  }

  editDraftUrl(username: string, title: string): string {
    return `/chroniques/${username}/edition/${this.encodeTitle(title)}`;
  }

  editPublishedUrl(username: string, title: string): string {
    return `/chroniques/${username}/edition/${this.encodeTitle(title)}`;
  }

  userDraftsUrl(username: string): string {
    return `/chroniques/${username}/mes-histoires/brouillons`;
  }

  userPublishedUrl(username: string): string {
    return `/chroniques/${username}/mes-histoires/publiees`;
  }

  myStoriesUrl(username: string): string {
    return `/chroniques/${username}/mes-histoires`;
  }
}