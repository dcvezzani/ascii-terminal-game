# CP437 Font Setup Guide

This guide explains how to set up a Code Page 437 (CP437) font in iTerm2 to display authentic ZZT-style characters in the terminal game.

## What is CP437?

IBM Code Page 437 is the character encoding used by DOS-era computers, including the original ZZT game. It defines 256 characters (bytes 0-255) with special graphical symbols, box-drawing characters, and extended ASCII characters.

## Why Use CP437?

- **Authentic ZZT Experience**: Matches the original ZZT game appearance
- **Original Characters**: Uses the exact same character set as DOS ZZT
- **Retro Aesthetic**: Classic DOS-era look and feel

## Recommended CP437 Fonts

### 1. Perfect DOS VGA (Recommended)

**Best match for ZZT aesthetic**

- **Download Sources**:
  - Search GitHub for "Perfect DOS VGA" font
  - Look for repositories like `perfectdosvga` or `dos-fonts`
  - Format: TTF (TrueType Font)

- **Characteristics**:
  - Designed specifically for CP437
  - Clean, readable characters
  - Excellent ZZT character support

### 2. IBM VGA / IBM PC

**Original IBM font**

- **Download Sources**:
  - Search for "IBM VGA" or "IBM PC" font
  - Historical font repositories
  - Format: TTF

- **Characteristics**:
  - Authentic IBM CP437 font
  - Original DOS appearance

### 3. Terminus

**Modern CP437-compatible font**

- **Download Sources**:
  - Available via Homebrew: `brew install font-terminus`
  - Package managers on Linux
  - Format: TTF/OTF

- **Characteristics**:
  - Modern, well-maintained
  - Good Unicode + CP437 support
  - Readable at various sizes

### 4. Unifont

**Unicode font with CP437 support**

- **Download Sources**:
  - Available via Homebrew: `brew install font-unifont`
  - Package managers
  - Format: TTF

- **Characteristics**:
  - Broad Unicode coverage
  - Includes CP437 characters
  - Good fallback option

## Installing a CP437 Font on macOS

### Method 1: Direct Installation (TTF File)

1. **Download the font file** (TTF format)
2. **Double-click the TTF file**
3. **Click "Install Font"** in Font Book
4. Font is now available system-wide

### Method 2: Homebrew (Terminus/Unifont)

```bash
# Install Terminus
brew install font-terminus

# Or install Unifont
brew install font-unifont
```

## Configuring iTerm2

1. **Open iTerm2 Preferences**
   - Press `⌘,` (Command + Comma)
   - Or: iTerm2 → Preferences

2. **Navigate to Font Settings**
   - Click "Profiles" tab
   - Select your profile (usually "Default")
   - Click "Text" tab

3. **Select CP437 Font**
   - Click "Change Font" button
   - In font picker, search for your CP437 font:
     - "Perfect DOS VGA"
     - "Terminus"
     - "Unifont"
     - Or your installed CP437 font name
   - Select the font from the list

4. **Set Font Size**
   - Adjust font size slider (recommended: 14-16pt)
   - Click "OK" to save

5. **Verify Font Selection**
   - Font name should appear in "Font" field
   - Preview should show CP437 characters

## Testing CP437 Display

After configuring the font, test that CP437 characters display correctly:

```bash
# Test CP437 characters
node -e "process.stdout.write(Buffer.from([1, 219, 178, 177]))"
```

Expected output:
- Byte 1: ☺ (smiley face)
- Byte 219: █ (solid block)
- Byte 178: ▓ (medium shade)
- Byte 177: ▒ (light shade)

If these characters display correctly, your CP437 font is working!

## Troubleshooting

### Characters Don't Display Correctly

1. **Verify Font is Selected**
   - Check iTerm Preferences → Profiles → Text
   - Ensure CP437 font is selected

2. **Restart iTerm**
   - Close and reopen iTerm2
   - Font changes may require restart

3. **Check Font Installation**
   - Open Font Book app
   - Verify CP437 font is installed
   - If not, reinstall the font

4. **Try Different Font**
   - Switch to another CP437 font
   - Some fonts may have better character coverage

### Font Not Available in iTerm

1. **Verify Font Installation**
   - Check Font Book for installed fonts
   - Ensure font is installed system-wide

2. **Restart iTerm**
   - Font list may need refresh

3. **Check Font Format**
   - Ensure font is TTF or OTF format
   - Some font formats may not be supported

## Font Resources

### GitHub Repositories

Search GitHub for:
- `perfectdosvga`
- `dos-fonts`
- `cp437-fonts`
- `ibm-vga-font`

### Font Websites

- **dafont.com**: Search for "DOS" or "VGA" fonts
- **fontspace.com**: Search for "CP437" or "Code Page 437"
- **1001fonts.com**: Search for "DOS" fonts

### Package Managers

```bash
# Homebrew (macOS)
brew search font | grep -i dos
brew search font | grep -i terminus
brew search font | grep -i unifont
```

## Game Configuration

Once the CP437 font is configured in iTerm:

1. **Run the game** as normal
2. **Characters will display** using CP437 encoding
3. **Player character** (byte 1) shows as ☺
4. **Wall character** (byte 219) shows as █

The game automatically outputs CP437 bytes, and iTerm displays them using your selected CP437 font.

## Notes

- **Font must be monospace**: CP437 fonts are typically monospace
- **Terminal encoding**: iTerm should use UTF-8 (default)
- **Game outputs raw bytes**: The game outputs CP437 byte values directly
- **Font interprets bytes**: The CP437 font maps bytes to correct glyphs

## Alternative: Simple ASCII Mode

If CP437 font setup is problematic, you can switch the game to simple ASCII mode:

1. Edit `src/constants/characterSets/index.js`
2. Change `CHARACTER_SET` from `'zzt'` to `'simple'`
3. Game will use standard ASCII characters (works with any font)

