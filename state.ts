import { GAME_PHASES, PENALTY_POINTS, BARREL_SCORE, BARREL_PENALTY_POINTS, SCORE_RESET_VALUE } from "./constants.ts";
import { createDeck, shuffleDeck } from "./deck.ts";
import type { GameState, PlayerState } from "./types.ts";

// ##############
// Shared game state operations.
// Общие операции с состоянием партии.
// ##############

/**
 * Возвращает активных игроков текущей раздачи.
 * Returns the active players of the current round.
*/
export function getActivePlayers(game: GameState): readonly PlayerState[] {
    if (game.players.length === 4)
        return game.players.filter(player => player.id !== game.dealerId);

    return game.players;
}

/**
 * Применяет штраф к игроку.
 * Applies penalty to a player.
*/
export function applyPenalty(game: GameState, player: PlayerState): void {
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
 * Отменяет текущую раздачу и начинает её заново.
 * - Сбрасывает состояние розыгрыша, торгов, прикупа и контракта.
 * - Сохраняет общий счёт игроков и накопленные счётчики.
 * - При необходимости передаёт право сдачи следующему игроку.
 *
 * Cancels the current round and starts it again.
 * - Resets playing, bidding, talon and contract states.
 * - Preserves player scores and accumulated counters.
 * - Passes the deal to the next player if required.
 *
 * @param game - Current game state. / Текущее состояние игры.
 * @param rotateDealer - Whether to change the dealer. / Менять ли сдающего.
*/
export function restartUnplayedRound(game: GameState, rotateDealer: boolean = false): void {
    let dealerIndex = game.players.findIndex(player => player.id === game.dealerId);

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    if (rotateDealer)
    {
        dealerIndex = (dealerIndex + 1) % game.players.length;
        game.dealerId = game.players[dealerIndex].id;
    }

    const cutterIndex = (dealerIndex + 1) % game.players.length;

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
    game.contract = null;

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
    game.currentPlayerId = game.players[cutterIndex].id;
    game.phase = GAME_PHASES.CUTTING;
}
