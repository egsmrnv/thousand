# Thousand

[English](#english) · [Русская версия](#русская-версия)

## English

Thousand («Тысяча») is a personal TypeScript learning project. The goal is a browser game in which three or four people can play the project's edition of Thousand with configurable house rules. Development is currently focused on the game engine. The next milestone is to represent players and the state of a deal so that the engine can track whose turn it is and what they may do.

For a worked example in Russian, follow [one deal from the auction to the score sheet](./RULES.md#пример-одной-раздачи).

### How a game works

At a three-player table everyone plays. At a four-player table the dealer sits out the auction and tricks and scores from the original talon. In both formats the engine needs to deal **three hands of seven cards** and set aside the last three cards as the talon.

1. **Bid for the talon.** Bidding opens at 100. A bid is a promise to earn points in this deal. In the default rules the bid limit is 120 plus the value of the marriages in the bidder’s hand.
2. **Set the contract.** The winner takes the talon, gives one card to each opponent, and names a final contract at least as high as the winning bid. Each active player now holds eight cards.
3. **Play eight tricks.** The bidder leads first. Each player plays one card, following suit when possible. The winner collects the cards and leads next. The deck is worth 120 points. Declaring a king and queen of the same suit when leading earns a bonus and makes their suit trump. By default the player must already have won a trick to do this.
4. **Keep score across deals.** Reaching 880 puts a player on the *barrel*. They may still bid below 120. If they win the auction, their final contract must be at least 120 and at least their winning bid. They have three attempts to win the auction and fulfil that contract in one deal.

The Russian [rules specification](./RULES.md) covers exceptions such as redeals, optional bid challenges and conceding a contract. Its version number (v1.0) identifies the rules edition. The [open questions](./RULES.md#17-открытые-вопросы) include the proposed two-player variant and how to settle simultaneous scoring events.

### What works today

| Area | Implemented in TypeScript | Still to build |
| --- | --- | --- |
| Cards and dealing | Create, shuffle and validate a deck. Distribute cards between hands and the talon and validate the distribution. | Seat players, rotate the dealer, cut the deck and handle redeal requests. |
| Bidding and the contract | Bid constants, marriage detection and per-game settings. | Run the auction, check bid limits and challenges, exchange cards and record the contract. |
| Trick play | Find legal cards, check eligibility to declare a marriage, identify the winning play and sum the trick’s card points. | Apply a play to game state, record the declaration, update trump and pass the lead. |
| Scoring | Count card points and evaluate the potential value of marriages in a hand. | Settle contracts, update cumulative scores and resolve penalties, bolts, the barrel and victory. |

The repository currently contains standalone TypeScript modules. A browser client, package scripts and an automated test suite are future work.

### Where to work

| File | What to look for |
| --- | --- |
| [RULES.md](./RULES.md) | Intended behavior, default settings, pending decisions and worked examples. The [reference scenarios](./RULES.md#18-контрольные-сценарии) give expected results for future tests. |
| [constants.ts](./constants.ts) | Suit and rank identifiers, card values, bid increments and score thresholds. |
| [settings.ts](./settings.ts) | The ten switches in `GameRules`, their defaults, and `createGameRules(overrides)` for an individual game. |
| [thousand_game_engine.ts](./thousand_game_engine.ts) | Internal types and functions for decks, deals, tricks and marriage detection. |

### Roadmap

- [x] Core card and deck mechanics, legal moves and trick evaluation
- [x] Per-game configuration and rules specification v1.0
- [ ] Player and game state models
- [ ] Complete round lifecycle, bidding and scoring
- [ ] Automated game engine tests
- [ ] React interface and SVG playing cards with animations
- [ ] AI opponents and online multiplayer

The browser client, computer-controlled opponents and a future multiplayer server are intended to share the same game logic.

### Author

Egor Smirnov (egsmrnv)  
https://egsmrnv.com

Thousand is my personal learning project. I design the architecture and write the code myself while learning TypeScript, data structures, and algorithms. I seek advice as I work, including from ChatGPT, which helps me think through tricky algorithmic cases and draft and translate `README.md` and `RULES.md`.

### License

All rights reserved. See [LICENSE](./LICENSE) for details.

## Русская версия

«Тысяча» — мой учебный проект на TypeScript. Я делаю браузерную версию карточной игры для трёх или четырёх участников. За столом можно будет выбрать, какие из договорных правил использовать. Сейчас я работаю над движком. Ближайшая задача — описать игроков и состояние раздачи, чтобы движок знал, чья очередь ходить и какие действия разрешены.

Посмотреть, как играют в «Тысячу», можно на [примере одной раздачи от торгов до записи очков](./RULES.md#пример-одной-раздачи).

### Как проходит партия

При игре втроём участвуют все. При игре вчетвером сдающий пропускает торги и розыгрыш, а очки получает за карты исходного прикупа. В обоих случаях **трое игроков получают по семь карт**. Ещё три карты откладывают в прикуп.

1. **Торги за прикуп.** Первый игрок объявляет 100. Ставкой игрок указывает, сколько очков берётся набрать за раздачу. По стандартным правилам предел ставки — 120 плюс стоимость марьяжей в руке участника торгов.
2. **Заказ.** Победитель торгов забирает прикуп, отдаёт по одной карте каждому сопернику и объявляет окончательный заказ. Заказ должен быть не ниже выигранной ставки. У каждого из троих теперь по восемь карт.
3. **Восемь взяток.** Первым заходит заказчик. Каждый кладёт одну карту, по возможности в масть захода. Победитель забирает взятку и заходит следующим. Все карты колоды вместе стоят 120 очков. Игрок с королём и дамой одной масти может на своём заходе сыграть одну из этих карт и объявить марьяж. Он получает бонус, а масть становится козырной. По стандартным правилам для объявления нужно уже взять хотя бы одну взятку в этой раздаче.
4. **Бочка и победа.** Когда игрок набирает 880 очков или больше, его счёт фиксируется на 880 — игрок попадает на бочку. Он по-прежнему может торговаться ниже 120. Если он выигрывает торги, его окончательный заказ должен быть не ниже 120 и не ниже выигранной ставки. У игрока три попытки, чтобы выиграть торги и выполнить свой заказ в той же раздаче.

В [правилах игры](./RULES.md) описаны пересдачи, оспаривание ставки при включённом блефе и роспись, при которой заказчик отказывается от розыгрыша. Номер v1.0 относится к редакции правил. Вариант на двоих и порядок расчёта при нескольких одновременных событиях ещё обсуждаются. [Открытые вопросы](./RULES.md#17-открытые-вопросы)

### Что уже работает

| Этап | Что умеет движок | Что предстоит сделать |
| --- | --- | --- |
| Колода и раздача | Создать, перемешать и проверить колоду. Разложить карты по рукам и в прикуп, проверить результат раздачи. | Закрепить места за игроками, передавать право сдачи, обрабатывать снятие колоды и запросы на пересдачу. |
| Торги и заказ | Заданы параметры ставок и настройки партии. Движок распознаёт марьяжи в руке. | Провести торги, проверить предел ставки, обработать оспаривание, обменять карты и записать заказ. |
| Взятки | Определить допустимые карты, проверить право объявить марьяж, найти победителя взятки и подсчитать стоимость карт. | После каждого хода обновлять состояние игры, учитывать объявление марьяжа и смену козыря, передавать ход. |
| Счёт | Сложить карточные очки и оценить, сколько дополнительно могут принести марьяжи в руке. | Рассчитать результат контракта и общий счёт, учесть штрафы, болты, бочку и определить победителя. |

Сейчас движок состоит из отдельных модулей TypeScript. Браузерный клиент, скрипты для запуска проекта и набор автоматических тестов входят в планы разработки.

### Файлы проекта

| Файл | Что в нём искать |
| --- | --- |
| [RULES.md](./RULES.md) | Правила этой версии игры, стандартные настройки, открытые вопросы и [контрольные сценарии](./RULES.md#18-контрольные-сценарии) с ожидаемыми результатами. |
| [constants.ts](./constants.ts) | Масти и ранги карт, их стоимость, шаг ставки и пороги счёта. |
| [settings.ts](./settings.ts) | Десять переключателей `GameRules`, их стандартные значения и функция `createGameRules(overrides)` для настройки отдельной партии. |
| [thousand_game_engine.ts](./thousand_game_engine.ts) | Типы и функции для работы с колодой, раздачей, взятками и марьяжами. |

### План разработки

- [x] Базовые операции с картами и колодой, определение допустимых ходов и победителя взятки
- [x] Настройки для каждой партии и редакция правил v1.0
- [ ] Модели игроков и состояния партии
- [ ] Полный цикл раздачи, торги и запись очков
- [ ] Автоматические тесты движка
- [ ] Интерфейс на React, карты в SVG и анимации
- [ ] Компьютерные соперники и игра по сети

Браузерный клиент, компьютерные соперники и будущий сервер для игры по сети будут использовать общую игровую логику.

### Об авторе

[Егор Смирнов (egsmrnv)](https://egsmrnv.com)

Я сам проектирую архитектуру и пишу код, изучая TypeScript, структуры данных и алгоритмы. По ходу работы обращаюсь за советом, в том числе к ChatGPT. Он помогает мне разбирать сложные случаи в алгоритмах, готовить и переводить README.md и RULES.md.

### Лицензия

Все права защищены. Подробности — в [LICENSE](./LICENSE).
