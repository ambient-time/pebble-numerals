# Numerals

One rectangular Pebble face with a saved choice of numeral system. Roman is the default. Hours, minutes and optional seconds use each system’s own signs and reading direction. Two-part mode updates each minute; three-part mode updates each second. Existing standalone faces keep their own identities.

Design by Luke Steuber for Ambient Time.

The 29 choices are Roman, Greek Ionic, Glagolitic, Etruscan, Aegean, Brahmi, Ge’ez, Hangul, Kaktovik, Maya, Babylonian, Counting Rods, Runic Pentimal, Cistercian, Ogham, Tally, Binary, Balanced Ternary, Negabinary, Binary-Coded Decimal, Gray Code, Hexadecimal, Factoradic, Braille, I Ching, Aztec, Tengwar, Klingon and Yautja.

Open Numerals settings in the Pebble phone app. Choose a numeral system and either **Hours and minutes** or **Hours, minutes, seconds**, then select **Save to watch**. Each choice has a preview and a reading guide. The preview follows the selected system and time groups, with an example time beneath it. Previews work offline and match the connected watch’s screen; if the phone cannot identify the watch, a labeled color example is shown. Hours use local 24-hour time. Most designs read down the screen; Maya, Cistercian and Ogham read across it. Some systems use modern zero conventions or fictional signs; the guide explains these adaptations. Braille is visual, on a flat screen.

The watch keeps the selection across restarts and tells time without a phone connection. The phone stores a change only after the watch confirms it. Failed delivery retries briefly; reconnect and save again if the watch does not change. No location, account or network data feed is needed.

Numerals 0.1.1 targets Basalt, Diorite, Emery and Flint. The frozen PBW and portable source ZIP are in `release/`; `evidence/index.html` lets you inspect every choice on every target in both modes. Native emulator checks are separate from physical-watch readability, battery life and real-phone delivery, which remain unverified. See `release/publication.json` in the main project for the current store receipt.

### Build and verification

Run `pebble build --sdk 4.33.1` to build from the included resources. To regenerate the artwork and run the tests, use Node.js, Python 3, Clang and:

```sh
npm ci --ignore-scripts
make art
make test
make build
```

`tools/capture.py <platform>` uses the Python environment that owns pebble-tool. It installs the production PBW in a separate emulator profile, captures all 29 choices in both modes, and checks persistence, invalid settings, zero and natural rollovers. The transfer is throttled to avoid a QEMU upload timeout with large resource packs. `tools/release.py` freezes the package and builds its source ZIP in a temporary directory outside the checkout.

### Sources and adaptations

The source collection is [Systems of Representation](https://datapoems.io/clocks/numerals/). `systems.json` records the stable IDs, source URLs, hashes and guides. `reference/` freezes the source pages; `reference/live-source-check.json` records their exact match to the live pages. Fonts and their licenses are in `reference/fonts/`. The artwork generator verifies source and font hashes before running.

Source glyphs become compact monochrome silhouettes, with a per-system foreground/background palette on color watches. Paper textures, glows and decorative shading are omitted. Values remain local hours, minutes and seconds. Geometry scales uniformly. Dense tally values wrap after six groups of five; Aztec dots wrap after five dots. Aegean marks have clear gaps. The compact binary-family choices use filled and hollow circles, with their different place values explained in settings. Stable system IDs are append-only. No auxiliary decimal clock or face labels are part of the design.
