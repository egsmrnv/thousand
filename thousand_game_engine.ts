import { RANKS, GAME_PHASES, CUT_PENALTY_LIMIT, PENALTY_POINTS, BARREL_SCORE, BARREL_PENALTY_POINTS, SCORE_RESET_VALUE, MIN_HAND_POINTS, DRUMS_COUNT } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import { createDeck, shuffleDeck, validateDeck, dealCards, validateDeal } from "./deck.ts";
import type { GameState, PlayerState, CutResult } from "./types.ts";
import { getCardsPoints } from "./cards.ts";

// ##############
// Logic for game phases, rounds, and states.
// Логика игровых фаз, раундов и состояний.
// ##############

/**
 * Creates the new game with initial state.
 *
 * @param playerCount - Number of players. / Количество игроков.
 * @param rules - Game rules. / Правила игры.
 * @returns Initial game state. / Начальное состояние игры.
 */
export function createGame(
    playerCount: 2 | 3 | 4,
    rules: Readonly<GameRules> = DEFAULT_GAME_RULES
): GameState {
    const players: PlayerState[] = [];

    for (let i = 0; i < playerCount; i++) {
        players.push({
            id: i,
            hand: [],
            totalPoints: 0,
            roundPoints: 0,
            tricksWon: 0,
            bolts: 0,
            drumsRemaining: rules.enableDrums ? DRUMS_COUNT : 0,
            barrelAttemptsUsed: 0
        });
    }

    return {
        rules: Object.freeze({ ...rules }),
        players: players,
        bidding: null,
        exchange: null,
        phase: GAME_PHASES.WAITING,
        roundNumber: 0,
        cutting: {
            jackCount: 0,
            nineCount: 0
        },
        deck: [],
        talon: [],
        secondTalon: [],
        dealerId: players[0].id,
        currentPlayerId: null,
        trump: {
            suit: null,
            playerId: null
        },
        currentTrick: [],
        winnerId: null
    };
}

/**
 * Подготавливает новую раздачу.
 * Prepares a new round.
 *
 * @param game - Current game state. / Текущее состояние игры.
 */
export function startRound(game: GameState): void {
    if (game.phase !== GAME_PHASES.WAITING && game.phase !== GAME_PHASES.SCORING)
        throw new Error("Cannot start a round in the current phase.");

    if (game.winnerId !== null)
        throw new Error("The game is already finished.");

    let dealerIndex = game.players.findIndex(player => player.id === game.dealerId);

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    if (game.phase === GAME_PHASES.SCORING) {
        dealerIndex = (dealerIndex + 1) % game.players.length;
        game.dealerId = game.players[dealerIndex].id;
    }

    const cutterIndex = (dealerIndex + 1) % game.players.length;
    const cutter = game.players[cutterIndex];

    // Reset players round state
    for (const player of game.players) {
        player.hand = [];
        player.roundPoints = 0;
        player.tricksWon = 0;
    }

    // Reset states
    game.bidding = null;
    game.exchange = null;

    game.cutting = {
        jackCount: 0,
        nineCount: 0
    };

    // Prepare a new deck
    game.roundNumber++;
    game.deck = shuffleDeck(createDeck());
    game.talon = [];
    game.secondTalon = [];

    // Reset trump and current trick
    game.trump = {
        suit: null,
        playerId: null
    };

    game.currentTrick = [];

    // Start deck cutting phase
    game.currentPlayerId = cutter.id;
    game.phase = GAME_PHASES.CUTTING;
}

/**
 * Применяет стандартный штраф к игроку.
 * Applies a standard penalty to a player.
 */
export function applyPenalty(
    game: GameState,
    player: PlayerState
): void {
    if (!game.rules.enablePenalties)
        return;

    if (player.totalPoints === BARREL_SCORE) {
        player.totalPoints -= BARREL_PENALTY_POINTS;
        player.barrelAttemptsUsed = 0;
    }
    else {
        player.totalPoints -= PENALTY_POINTS;
    }

    // Score reset (+/- 555)
    if (
        game.rules.enableScoreReset &&
        Math.abs(player.totalPoints) === SCORE_RESET_VALUE
    )
        player.totalPoints = 0;
}

/**
 * Cнятие колоды (перед раздачей).
 * Performs a deck cut.
 *
 * @param game - Current game state. / Состояние партии.
 * @param cutCount - Number of cards to cut. / Количество снимаемых карт.
 * @returns Result of the deck cut. / Результат снятия колоды.
 */
export function cutDeck(game: GameState, cutCount: number): CutResult {
    // (!) Validate game phase
    if (game.phase !== GAME_PHASES.CUTTING)
        throw new Error("Cannot cut the deck in the current phase.");

    // Validate deck
    if (!validateDeck(game.deck))
        throw new Error("Invalid deck.");

    // (!) Validate the selected number of cards
    if (
        !Number.isInteger(cutCount) ||
        cutCount < 1 ||
        cutCount >= game.deck.length
    )
        throw new Error("Invalid cut count.");

    // Find the dealer and cutter
    const dealerIndex = game.players.findIndex(
        player => player.id === game.dealerId
    );

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    const cutterIndex = (dealerIndex + 1) % game.players.length;
    const dealer = game.players[dealerIndex];
    const cutter = game.players[cutterIndex];

    // Cut the deck
    const top = game.deck.slice(0, cutCount);
    const bottom = game.deck.slice(cutCount);

    game.deck = [...bottom, ...top];

    // Reveal the bottom card
    const revealedCard = game.deck[game.deck.length - 1];

    // (!) Check the revealed card
    if (revealedCard.rank === RANKS.JACK)
        game.cutting.jackCount++;

    else if (revealedCard.rank === RANKS.NINE)
        game.cutting.nineCount++;

    else {
        // > Successful cut
        game.phase = GAME_PHASES.DEALING;
        game.currentPlayerId = null;

        return {
            revealedCard,
            outcome: 0
        };
    }

    // Determine the player responsible for the penalty
    const penalizedPlayer =
        game.cutting.jackCount >= CUT_PENALTY_LIMIT
            ? dealer
            : game.cutting.nineCount >= CUT_PENALTY_LIMIT
                ? cutter
                : null;

    // (!) Penalty limit reached
    if (penalizedPlayer !== null) {
        applyPenalty(game, penalizedPlayer);

        // Rotate the dealer
        game.dealerId = cutter.id;

        const nextCutterIndex =
            (cutterIndex + 1) % game.players.length;

        game.currentPlayerId =
            game.players[nextCutterIndex].id;

        // Reset cutting counters
        game.cutting = {
            jackCount: 0,
            nineCount: 0
        };

        game.deck = shuffleDeck(game.deck);

        return {
            revealedCard,
            outcome: 2
        };
    }

    // (!) First or second Jack / Nine
    // > Shuffle the deck and repeat the cut
    game.deck = shuffleDeck(game.deck);

    return {
        revealedCard,
        outcome: 1
    };
}

export function getActivePlayers(game: GameState): readonly PlayerState[] {
    if (game.players.length === 4)
        return game.players.filter(player => player.id !== game.dealerId);

    return game.players;
}

/**
 * Распределяет карты между игроками.
 * Distributes cards between players.
 *
 * @param game - Current game state.
 */
export function dealRound(game: GameState): void {
    if (game.phase !== GAME_PHASES.DEALING)
        throw new Error("Cannot deal cards in the current phase.");

    const playerCount = game.players.length;

    if (playerCount !== 2 && playerCount !== 3 && playerCount !== 4)
        throw new Error("Unsupported player count.");

    const dealer = game.players.find(player => player.id === game.dealerId); // Find the dealer

    if (dealer === undefined)
        throw new Error("Dealer not found.");

    const handCount = playerCount === 2 ? 2 : 3;
    const { hands, talon, secondTalon } = dealCards(game.deck, handCount);

    if (!validateDeal(hands, talon, handCount, secondTalon))
        throw new Error("Invalid card distribution.");

    // Assign hands
    const activePlayers = getActivePlayers(game);
    for (let i = 0; i < activePlayers.length; i++)
        activePlayers[i].hand = hands[i];

    // (!) 4-player game:
    // > The dealer does not participate in the round.
    if (playerCount === 4)
        dealer.hand = [];

    game.talon = talon;
    game.secondTalon = secondTalon;
    game.deck = [];
}

/**
 * Проверяет право на пересдачу.
 * Checks if a player can redeal.
 *
 * @param game - Current game state.
 * @param playerId 
 * @returns Whether a redeal is allowed. (true / false)
 */
export function canRequestRedeal(game: GameState, playerId: number): boolean {
    return findEligibleRedealPlayer(game, playerId) !== undefined;
}

function findEligibleRedealPlayer(game: GameState, playerId: number): PlayerState | undefined {
    if (!game.rules.allowRedeal)
        return undefined;

    // (!) Redeal is allowed after dealing
    if (game.phase !== GAME_PHASES.DEALING)
        return undefined;

    const player = getActivePlayers(game).find(player => player.id === playerId);
    const handSize = game.players.length === 2 ? 10 : 7;

    // (!) Player must have a full dealt hand
    if (player === undefined || player.hand.length !== handSize)
        return undefined;

    if (game.rules.enableDrums && player.drumsRemaining <= 0)
        return undefined;

    const nineCount = player.hand.filter(card => card.rank === RANKS.NINE).length;
    const jackCount = player.hand.filter(card => card.rank === RANKS.JACK).length;

    // 4x9 or 4xJ 
    if (nineCount === 4 || jackCount === 4)
        return player;

    // (!) Not enough card points
    if (getCardsPoints(player.hand) < MIN_HAND_POINTS)
        return player;

    return undefined;
}

/**
 * Перезапускает несостоявшуюся раздачу.
 * Restarts an unplayed round.
 *
 * @param game - Current game state.
 * @param rotateDealer - Whether to rotate the dealer.
 */
export function restartUnplayedRound(
    game: GameState,
    rotateDealer: boolean = false
): void {
    let dealerIndex = game.players.findIndex(
        player => player.id === game.dealerId
    );

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    if (rotateDealer) {
        dealerIndex =
            (dealerIndex + 1) % game.players.length;

        game.dealerId = game.players[dealerIndex].id;
    }

    const cutterIndex =
        (dealerIndex + 1) % game.players.length;

    // Reset round state of all players
    for (const player of game.players) {
        player.hand = [];
        player.roundPoints = 0;
        player.tricksWon = 0;
    }

    // Prepare a new deck, reset trump
    game.deck = shuffleDeck(createDeck());
    game.talon = [];
    game.secondTalon = [];
    game.currentTrick = [];
    game.bidding = null;
    game.exchange = null;

    game.trump = {
        suit: null,
        playerId: null
    };

    // Reset counters
    game.cutting = {
        jackCount: 0,
        nineCount: 0
    };

    // Return to CUTTING game phase
    game.currentPlayerId =
        game.players[cutterIndex].id;

    game.phase = GAME_PHASES.CUTTING;
}

export function requestRedeal(game: GameState, playerId: number): void {
    const player = findEligibleRedealPlayer(game, playerId);
    if (player === undefined)
        throw new Error("Redeal is not allowed.");

    restartUnplayedRound(game);

    if (game.rules.enableDrums)
        player.drumsRemaining--;
}
