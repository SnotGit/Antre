import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileNameFormatterService {

  //======= MAIN METHOD =======

  format(file: File): string {
    const fileName = file.name;
    
    // 1. Retirer extension
    const nameWithoutExt = this.removeExtension(fileName);
    
    // 2. Retirer hash/numéros/suffixes
    const nameWithoutHash = this.removeHashAndSuffixes(nameWithoutExt);
    
    // 3. Remplacer séparateurs par espaces
    const nameWithSpaces = this.replaceSeparators(nameWithoutHash);
    
    // 4. Nettoyer espaces multiples
    const cleanedName = this.cleanMultipleSpaces(nameWithSpaces);
    
    // 5. Appliquer Title Case avec gestion apostrophes
    const formattedName = this.applyTitleCase(cleanedName);
    
    return formattedName;
  }

  //======= PRIVATE METHODS =======

  private removeExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  }

  private removeHashAndSuffixes(name: string): string {
    // Pattern pour hash: -59a0ea9, -abc123def, _1234567
    const hashPattern = /[-_][a-f0-9]{6,}$/i;
    
    // Pattern pour suffixes: -copy, -copie, (1), (2), etc.
    const suffixPattern = /[-_](copy|copie|\d+|\(\d+\))$/i;
    
    let cleaned = name;
    
    // Retirer hash
    cleaned = cleaned.replace(hashPattern, '');
    
    // Retirer suffixes
    cleaned = cleaned.replace(suffixPattern, '');
    
    return cleaned;
  }

  private replaceSeparators(name: string): string {
    // Remplacer tirets, underscores par espaces
    return name.replace(/[-_]/g, ' ');
  }

  private cleanMultipleSpaces(name: string): string {
    // Remplacer espaces multiples par un seul
    return name.replace(/\s+/g, ' ').trim();
  }

  private applyTitleCase(name: string): string {
    const words = name.split(' ');
    
    const formattedWords = words.map((word, index) => {
      // Gestion des apostrophes (l, d, s, etc.)
      if (index > 0 && this.isApostropheWord(words[index - 1])) {
        return this.handleApostrophe(words[index - 1], word);
      }
      
      // Première lettre majuscule, reste minuscule
      return this.capitalizeWord(word);
    });
    
    // Filtrer les mots vides (gestion apostrophes)
    return formattedWords.filter(w => w.length > 0).join(' ');
  }

  private isApostropheWord(word: string): boolean {
    const apostropheWords = ['l', 'd', 's', 'c', 'j', 'n', 'm', 't', 'qu'];
    return apostropheWords.includes(word.toLowerCase());
  }

  private handleApostrophe(apostropheWord: string, nextWord: string): string {
    // Combiner: "l" + "aiglon" → "L'Aiglon"
    const combined = `${apostropheWord.toUpperCase()}'${this.capitalizeWord(nextWord)}`;
    
    // Retourner vide pour apostropheWord (sera filtré), nextWord devient combined
    // HACK: On retourne le mot combiné et on filtrera l'apostrophe seule plus tard
    return combined;
  }

  private capitalizeWord(word: string): string {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}