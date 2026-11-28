import { getCardsPoints, getHandMarriagePoints } from "./cards.ts";
import { GAME_PHASES, MIN_BID, BID_STEP } from "./constants.ts";
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

    if (playerCount !== 3 && playerCount !== 4)
        throw new Error("Unsupported player count.");

    const dealerIndex = game.players.findIndex(player => player.id === game.dealerId);

    if (dealerIndex === -1)
        throw new Error("Dealer not found.");

    const activePlayers = getActivePlayers(game);

    // (!) Cards must already be dealt
    if (game.deck.length !== 0 || !validateDeal(activePlayers.map(player => player.hand), game.talon, 3))
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
    if (game.phase !== GAME_PHASES.BIDDING || bidding === null)
        throw new Error("Bidding is not active.");

    const bidders = getActivePlayers(game).filter(player => !bidding.passedPlayerIds.includes(player.id));
    const index = bidders.findIndex(player => player.id === playerId);
    if (
        index === -1 ||
        game.currentPlayerId !== playerId ||
        playerId === bidding.highestBidderId ||
        bidders.length < 2
    )
        throw new Error("Cannot raise this bid.");

    if (!Number.isSafeInteger(amount) || amount !== bidding.currentBid + BID_STEP)
        throw new Error("Invalid bid increment.");

    const canBluff = game.rules.enablePenalties && game.rules.allowBidBluff;
    if (!canBluff && amount > getMaxBid(bidders[index].hand, game.rules))
        throw new Error("Bid exceeds the hand's limit.");

    bidding.currentBid = amount;
    bidding.highestBidderId = playerId;
    bidding.hasRaised = true;
    bidding.challengeOpen = canBluff;
    game.currentPlayerId = bidders[(index + 1) % bidders.length].id;
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

    // Close the challenge window
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
