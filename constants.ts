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

/**
 * Количество очков за марьяж с тузами.
 * Points for a marriage with Aces.
 */
export const MARRIAGE_ACE_POINTS = 200;

/**
 * Количество очков для победы.
 * Points required to win.
 */
export const WIN_SCORE = 1000;

/**
 * Порог попадания на бочку.
 * Score required to enter the barrel.
 */
export const BARREL_SCORE = 880;

/**
 * Количество попыток выхода с бочки (победить).
 * Number of attempts to leave the barrel (win).
 */
export const BARREL_ATTEMPTS = 3;

/**
 * Размер стандартного штрафа.
 * Standard penalty.
 */
export const PENALTY_POINTS = 100;

/**
 * Размер штрафа за вылет с бочки.
 * Penalty for losing while "on the barrel" state.
 */
export const BARREL_PENALTY_POINTS = 120;

/**
 * Значение "самосвала" (±555).
 * Score reset value (±555).
 */
export const SCORE_RESET_VALUE = 555;

/**
 * Количество повторов валета / девятки при снятии колоды (раздаче карт), приводящее к штрафу.
 *
 * Number of repeated Jacks / Nines during deck cutting (card dealing) that leads to a penalty.
 */
export const CUT_PENALTY_LIMIT = 3;

/**
 * Количество накопленных болтов, приводящее к штрафу.
 * Number of accumulated bolts before a penalty is applied.
 */
export const BOLT_PENALTY_LIMIT = 3;