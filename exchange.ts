
import { GAME_PHASES, MIN_TALON_POINTS } from "./constants.ts";
import { getCardId, getCardsPoints, getCardsPointsWithMarriages } from "./cards.ts";
import { validateDeal } from "./deck.ts";
import { getActivePlayers, restartUnplayedRound } from "./state.ts";
import type { Card, CardTransfer, GameState, PlayerState } from "./types.ts";

/**
 * Возвращает победителя торгов на этапе обмена.
 * Returns the winning bidder during the exchange phase.
*/
function getExchangeWinPlayer(game: GameState, playerId: number): PlayerState | undefined {
    const bidding = game.bidding;

    if (game.phase !== GAME_PHASES.EXCHANGING || bidding === null)
        return undefined;

    if (bidding.highestBidderId !== playerId || game.currentPlayerId !== playerId)
        return undefined;

    return getActivePlayers(game).find(player => player.id === playerId);
}

export function canTakeTalon(game: GameState, playerId: number, talonIndex: 0 | 1 = 0): boolean {
    const player = getExchangeWinPlayer(game, playerId);

    if (player === undefined || game.exchange !== null)
        return false;

    const playerCount = game.players.length;

    if (playerCount !== 2 && playerCount !== 3 && playerCount !== 4)
        return false;

    if (talonIndex !== 0 && talonIndex !== 1)
        return false;

    // (!) The second talon exists only in a two-player game
    if (talonIndex === 1 && playerCount !== 2)
        return false;

    const handCount = playerCount === 2 ? 2 : 3;
    const activePlayers = getActivePlayers(game);

    return game.deck.length === 0 && validateDeal(activePlayers.map(player => player.hand), game.talon, handCount, game.secondTalon);
}


/**
 * Возвращает полученный прикуп, если игрок вправе его видеть.
 * Returns the selected talon if it is visible to the player.
*/
export function getVisibleTalon(game: GameState, playerId: number): readonly Card[] {
    const bidding = game.bidding;
    const exchange = game.exchange;

    if (bidding === null || exchange === null)
        return [];

    if (!game.players.some(player => player.id === playerId))
        return [];

    // (!) Reveal the talon to all players if required by the rules
    if (game.rules.alwaysRevealTalon)
        return exchange.selectedTalon;

    // (!) The winning bidder can always see the selected talon
    if (bidding.highestBidderId === playerId)
        return exchange.selectedTalon;

    // (!) Other players see it only if a bid was raised
    return bidding.hasRaised ? exchange.selectedTalon : [];
}

/**
 * Проверяет право на пересдачу по слабому прикупу.
 * Checks eligibility for a weak-talon redeal.
*/
export function canRequestTalonRedeal(game: GameState, playerId: number): boolean {
    if (!game.rules.allowRedeal)
        return false;

    const player = getExchangeWinPlayer(game, playerId);
    const exchange = game.exchange;

    if (player === undefined || exchange === null)
        return false;

    // (!) Check the remaining drums
    if (game.rules.enableDrums && player.drumsRemaining <= 0)
        return false;

    // (!) Only the selected talon is checked
    // > Card points without marriage bonuses.
    return getCardsPoints(exchange.selectedTalon) < MIN_TALON_POINTS;
}

export function canExchangeCards(game: GameState, playerId: number, transfers: readonly CardTransfer[]): boolean {
    const player = getExchangeWinPlayer(game, playerId);

    if (player === undefined || game.exchange === null)
        return false;

    const opponents = getActivePlayers(game).filter(
        opponent => opponent.id !== playerId
    );

    const isTwoPlayerGame = game.players.length === 2;

    const expectedHandSize = isTwoPlayerGame ? 12 : 10;
    const opponentHandSize = isTwoPlayerGame ? 10 : 7;

    if (player.hand.length !== expectedHandSize)
        return false;

    if (opponents.some(opponent => opponent.hand.length !== opponentHandSize))
        return false;

    // (!) Each opponent must receive exactly one card
    if (transfers.length !== opponents.length)
        return false;

    const recipientIds = new Set<number>();
    const cardIds = new Set<number>();

    for (const transfer of transfers) {
        const opponent = opponents.find(opponent => opponent.id === transfer.recipientId);

        if (opponent === undefined)
            return false;

        const card = player.hand.find(card => card.suit === transfer.card.suit && card.rank === transfer.card.rank);

        // (!) The card must belong to the winning bidder
        if (card === undefined)
            return false;

        const cardId = getCardId(card);

        // (!) Prevent duplicate cards and recipients
        if (recipientIds.has(transfer.recipientId) || cardIds.has(cardId))
            return false;

        recipientIds.add(transfer.recipientId);
        cardIds.add(cardId);
    }

    return true;
}

/**
 * Передаёт выбранный прикуп победителю торгов.
 * Gives the selected talon to the bidding phase winner.
*/
export function takeTalon(game: GameState, playerId: number, talonIndex: 0 | 1 = 0): void {
    const player = getExchangeWinPlayer(game, playerId);

    if (player === undefined || !canTakeTalon(game, playerId, talonIndex))
        throw new Error("Cannot take the talon.");

    const selectedTalon = talonIndex === 0 ? game.talon : game.secondTalon;

    // (!) At a four-player table, save the dealer's talon points.
    // > Only standard marriages are included.
    const dealerTalonPoints = game.players.length === 4 ? getCardsPointsWithMarriages(selectedTalon, { ...game.rules, allowAceMarriage: false }) : 0;

    // Save the original selected talon
    game.exchange = {
        talonIndex: talonIndex,
        selectedTalon: [...selectedTalon],
        dealerTalonPoints: dealerTalonPoints
    };

    // Add the selected cards to the player's hand
    player.hand = [...player.hand, ...selectedTalon];

    // Clear only the selected talon
    if (talonIndex === 0)
        game.talon = [];
    else
        game.secondTalon = [];
}

export function requestTalonRedeal(game: GameState, playerId: number): void {
    const player = getExchangeWinPlayer(game, playerId);

    if (player === undefined || !canRequestTalonRedeal(game, playerId))
        throw new Error("Talon redeal is not allowed.");

    restartUnplayedRound(game);

    // (!) Spend one drum only after a successful redeal
    if (game.rules.enableDrums)
        player.drumsRemaining--;
}


/**
 * Передаёт карты игрокам и завершает обмен.
 * Transfers cards to other players and finishes the exchange phase.
*/
export function exchangeCards(game: GameState, playerId: number, transfers: readonly CardTransfer[]): void {
    const player = getExchangeWinPlayer(game, playerId);

    if (player === undefined || !canExchangeCards(game, playerId, transfers))
        throw new Error("Invalid card exchange.");

    const opponents = getActivePlayers(game).filter(opponent => opponent.id !== playerId);

    const transferredCardIds = new Set<number>();

    // All transfers have already been validated
    for (const transfer of transfers) {
        const opponent = opponents.find(opponent => opponent.id === transfer.recipientId)!;
        const card = player.hand.find(card => card.suit === transfer.card.suit && card.rank === transfer.card.rank)!;

        opponent.hand = [...opponent.hand, card];
        transferredCardIds.add(getCardId(card));
    }

    // Remove the transferred cards from the winning bidder's hand
    player.hand = player.hand.filter( card => !transferredCardIds.has(getCardId(card)));

    // (!) Exchange completed
    game.phase = GAME_PHASES.CONTRACT;
    game.currentPlayerId = playerId;
}