export const SUITS = {
    HEARTS: 0,
    DIAMONDS: 1,
    CLUBS: 2,
    SPADES: 3
} as const;

/**
 * Cards in this game: 9, J, Q, K, 10, A
 */
export const RANKS = {
    ACE: 0,
    TEN: 1,
    KING: 2,
    QUEEN: 3,
    JACK: 4,
    NINE: 5
} as const;

export const POINTS = {
    [RANKS.ACE]: 11,
    [RANKS.TEN]: 10,
    [RANKS.KING]: 4,
    [RANKS.QUEEN]: 3,
    [RANKS.JACK]: 2,
    [RANKS.NINE]: 0
} as const;

export const MARRIAGE_POINTS = {
    [SUITS.HEARTS]: 100,
    [SUITS.DIAMONDS]: 80,
    [SUITS.CLUBS]: 60,
    [SUITS.SPADES]: 40
} as const;

export const MARRIAGE_ACE_POINTS = 200;