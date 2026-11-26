# Thousand

[English](#english) · [Русская версия](#русская-версия)

## English

Thousand («Тысяча») is my TypeScript learning project. I am building the engine for a browser game for three or four players with configurable house rules.

### How a game works

Three players take part in each deal. At a four-player table the dealer sits out and scores from the original talon. Each active player gets seven cards. Bidding starts at 100. The winner takes the three-card talon, gives one card to each opponent and sets a contract. Eight tricks follow. Cards are worth 120 points in total, and declared marriages earn bonuses.

At 880 a player enters the *barrel*. They can still bid below 120, but their final contract must be at least 120 and at least their winning bid. They have three attempts to win the auction and fulfil the contract in the same deal. [Rules v1.0 and a worked deal (in Russian)](./RULES.md#пример-одной-раздачи)

### What works today

- **Game state.** `createGame()` initializes two, three or four players in `WAITING` at round zero. Player 0 is the initial dealer in the implementation. Hands, deck and talon start empty. `GameState` tracks the turn, trump and its owner, the current trick and the winner. Each player has a score, round points, tricks won, bolts and barrel attempts used.
- **Cards and tricks.** The engine creates, shuffles and validates a deck, deals hands, finds legal moves, checks marriage declarations and calculates trick winners and points.

### Roadmap

Next comes the first deal and the transition out of `WAITING`. The phases are defined, and their transitions, bidding, contract settlement and automated tests are still to build. The two-player rules are [under discussion](./RULES.md#171-вариант-на-двоих-с-неиграющей-рукой). Later plans include a React interface with animated SVG cards, computer opponents and online play using the same engine.

### Where to work

- [Game engine](./thousand_game_engine.ts) — state types, initialization and card operations.
- [Constants](./constants.ts) and [settings](./settings.ts) — phases, card values, thresholds and per-game rule switches.
- [Rules and reference scenarios](./RULES.md#18-контрольные-сценарии) — expected outcomes for future tests.

### Author

Egor Smirnov (egsmrnv)  
https://egsmrnv.com

Thousand is my personal learning project. I design the architecture and write the code myself while learning TypeScript, data structures, and algorithms. I seek advice as I work, including from ChatGPT, which helps me think through tricky algorithmic cases and draft and translate `README.md` and `RULES.md`.

### License

All rights reserved. See [LICENSE](./LICENSE) for details.

## Русская версия

«Тысяча» — мой учебный проект на TypeScript. Я пишу движок браузерной игры для троих и четверых с настраиваемыми договорными правилами.

### Как проходит партия

В каждой раздаче играют трое. За столом на четверых сдающий пропускает розыгрыш и получает очки за исходный прикуп. Каждому активному игроку раздают по семь карт. Торги начинаются со 100. Победитель забирает три карты прикупа, отдаёт по одной каждому сопернику и объявляет заказ. Затем играют восемь взяток. Карты в сумме стоят 120 очков, а объявленные марьяжи приносят бонусы.

При достижении 880 игрок попадает на бочку. Он может торговаться ниже 120, но окончательный заказ должен быть не ниже 120 и не ниже выигранной ставки. Есть три попытки, чтобы выиграть торги и выполнить заказ в той же раздаче. [Правила v1.0 и пример раздачи](./RULES.md#пример-одной-раздачи)

### Что уже работает

- **Состояние партии.** `createGame()` создаёт двух, трёх или четырёх игроков. Начальная фаза — `WAITING`, номер раздачи — 0. В коде первым сдающим назначается игрок 0. Руки, колода и прикуп пока пусты. В `GameState` предусмотрены очередь хода, козырь и его владелец, текущая взятка и победитель партии. У каждого игрока есть общий счёт, очки и взятки за раздачу, болты и число использованных попыток на бочке.
- **Карты и взятки.** Движок создаёт, перемешивает и проверяет колоду, раздаёт карты по рукам, определяет допустимые ходы, проверяет право объявить марьяж, находит победителя взятки и считает её стоимость.

### План разработки

Ближайший шаг — начать первую раздачу из `WAITING`. Фазы уже описаны. Предстоит связать их переходами, реализовать торги и запись результата, добавить автоматические тесты. Правила игры вдвоём [ещё обсуждаются](./RULES.md#171-вариант-на-двоих-с-неиграющей-рукой). Дальше в планах интерфейс на React с анимированными SVG-картами, компьютерные соперники и игра по сети на общем движке.

### Файлы проекта

- [Игровой движок](./thousand_game_engine.ts) — типы состояния, создание партии и операции с картами.
- [Константы](./constants.ts) и [настройки](./settings.ts) — фазы, стоимость карт, пороги и переключатели правил партии.
- [Правила и контрольные сценарии](./RULES.md#18-контрольные-сценарии) — ожидаемые результаты для будущих тестов.

### Об авторе

[Егор Смирнов (egsmrnv)](https://egsmrnv.com)

Я сам проектирую архитектуру и пишу код, изучая TypeScript, структуры данных и алгоритмы. По ходу работы обращаюсь за советом, в том числе к ChatGPT. Он помогает мне разбирать сложные случаи в алгоритмах, готовить и переводить README.md и RULES.md.

### Лицензия

Все права защищены. Подробности — в [LICENSE](./LICENSE).
