# Thousand

A browser-based implementation of the classic Thousand (1000) card game, with configurable rules and a modular TypeScript game engine.

The project aims to preserve the strategy and social interaction of traditional card games while providing a modern, accessible browser experience.

## Game rules

The project follows its own documented edition of Thousand, based on traditional rules and configurable house rules.

See [RULES.md](./RULES.md) for the complete game rules specification (v1.0), including scoring, bidding, optional bluffing, marriages, penalties, redeals, and the barrel (880-point endgame).

The specification defines the intended game behavior and includes open questions and reference scenarios for future tests. Not every documented rule is implemented yet. A two-player variant with a third hand dealt and kept out of play is under discussion.

## Current features

- Modular TypeScript game engine
- Card, deck, hand, and trick models
- Deck generation, shuffling, dealing, and validation
- Card scoring and marriage detection
- Legal move validation and trick winner calculation
- Configurable rules with independent configurations for each game

## Project structure

| File | Purpose |
| --- | --- |
| [`constants.ts`](./constants.ts) | Card definitions, scoring values, and fixed game parameters |
| [`settings.ts`](./settings.ts) | Configurable game rules and default settings |
| [`thousand_game_engine.ts`](./thousand_game_engine.ts) | Core game logic and data models |
| [`RULES.md`](./RULES.md) | Game rules specification and reference scenarios |

The engine is being developed separately from the user interface so that the same game logic can be reused by the browser client, computer-controlled opponents, and a future multiplayer server.

## Roadmap

- [x] Core card and deck mechanics
- [x] Legal moves, tricks, and marriage validation
- [x] Modular rule configuration
- [x] Game rules specification (v1.0)
- [ ] Player and game state models
- [ ] Complete round lifecycle, bidding, and scoring
- [ ] Automated game engine tests
- [ ] React-based interface
- [ ] SVG playing cards and animations
- [ ] AI opponents
- [ ] Online multiplayer

## Development

This project is currently in early development. The focus is on building a reliable game engine before implementing the browser interface.

The rules specification is versioned independently of the software. Rules v1.0 does not indicate a playable v1.0 release.

## Author

Egor Smirnov (egsmrnv)  
https://egsmrnv.com

Thousand is my personal learning project. I design the architecture and write the code myself while learning TypeScript, data structures, and algorithms. I seek advice as I work, including from ChatGPT, which helps me think through tricky algorithmic cases and draft and translate `README.md` and `RULES.md`.

## License

All rights reserved. See [LICENSE](./LICENSE) for details.
