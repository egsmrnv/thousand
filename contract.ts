
import { GAME_PHASES, BID_STEP, BARREL_SCORE, WIN_SCORE } from "./constants.ts";
import { getMaxBid } from "./bidding.ts";
import { getActivePlayers } from "./thousand_game_engine.ts";
import type { GameState, PlayerState } from "./types.ts";

/**
 * Возвращает заказчика на этапе объявления контракта.
 * Returns the winning bidder during the contract phase.
 */
function getContractPlayer(game: GameState, playerId: number): PlayerState | undefined {
    const bidding = game.bidding;

    if (game.phase !== GAME_PHASES.CONTRACT || bidding === null || game.exchange === null || game.contract !== null)
        return undefined;

    if (bidding.highestBidderId !== playerId || game.currentPlayerId !== playerId)
        return undefined;

    return getActivePlayers(game).find(player => player.id === playerId);
}

/**
 * Возвращает минимальный допустимый заказ (null если недоступно).
 * Returns the minimum points for contract (null if unavailable).
 */
export function getMinContract(game: GameState, playerId: number): number | null {
    const player = getContractPlayer(game, playerId);
    const bidding = game.bidding;

    if (player === undefined || bidding === null)
        return null;

    // (!) The final contract on the barrel must be at least WIN_SCORE - BARREL_SCORE (1000 - 880 = 120 for example).
    if (player.totalPoints === BARREL_SCORE)
        return Math.max(bidding.currentBid, WIN_SCORE - BARREL_SCORE);

    return bidding.currentBid;
}

/**
 * Возвращает максимально допустимый заказ (null если недопустимо).
 * Returns the maximum points for contract (null if unavailable).
 */
export function getMaxContract(game: GameState, playerId: number): number | null {
    const player = getContractPlayer(game, playerId);
    const minContract = getMinContract(game, playerId);

    if (player === undefined || minContract === null)
        return null;

    // (!) Losing a marriage during the exchange does not cancel or modify the winning bid.
    // > The player "remains responsible for fulfilling the contract" - not so seriously for this game, but like so LoL :).
    return Math.max(minContract, getMaxBid(player.hand, game.rules));
}

export function canDeclareContract(game: GameState, playerId: number, amount: number): boolean {
    if (!Number.isSafeInteger(amount) || amount % BID_STEP !== 0)
        return false;

    const minContract = getMinContract(game, playerId);
    const maxContract = getMaxContract(game, playerId);

    if (minContract === null || maxContract === null)
        return false;

    return amount >= minContract && amount <= maxContract;
}

/**
 * Фиксирует окончательный заказ и начинает игру.
 * Submits the final contract and moves to playing phase.
 */
export function declareContract(game: GameState, playerId: number, amount: number): void {
    if (!canDeclareContract(game, playerId, amount))
        throw new Error("Invalid contract.");

    game.contract = {
        playerId: playerId,
        amount: amount
    };

    // (!) Keep the original winning bid unchanged.
    // > The winning bidder leads the first trick.
    game.currentPlayerId = playerId;
    game.phase = GAME_PHASES.PLAYING;
}
