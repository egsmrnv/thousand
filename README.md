# Thousand

[English](#english) · [Русская версия](#русская-версия)

## English

Thousand («Тысяча») is my TypeScript learning project. I am building the engine for a browser game with configurable house rules for tables of two, three or four.

### How a game works

At tables of three or four, three players take part in each deal. At a four-player table the dealer sits out and scores from the original talon. Each active player gets seven cards. Bidding starts at 100. The winner takes the three-card talon, gives one card to each opponent and sets a contract. Eight tricks follow. Cards are worth 120 points in total, and declared marriages earn bonuses.

At a two-player table, each player receives ten cards and there are two face-down talons of two cards each. The auction winner chooses one blindly and gives one card to the opponent. Eleven two-card tricks follow. The winner of the last trick also earns the card points of the remaining talon, without marriage bonuses. The same bidding limits and barrel rules apply. [Two-player rules](./RULES.md#21-игра-вдвоём-с-двумя-прикупами).

The final contract cannot be lower than the winning bid, even if a marriage is lost during the exchange. The player remains responsible for fulfilling the contract; losing a marriage is not a penalty.

At 880 a player enters the *barrel*. They can still bid below 120, but their final contract must be at least 120 and at least their winning bid. They have three attempts to win the auction and fulfil the contract in the same deal. [Rules v1.3 and a worked deal (in Russian)](./RULES.md#пример-одной-раздачи)

### What works today

- `createGame()` initializes two, three or four players at round zero in `WAITING`. Scores start at zero, hands are empty, and the first dealer is chosen at random.
- `startRound()` shuffles the deck and assigns the cutter. After scoring, the next player deals. `cutDeck()` handles retries and penalties, then moves the game to `DEALING` on a successful cut.
- At tables of two, three or four, `dealRound()` assigns hands and the talon (two talons for two players). A player may request a redeal on hand-based grounds (including fewer than 14 points in a seven-card hand or fewer than 28 in a ten-card hand). `startBidding()` opens at 100, `raiseBid()` advances the auction, `passBid()` passes and finishes the auction when one bidder remains, and `challengeBid()` checks the latest raise when bluffing and penalties are enabled. An unsupported bid is capped at 320. A confirmed bluff penalizes the bidder and restarts the deal with the next dealer.
- The winner uses `takeTalon()` to take the talon or choose one of two in a two-player game. `getVisibleTalon()` applies the auction’s visibility rule or the `alwaysRevealTalon` setting. At a four-player table, the engine saves the original talon value for the dealer’s later scoring.
- With redeals enabled, the winner can use `requestTalonRedeal()` after taking a talon worth fewer than five card points. If play continues, the winner uses `exchangeCards()` to give one card to each active opponent and advance to `CONTRACT`.
- `getMinContract()` and `getMaxContract()` determine the final contract range after the exchange, including the barrel minimum and the winning bid. `canDeclareContract()` validates the amount in steps of five; `declareContract()` stores it separately from the auction bid and advances to `PLAYING`, with the winner leading the first trick. `canResignContract()` and `resignContract()` allow resignation before the first card is played, except on the barrel. Resignation moves the deal to `SCORING`; score settlement is not implemented yet.
- With `createGameRules({ enableDrums: true })`, each player starts with three drums. A successful redeal request based on either the hand or the talon spends one drum. The option is off by default. [Redeal rules (in Russian)](./RULES.md#41-барабаны)
- Individual functions can deal and validate hands, detect marriages, find legal moves and determine a trick’s winner and points.

### Roadmap

Next come playing tricks, declaring marriages during play and enforcing DangerZone (already present as a setting). Scoring will include the dealer’s original talon value at a four-player table and the remaining talon’s card points for the winner of the last trick in a two-player game. Later milestones include automated tests, a React client with animated SVG cards, computer opponents and online play.

### Where to work

Start with [thousand_game_engine.ts](./thousand_game_engine.ts) and follow `createGame()`, `startRound()` and `cutDeck()` to see how the game changes state. Shared state operations live in [state.ts](./state.ts): `getActivePlayers()`, `applyPenalty()` and `restartUnplayedRound()`. The engine and other gameplay modules import them directly; `state.ts` does not import the engine. Import card, deck, bidding, exchange, contract and trick operations directly from the modules below.

| Module | What belongs here |
| --- | --- |
| [constants.ts](./constants.ts) | Suits, ranks, card and marriage values, phases and fixed thresholds. |
| [settings.ts](./settings.ts) | House rules, defaults and per-game overrides (`createGameRules`). |
| [types.ts](./types.ts) | Shared types such as `Card`, `PlayedCard` and `GameState`. |
| [state.ts](./state.ts) | Active players, standard penalties and restarting an unplayed or cancelled round. |
| [thousand_game_engine.ts](./thousand_game_engine.ts) | Game initialization, starting a round, cutting, dealing and hand-based redeals. |
| [cards.ts](./cards.ts) | Card points and combinations in a hand. `findMarriages()` finds king–queen pairs. |
| [deck.ts](./deck.ts) | Create, validate, shuffle and deal a deck. `dealCards()` returns hands and one or two talons. |
| [bidding.ts](./bidding.ts) | Bid limits, opening and finishing the auction, raising, passing and challenging bids. |
| [exchange.ts](./exchange.ts) | Taking and showing the selected talon, weak-talon redeals and exchanging cards. |
| [contract.ts](./contract.ts) | Final contract limits, validation, declaration and resignation. |
| [tricks.ts](./tricks.ts) | Which card can be played, whether a marriage can be declared on that play, and who wins the trick. |

[Rules and reference scenarios](./RULES.md#18-контрольные-сценарии) give the expected results for individual plays and deals.

### Author

Egor Smirnov (egsmrnv)  
https://egsmrnv.com

Thousand is my personal learning project. I design the architecture and write the code myself while learning TypeScript, data structures, and algorithms. I seek advice as I work, including from ChatGPT, which helps me think through tricky algorithmic cases and draft and translate `README.md` and `RULES.md`.

### License

All rights reserved. See [LICENSE](./LICENSE) for details.

## Русская версия

«Тысяча» — мой учебный проект на TypeScript. Я пишу движок браузерной игры для двоих, троих и четверых с настраиваемыми договорными правилами.

### Как проходит партия

За столом на трёх или четырёх человек в каждой раздаче играют трое. За столом на четверых сдающий пропускает розыгрыш и получает очки за исходный прикуп. Каждому активному игроку раздают по семь карт. Торги начинаются со 100. Победитель забирает три карты прикупа, отдаёт по одной каждому сопернику и объявляет заказ. Затем играют восемь взяток. Карты в сумме стоят 120 очков, а объявленные марьяжи приносят бонусы.

Вдвоём каждому раздают по десять карт, а ещё четыре карты образуют два закрытых прикупа по две карты. Победитель торгов выбирает один вслепую и отдаёт одну карту сопернику. Играют одиннадцать взяток по две карты. Победитель последней взятки дополнительно получает карточные очки оставшегося прикупа без бонусов за марьяжи. Лимиты ставок и правила бочки прежние. [Правила игры вдвоём](./RULES.md#21-игра-вдвоём-с-двумя-прикупами).

Окончательный заказ не может быть меньше выигранной ставки, даже если при обмене игрок потерял марьяж. Игрок сам отвечает за выполнение заказа; штраф за потерю марьяжа не начисляется.

При достижении 880 игрок попадает на бочку. Он может торговаться ниже 120, но окончательный заказ должен быть не ниже 120 и не ниже выигранной ставки. Есть три попытки, чтобы выиграть торги и выполнить заказ в той же раздаче. [Правила v1.3 и пример раздачи](./RULES.md#пример-одной-раздачи)

### Что уже работает

- `createGame()` создаёт двух, трёх или четырёх игроков в фазе `WAITING`. Номер раздачи и очки равны нулю, руки пусты. Первый сдающий выбирается случайно.
- `startRound()` перемешивает колоду и назначает снимающего. После подсчёта очков сдаёт следующий игрок. `cutDeck()` обрабатывает повторные снятия и штрафы, а при успешном снятии переводит партию в `DEALING`.
- Вдвоём, втроём и вчетвером `dealRound()` раздаёт руки и прикуп (вдвоём — два прикупа). Игрок может запросить пересдачу по своей руке (в том числе при менее 14 очках в семикарточной руке или менее 28 в десятикарточной). `startBidding()` открывает торги со 100, `raiseBid()` повышает ставку, `passBid()` обрабатывает пас и завершает торги, когда остаётся один участник. При включённых блефе и штрафах соперник может оспорить последнее повышение через `challengeBid()`. Необоснованная ставка ограничена 320 очками. Подтверждённый блеф ведёт к штрафу и новой сдаче со следующим сдающим.
- Победитель торгов получает прикуп через `takeTalon()`, а вдвоём выбирает один из двух. `getVisibleTalon()` учитывает ход торгов и настройку `alwaysRevealTalon`. Вчетвером движок сохраняет исходную стоимость прикупа для последующего начисления сдающему.
- При включённых пересдачах победитель может вызвать `requestTalonRedeal()` после получения прикупа стоимостью меньше пяти карточных очков. Если раздача продолжается, победитель передаёт по одной карте каждому активному сопернику через `exchangeCards()`. Движок переходит в `CONTRACT`.
- `getMinContract()` и `getMaxContract()` определяют границы окончательного заказа после обмена с учётом бочки и выигранной ставки. `canDeclareContract()` проверяет заказ, кратный пяти; `declareContract()` сохраняет его отдельно от ставки торгов и переводит игру в `PLAYING`, оставляя первый ход заказчику. `canResignContract()` и `resignContract()` разрешают роспись до первого сыгранного хода, кроме заказчика на бочке. Роспись переводит раздачу в `SCORING`; запись итоговых очков ещё не реализована.
- При `createGameRules({ enableDrums: true })` у каждого игрока по три барабана на партию. Успешная пересдача по руке или прикупу расходует один барабан. По умолчанию опция выключена. [Правила пересдачи](./RULES.md#41-барабаны)
- Отдельные функции раскладывают карты по рукам, проверяют раздачу, находят марьяжи и допустимые ходы, определяют победителя и стоимость взятки.

### План разработки

Ближайшие шаги — розыгрыш взяток, объявление марьяжей во время розыгрыша и реализация DangerZone (переключатель уже существует). При подсчёте очков предстоит учесть стоимость исходного прикупа у сдающего вчетвером и карточные очки оставшегося прикупа у победителя последней взятки вдвоём. Дальше в планах автотесты, интерфейс на React с анимированными SVG-картами, компьютерные соперники и игра по сети.

### Файлы проекта

Начните с [thousand_game_engine.ts](./thousand_game_engine.ts). По функциям `createGame()`, `startRound()` и `cutDeck()` можно проследить, как меняется состояние партии. Общие операции с состоянием находятся в [state.ts](./state.ts): `getActivePlayers()`, `applyPenalty()` и `restartUnplayedRound()`. Движок и игровые модули импортируют их напрямую; `state.ts` не импортирует движок. Функции для работы с картами, колодой, торгами, обменом, контрактом и взятками импортируйте напрямую из модулей ниже.

| Модуль | Что в нём искать |
| --- | --- |
| [constants.ts](./constants.ts) | Масти, ранги, стоимость карт и марьяжей, фазы и фиксированные пороги. |
| [settings.ts](./settings.ts) | Договорные правила, стандартные значения и настройки отдельной партии (`createGameRules`). |
| [types.ts](./types.ts) | Общие типы, в том числе `Card`, `PlayedCard` и `GameState`. |
| [state.ts](./state.ts) | Активные игроки, стандартные штрафы и перезапуск несостоявшейся или отменённой раздачи. |
| [thousand_game_engine.ts](./thousand_game_engine.ts) | Создание партии, начало раздачи, снятие, раздача карт и пересдача по руке. |
| [cards.ts](./cards.ts) | Карточные очки и комбинации в руке. Например, `findMarriages()` находит пары из короля и дамы. |
| [deck.ts](./deck.ts) | Создание, проверка, перемешивание и раздача колоды. `dealCards()` возвращает руки и один или два прикупа. |
| [bidding.ts](./bidding.ts) | Предел ставки, начало и завершение торгов, повышение, пас и оспаривание ставки. |
| [exchange.ts](./exchange.ts) | Получение и показ выбранного прикупа, пересдача по слабому прикупу и обмен картами. |
| [contract.ts](./contract.ts) | Границы окончательного заказа, проверка, объявление и роспись контракта. |
| [tricks.ts](./tricks.ts) | Какой картой можно пойти, можно ли объявить марьяж при этом ходе и кто забирает взятку. |

В [контрольных сценариях](./RULES.md#18-контрольные-сценарии) можно сверить ожидаемый результат хода или раздачи.

### Об авторе

[Егор Смирнов (egsmrnv)](https://egsmrnv.com)

Я сам проектирую архитектуру и пишу код, изучая TypeScript, структуры данных и алгоритмы. По ходу работы обращаюсь за советом, в том числе к ChatGPT. Он помогает мне разбирать сложные случаи в алгоритмах, готовить и переводить README.md и RULES.md.

### Лицензия

Все права защищены. Подробности — в [LICENSE](./LICENSE).
