import { RANKS, GAME_PHASES, CUT_PENALTY_LIMIT, PENALTY_POINTS, BARREL_SCORE, BARREL_PENALTY_POINTS, SCORE_RESET_VALUE, MIN_HAND_POINTS, MIN_BID, BID_STEP } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import { createDeck, shuffleDeck, validateDeck, dealCards, validateDeal } from "./deck.ts";
import type { GameState, PlayerState, CutResult } from "./types.ts";
import { getCardsPoints } from "./cards.ts";
import {
    getMaxBid,
    getActivePlayers
} from "./bidding.ts";

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
        bidding: null,
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

    // Reset bidding and cutting states
    game.bidding = null;

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
 * Применяет стандартный штраф к игроку.
 * Applies a standard penalty to a player.
 */
function applyPenalty(
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

    // (!) Two-player mode is not implemented yet
    if (playerCount !== 3 && playerCount !== 4)
        throw new Error("Unsupported player count.");

    const dealer = game.players.find(player => player.id === game.dealerId); // Find the dealer

    if (dealer === undefined)
        throw new Error("Dealer not found.");

    const { hands, talon } = dealCards(game.deck, 3)

    if (!validateDeal(hands, talon, 3))
        throw new Error("Invalid card distribution.");

    // (!) 4-player game:
    // > The dealer does not play (use hand) in the round.
    const activePlayers = getActivePlayers(game);

    // Assign hands
    for (let i = 0; i < activePlayers.length; i++)
        activePlayers[i].hand = hands[i];

    // Inactive dealer's hand
    if (playerCount === 4)
        dealer.hand = [];

    game.talon = talon;
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
    if (!game.rules.allowRedeal)
        return false;

    // (!) Redeal is allowed after dealing
    if (game.phase !== GAME_PHASES.DEALING)
        return false;

    const player = game.players.find(player => player.id === playerId);

    // (!) Player must have a full dealt hand
    if (player === undefined || player.hand.length !== 7)
        return false;

    const nineCount = player.hand.filter(card => card.rank === RANKS.NINE).length;
    const jackCount = player.hand.filter(card => card.rank === RANKS.JACK).length;

    // 4x9 or 4xJ 
    if (nineCount === 4 || jackCount === 4)
        return true;

    // (!) Not enough card points
    return getCardsPoints(player.hand) < MIN_HAND_POINTS;
}

/**
 * Перезапускает несостоявшуюся раздачу.
 * Restarts an unplayed round.
 *
 * @param game - Current game state.
 * @param rotateDealer - Whether to rotate the dealer.
 */
function restartUnplayedRound(
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
    game.currentTrick = [];
    game.bidding = null;

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
    if (!canRequestRedeal(game, playerId))
        throw new Error("Redeal is not allowed.");

    restartUnplayedRound(game);
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
