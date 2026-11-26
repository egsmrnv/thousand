import { RANKS, GAME_PHASES, CUT_PENALTY_LIMIT, PENALTY_POINTS, BARREL_SCORE, BARREL_PENALTY_POINTS, SCORE_RESET_VALUE } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import { createDeck, shuffleDeck, validateDeck } from "./deck.ts";
import type { GameState, PlayerState, CutResult } from "./types.ts";

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
            barrelAttemptsUsed: 0
        });
    }

    return {
        rules: Object.freeze({ ...rules }),
        players: players,
        phase: GAME_PHASES.WAITING,
        roundNumber: 0,
        cutting: {
            jackCount: 0,
            nineCount: 0
        },
        deck: [],
        talon: [],
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

    // Reset cutting state
    game.cutting = {
        jackCount: 0,
        nineCount: 0
    };

    // Prepare a new deck
    game.roundNumber++;
    game.deck = shuffleDeck(createDeck());
    game.talon = [];

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

        if (game.rules.enablePenalties) {

            if (penalizedPlayer.totalPoints === BARREL_SCORE) {
                penalizedPlayer.totalPoints -= BARREL_PENALTY_POINTS;
                penalizedPlayer.barrelAttemptsUsed = 0;
            }
            else {
                penalizedPlayer.totalPoints -= PENALTY_POINTS;
            }

            // Score reset (+/- 555)
            if (
                game.rules.enableScoreReset &&
                Math.abs(penalizedPlayer.totalPoints) === SCORE_RESET_VALUE
            )
                penalizedPlayer.totalPoints = 0;
        }

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
