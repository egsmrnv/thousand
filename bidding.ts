import { getCardsPoints, getHandMarriagePoints } from "./cards.ts";
import { GAME_PHASES, MIN_BID, BID_STEP, MAX_BLUFF_BID } from "./constants.ts";
import { createDeck, validateDeal } from "./deck.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import { applyPenalty, getActivePlayers, restartUnplayedRound } from "./thousand_game_engine.ts";
import type { Card, GameState } from "./types.ts";

const deckCardPoints = getCardsPoints(createDeck());

export function getMaxBid(hand: readonly Card[], rules: Readonly<GameRules> = DEFAULT_GAME_RULES): number {
    return deckCardPoints + getHandMarriagePoints(hand, rules);
}

export function startBidding(game: GameState): void {
    if (game.phase !== GAME_PHASES.DEALING)
        throw new Error("Cannot start bidding.");

    const playerCount = game.players.length;

    if (playerCount !== 2 && playerCount !== 3 && playerCount !== 4)
        throw new Error("Unsupported player count.");

    const dealerIndex = game.players.findIndex(player => player.id === game.dealerId);

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    const activePlayers = getActivePlayers(game);
    const handCount = playerCount === 2 ? 2 : 3;

    // (!) Cards must already be dealt
    if (game.deck.length !== 0 || !validateDeal(activePlayers.map(player => player.hand), game.talon, handCount, game.secondTalon))
        throw new Error("Invalid card distribution.");

    const firstBidderIndex = (dealerIndex + 1) % playerCount;
    const nextBidderIndex = (firstBidderIndex + 1) % playerCount;

    // (!) The first player starts with the minimum bid
    game.bidding = {
        currentBid: MIN_BID,
        highestBidderId: game.players[firstBidderIndex].id,
        passedPlayerIds: [],
        hasRaised: false,
        challengeOpen: false
    };

    game.currentPlayerId = game.players[nextBidderIndex].id; // Pass the turn to the next bidder
    game.phase = GAME_PHASES.BIDDING;
}

/**
 * Повышает ставку и передаёт ход следующему участнику торгов.
 * Raises the bid and passes the turn to the next bidder.
 */
export function raiseBid(game: GameState, playerId: number, amount: number): void {
    const bidding = game.bidding;

    if (bidding === null || !canRaiseBid(game, playerId, amount))
        throw new Error("Cannot raise this bid.");

    // Update bidding state
    bidding.currentBid = amount;
    bidding.highestBidderId = playerId;
    bidding.hasRaised = true;

    // Open a new challenge window
    bidding.challengeOpen = game.rules.enablePenalties && game.rules.allowBidBluff;
    moveBidding(game);
}

/**
 * Оспаривает текущую ставку.
 * Challenges the current bid.
 *
 * @param game - Current game state.
 * @param playerId - Challenging player.
 * @returns Whether a violation was confirmed. (true / false)
 */
export function challengeBid(game: GameState, playerId: number): boolean {
    if (game.phase !== GAME_PHASES.BIDDING)
        throw new Error("Bidding is not active.");

    if (!game.rules.enablePenalties || !game.rules.allowBidBluff)
        throw new Error("Bid challenges are disabled.");

    const bidding = game.bidding;

    if (bidding === null || !bidding.challengeOpen)
        throw new Error("Challenge window is closed.");

    const activePlayers = getActivePlayers(game);

    const challenger = activePlayers.find(player => player.id === playerId);

    // (!) A player cannot challenge their own bid
    if (challenger === undefined || playerId === bidding.highestBidderId)
        throw new Error("Cannot challenge this bid.");

    const bidder = activePlayers.find(player => player.id === bidding.highestBidderId);

    if (bidder === undefined)
        throw new Error("Bidder not found.");

    const maxBid = getMaxBid(bidder.hand, game.rules);
    bidding.challengeOpen = false;

    // (!) The bid is justified
    if (bidding.currentBid <= maxBid)
        return false;

    // (!) Bluff confirmed
    applyPenalty(game, bidder);

    // Cancel the round and rotate the dealer
    restartUnplayedRound(game, true);

    return true;
}

function canActInBidding(game: GameState, playerId: number): boolean {
    const bidding = game.bidding;

    if (game.phase !== GAME_PHASES.BIDDING || bidding === null)
        return false;

    if (game.currentPlayerId !== playerId)
        return false;

    if (bidding.highestBidderId === playerId)
        return false;

    if (bidding.passedPlayerIds.includes(playerId))
        return false;

    return getActivePlayers(game).some(player => player.id === playerId);
}

/**
 * Проверяет возможность повышения ставки.
 * Checks whether a player can raise the bid.
 *
 * @param game - Current game state.
 * @param playerId - Bidding player.
 * @param amount - Bid amount.
 * @returns Whether the bid is allowed. (true / false)
 */
export function canRaiseBid(game: GameState, playerId: number, amount: number): boolean {
    const bidding = game.bidding;

    if (bidding === null || !canActInBidding(game, playerId))
        return false;

    // (!) Validate the bid increment
    if (!Number.isSafeInteger(amount) || amount !== bidding.currentBid + BID_STEP)
        return false;

    const player = game.players.find(player => player.id === playerId);

    if (player === undefined)
        return false;

    const maxBid = getMaxBid(player.hand, game.rules);

    // (!) A justified bid is always allowed
    if (amount <= maxBid)
        return true;

    // (!) Bluffing is limited to MAX_BLUFF_BID
    const canBluff = game.rules.enablePenalties && game.rules.allowBidBluff;

    return canBluff && amount <= MAX_BLUFF_BID;
}

export function canPassBid(game: GameState, playerId: number): boolean {
    return canActInBidding(game, playerId);
}


export function passBid(game: GameState, playerId: number): void {
    const bidding = game.bidding;

    if (bidding === null || !canPassBid(game, playerId))
        throw new Error("Cannot pass.");

    bidding.passedPlayerIds = [...bidding.passedPlayerIds, playerId];
    bidding.challengeOpen = false;
    moveBidding(game);
}

/**
 * Переводит ход на следующего участника торгов.
 * Moves bidding to the next player in bidding phase.
 */
function moveBidding(game: GameState): void {
    const bidding = game.bidding;

    if (bidding === null)
        throw new Error("Bidding is not initialized.");

    const activePlayers = getActivePlayers(game);
    const currentIndex = activePlayers.findIndex(player => player.id === game.currentPlayerId);

    if (currentIndex === -1)
        throw new Error("Current bidder not found.");

    for (let offset = 1; offset < activePlayers.length; offset++)
    {
        const nextIndex = (currentIndex + offset) % activePlayers.length;
        const nextPlayer = activePlayers[nextIndex];

        // Skip players who have passed
        if (bidding.passedPlayerIds.includes(nextPlayer.id))
            continue;

        // Skip the current highest bidder
        if (nextPlayer.id === bidding.highestBidderId)
            continue;

        game.currentPlayerId = nextPlayer.id;
        return;
    }

    finishBidding(game);
}

export function finishBidding(game: GameState): void {
    const bidding = game.bidding;

    if (game.phase !== GAME_PHASES.BIDDING || bidding === null)
        throw new Error("Bidding is not active.");

    const remainingPlayers = getActivePlayers(game).filter(player => !bidding.passedPlayerIds.includes(player.id));

    // (!) Keep only the highest bidder
    if (remainingPlayers.length !== 1 || remainingPlayers[0].id !== bidding.highestBidderId)
        throw new Error("Bidding is not finished.");

    bidding.challengeOpen = false;

    // Assign the turn to the winning bidder and move to the next game phase
    game.currentPlayerId = bidding.highestBidderId;
    game.phase = GAME_PHASES.EXCHANGING;
}