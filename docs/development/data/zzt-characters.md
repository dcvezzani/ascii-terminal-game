<style>
body, .markdown-body {
  font-family: "PxPlus IBM EGA 8x14", monospace;
}
</style>

# ZZT Character Reference

This document describes the character glyphs used in ZZT games, organized by category. All characters are specified using CP437 code page values (decimal) with their corresponding Unicode hex values.

## Items

### Player

- **Character**: &#x263B; (Decimal: 2, Hex: `0x02`, Unicode: `U+263B`)

### Ammo

- **Character**: &#x00E4; (Decimal: 132, Hex: `0x84`, Unicode: `U+00E4`)

### Torch

- **Character**: &#x00A5; (Decimal: 157, Hex: `0x9D`, Unicode: `U+00A5`)

### Gem

- **Character**: &#x2666; (Decimal: 4, Hex: `0x04`, Unicode: `U+2666`)

### Key

- **Character**: &#x2640; (Decimal: 12, Hex: `0x0C`, Unicode: `U+2640`)

### Door

- **Character**: &#x25D9; (Decimal: 10, Hex: `0x0A`, Unicode: `U+25D9`)

### Scroll

- **Character**: &#x03A6; (Decimal: 232, Hex: `0xE8`, Unicode: `U+03A6`)

### Passage

- **Character**: &#x2261; (Decimal: 240, Hex: `0xF0`, Unicode: `U+2261`)

### Duplicator

Animated by rotating through a series of glyphs:

- Frame 1: &#x22C5; (Decimal: 250, Hex: `0xFA`, Unicode: `U+22C5`)
- Frame 2: &#x2219; (Decimal: 249, Hex: `0xF9`, Unicode: `U+2219`)
- Frame 3: &#x00B0; (Decimal: 248, Hex: `0xF8`, Unicode: `U+00B0`)
- Frame 4: &#x006F; (Decimal: 111, Hex: `0x6F`, Unicode: `U+006F`)
- Frame 5: &#x004F; (Decimal: 79, Hex: `0x4F`, Unicode: `U+004F`)
- **Default**: &#x22C5; (Decimal: 250, Hex: `0xFA`, Unicode: `U+22C5`)

### Bomb

Animated by rotating through a series of glyphs showing countdown:

- Initial: &#x2642; (Decimal: 11, Hex: `0x0B`, Unicode: `U+2642`)
- Countdown: &#x0030; through &#x0039; (Decimal: 48-57, Hex: `0x30-0x39`, Unicode: `U+0030-U+0039`)

### Energizer

- **Character**: &#x002F; (Decimal: 47, Hex: `0x2F`, Unicode: `U+002F`)

### Conveyors (Clockwise and Counter-clockwise)

Animated by rotating through a series of glyphs and colors:

- Frame 0: &#x2502; (Decimal: 179, Hex: `0xB3`, Unicode: `U+2502`)
- Frame 1: &#x002F; (Decimal: 47, Hex: `0x2F`, Unicode: `U+002F`)
- Frame 2: &#x2500; (Decimal: 196, Hex: `0xC4`, Unicode: `U+2500`)
- Frame 3: &#x005C; (Decimal: 92, Hex: `0x5C`, Unicode: `U+005C`)

## Creatures

### Bear

- **Character**: &#x00D6; (Decimal: 153, Hex: `0x99`, Unicode: `U+00D6`)

### Ruffian

- **Character**: &#x2663; (Decimal: 5, Hex: `0x05`, Unicode: `U+2663`)

### Object

Can use any glyph.

- **Default**: &#x263A; (Decimal: 1, Hex: `0x01`, Unicode: `U+263A`)

### Slime

- **Character**: \* (Decimal: 42, Hex: `0x2A`, Unicode: `U+002A`)

### Shark

- **Character**: &#x005E; (Decimal: 94, Hex: `0x5E`, Unicode: `U+005E`)
- **Note**: Has a background color

### Spinning Gun

Animated by rotating through a series of glyphs:

- &#x2191; (Decimal: 24, Hex: `0x18`, Unicode: `U+2191`)
- &#x2193; (Decimal: 25, Hex: `0x19`, Unicode: `U+2193`)
- &#x2192; (Decimal: 26, Hex: `0x1A`, Unicode: `U+2192`)
- &#x2190; (Decimal: 27, Hex: `0x1B`, Unicode: `U+2190`)

### Pusher

Directional characters based on push direction:

- Right: &#x25B6; (Decimal: 16, Hex: `0x10`, Unicode: `U+25B6`)
- Left: &#x25C0; (Decimal: 17, Hex: `0x11`, Unicode: `U+25C0`)
- Up: &#x25B2; (Decimal: 30, Hex: `0x1E`, Unicode: `U+25B2`)
- Down: &#x25BC; (Decimal: 31, Hex: `0x1F`, Unicode: `U+25BC`)

### Lion

- **Character**: &#x03A9; (Decimal: 234, Hex: `0xEA`, Unicode: `U+03A9`)

### Tiger

- **Character**: &#x03C0; (Decimal: 227, Hex: `0xE3`, Unicode: `U+03C0`)

### Bullet

- **Character**: &#x00B0; (Decimal: 248, Hex: `0xF8`, Unicode: `U+00B0`)

### Star

Uses multiple glyphs:

- &#x0053; (Decimal: 83, Hex: `0x53`, Unicode: `U+0053`)
- &#x2502; (Decimal: 179, Hex: `0xB3`, Unicode: `U+2502`)
- &#x002F; (Decimal: 47, Hex: `0x2F`, Unicode: `U+002F`)
- &#x2500; (Decimal: 196, Hex: `0xC4`, Unicode: `U+2500`)
- &#x005C; (Decimal: 92, Hex: `0x5C`, Unicode: `U+005C`)

### Centipede

A centipede consists of one head and zero or more segments.

#### Centipede Head

- **Character**: &#x03B8; (Decimal: 233, Hex: `0xE9`, Unicode: `U+03B8`)

#### Centipede Segment

- **Character**: &#x004F; (Decimal: 79, Hex: `0x4F`, Unicode: `U+004F`)

## Terrain

### Empty

- **Character**: &#x0020; (space) (Decimal: 32, Hex: `0x20`, Unicode: `U+0020`)

### Water

- **Character**: &#x2591; (Decimal: 176, Hex: `0xB0`, Unicode: `U+2591`)
- **Note**: Should always be blue on light gray

### Forest

- **Character**: &#x2591; (Decimal: 176, Hex: `0xB0`, Unicode: `U+2591`)
- **Note**: Should always be green in color

### Walls - Solid

- **Character**: &#x2588; (Decimal: 219, Hex: `0xDB`, Unicode: `U+2588`)

### Walls - Normal

- **Character**: &#x2593; (Decimal: 178, Hex: `0xB2`, Unicode: `U+2593`)

### Linewalls

Depending on the shape of the walls, different glyphs should be used. The table below shows which glyph to use based on adjacent walls (E=East, W=West, S=South, N=North):

| Glyph    | Decimal | Hex    | Unicode  | E   | W   | S   | N   |
| -------- | ------- | ------ | -------- | --- | --- | --- | --- |
| &#x2219; | 249     | `0xF9` | `U+2219` | N   | N   | N   | N   |
| &#x2568; | 208     | `0xD0` | `U+2568` | N   | N   | N   | Y   |
| &#x2565; | 210     | `0xD2` | `U+2565` | N   | N   | Y   | N   |
| &#x2551; | 186     | `0xBA` | `U+2551` | N   | N   | Y   | Y   |
| &#x2561; | 181     | `0xB5` | `U+2561` | N   | Y   | N   | N   |
| &#x255D; | 188     | `0xBC` | `U+255D` | N   | Y   | N   | Y   |
| &#x2557; | 187     | `0xBB` | `U+2557` | N   | Y   | Y   | N   |
| &#x2563; | 185     | `0xB9` | `U+2563` | N   | Y   | Y   | Y   |
| &#x255E; | 198     | `0xC6` | `U+255E` | Y   | N   | N   | N   |
| &#x255A; | 200     | `0xC8` | `U+255A` | Y   | N   | N   | Y   |
| &#x2554; | 201     | `0xC9` | `U+2554` | Y   | N   | Y   | N   |
| &#x2560; | 204     | `0xCC` | `U+2560` | Y   | N   | Y   | Y   |
| &#x2550; | 205     | `0xCD` | `U+2550` | Y   | Y   | N   | N   |
| &#x2569; | 202     | `0xCA` | `U+2569` | Y   | Y   | N   | Y   |
| &#x2566; | 203     | `0xCB` | `U+2566` | Y   | Y   | Y   | N   |
| &#x256C; | 206     | `0xCE` | `U+256C` | Y   | Y   | Y   | Y   |

### Walls - Breakable

- **Character**: &#x2592; (Decimal: 177, Hex: `0xB1`, Unicode: `U+2592`)

### Boulder

- **Character**: &#x220E; (Decimal: 254, Hex: `0xFE`, Unicode: `U+220E`)

### Sliders

#### Slider NS (Vertical)

- **Character**: &#x2195; (Decimal: 18, Hex: `0x12`, Unicode: `U+2195`)

#### Slider EW (Horizontal)

- **Character**: &#x2194; (Decimal: 29, Hex: `0x1D`, Unicode: `U+2194`)

### Walls - Fake

- **Character**: &#x2593; (Decimal: 178, Hex: `0xB2`, Unicode: `U+2593`)

### Walls - Invisible

- **In game**: &#x0020; (space) (Decimal: 32, Hex: `0x20`, Unicode: `U+0020`)
- **In editor**: &#x2591; (Decimal: 176, Hex: `0xB0`, Unicode: `U+2591`)

### Walls - Blinkwall (Blinkwall Rays - Horizontal and Vertical)

Animated by "blinking" on/off, alternating between being visible and hidden:

- Horizontal: &#x2550; (Decimal: 205, Hex: `0xCD`, Unicode: `U+2550`)
- Vertical: &#x2551; (Decimal: 186, Hex: `0xBA`, Unicode: `U+2551`)
- **Intersection**: When vertical and horizontal walls intersect, use &#x256C; (Decimal: 206, Hex: `0xCE`, Unicode: `U+256C`)

### Transporter

Animated by rotating through a series of glyphs based on facing direction:

#### North Facing

- Frame 1: &#x005E; (Decimal: 94, Hex: `0x5E`, Unicode: `U+005E`)
- Frame 2: &#x007E; (Decimal: 126, Hex: `0x7E`, Unicode: `U+007E`)
- Frame 3: &#x005E; (Decimal: 94, Hex: `0x5E`, Unicode: `U+005E`)
- Frame 4: &#x002D; (Decimal: 45, Hex: `0x2D`, Unicode: `U+002D`)

#### South Facing

- Frame 1: &#x0076; (Decimal: 118, Hex: `0x76`, Unicode: `U+0076`)
- Frame 2: \_ (Decimal: 95, Hex: `0x5F`, Unicode: `U+005F`)
- Frame 3: &#x0076; (Decimal: 118, Hex: `0x76`, Unicode: `U+0076`)
- Frame 4: &#x002D; (Decimal: 45, Hex: `0x2D`, Unicode: `U+002D`)

#### East Facing

- Frame 1: &#x0028; (Decimal: 40, Hex: `0x28`, Unicode: `U+0028`)
- Frame 2: &#x003C; (Decimal: 60, Hex: `0x3C`, Unicode: `U+003C`)
- Frame 3: &#x0028; (Decimal: 40, Hex: `0x28`, Unicode: `U+0028`)
- Frame 4: &#x2502; (Decimal: 179, Hex: `0xB3`, Unicode: `U+2502`)

#### West Facing

- Frame 1: &#x0029; (Decimal: 41, Hex: `0x29`, Unicode: `U+0029`)
- Frame 2: &#x003E; (Decimal: 62, Hex: `0x3E`, Unicode: `U+003E`)
- Frame 3: &#x0029; (Decimal: 41, Hex: `0x29`, Unicode: `U+0029`)
- Frame 4: &#x2502; (Decimal: 179, Hex: `0xB3`, Unicode: `U+2502`)

### Ricochet

- **Character**: \* (Decimal: 42, Hex: `0x2A`, Unicode: `U+002A`)

### Text

- **Note**: Should have a foreground and background color

## Special Elements

### Board Edge

- **Character**: &#x0020; (space) (Decimal: 32, Hex: `0x20`, Unicode: `U+0020`)

### Messenger/Message Timer

- **Character**: &#x0020; (space) (Decimal: 32, Hex: `0x20`, Unicode: `U+0020`)
- **Note**: Should have a foreground and background color. Text is usually rendered in this region.

### Monitor

- **Character**: &#x0020; (space) (Decimal: 32, Hex: `0x20`, Unicode: `U+0020`)

---

## Notes

- All character codes are based on Code Page 437 (CP437)
- Decimal values represent the CP437 byte value
- Hex values are provided for reference
- Animated elements cycle through their glyph sequences during gameplay
- Some elements have specific color requirements (e.g., Water, Forest, Shark)
- Linewalls use a sophisticated system to determine the correct glyph based on adjacent walls
