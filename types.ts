import type { SUITS, RANKS, GAME_PHASES } from "./constants.ts";
import type { GameRules } from "./settings.ts";

export type Suit = (typeof SUITS)[keyof typeof SUITS];

export type Rank = (typeof RANKS)[keyof typeof RANKS];

export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES];

export type Card = {
    readonly suit: Suit;
    readonly rank: Rank;
};

/**
 * Card played by a player in a trick. / Сыгранная карта во взятке.
*/
export type PlayedCard = {
    readonly playerId: number;
    readonly card: Card;
};

export type PlayerState = {
    readonly id: number,
    hand: readonly Card[],
    totalPoints: number,
    roundPoints: number,
    tricksWon: number,
    bolts: number,
    drumsRemaining: number,
    barrelAttemptsUsed:	number
};

export type TrumpState = {
    readonly suit: Suit;
    readonly playerId: number;
} | {
    readonly suit: null;
    readonly playerId: null;
};

export type GameState = {
    readonly rules: Readonly<GameRules>;
    players: readonly PlayerState[];
    cutting: CuttingState;

    bidding: BiddingState | null;

    phase: GamePhase;
    roundNumber: number;

    deck: readonly Card[];
    talon: readonly Card[];
    secondTalon: readonly Card[]; // for 2-player game

    dealerId: number;
    currentPlayerId: number | null;

    trump: TrumpState;
    currentTrick: readonly PlayedCard[];

    winnerId: number | null;
};

/**
 * Состояние снятия колоды (чтобы отслеживать сколько выпало нежелательных карт для штрафа).
 * Deck cutting state (to detect the number of illegal cards for penalty).
 */
export type CuttingState = {
    jackCount: number;
    nineCount: number;
};

/**
 * revealedCard - какая карта открылась после снятия / opened card after cutting
 * 0.success - Можно раздавать
 * 1.retry - Повторить
 * 2.dealerChanged - Право сдачи переходит другому
*/
export type CutResult = {
    readonly revealedCard: Card;
    readonly outcome: 0 | 1 | 2; // "success" | "retry" | "dealerChanged";
};

/**
 * Состояние торговли.
 * Bidding state.
 */
export type BiddingState = {
    currentBid: number;
    highestBidderId: number;
    passedPlayerIds: readonly number[];
    hasRaised: boolean;
    challengeOpen: boolean;
};