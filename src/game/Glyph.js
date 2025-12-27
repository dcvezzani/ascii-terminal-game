export class Glyph {
  constructor(char, unicode, color = null) {
    this.char = char;
    this.color = color;
    this.unicode = unicode;
  }
}