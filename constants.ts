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
 * 0.WAITING - Ожидание начала партии / Waiting for start
 * 1.CUTTING - Перемешивание и снятие колоды / Mixing and deck cutting
 * 2.DEALING - Раздача карт / Card dealing
 * 3.BIDDING - Торговля и оспаривание ставок
 * 4.EXCHANGING - Получение прикупа и передача карт
 * 5.CONTRACT - Объявление окончательного заказа
 * 6.PLAYING - Розыгрыш взяток
 * 7.SCORING - Запись очков и обработка результатов
 * 8.FINISHED - Партия завершена
 */
export const GAME_PHASES = {
    WAITING: 0, 
    CUTTING: 1, 
    DEALING: 2,
    BIDDING: 3,
    EXCHANGING: 4,
    CONTRACT: 5,
    PLAYING: 6,
    SCORING: 7,
    FINISHED: 8
} as const;


/**
 * Минимальная ставка.
 * Minimum bid.
 */
export const MIN_BID = 100;

/**
 * Шаг повышения ставки.
 * Bid increment.
 */
export const BID_STEP = 5;

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

/**
 * Количество барабанов за игру у игрока.
 * Start number of drums per player per game.
 */
export const DRUMS_COUNT = 3;

/**
 * Минимальное количество очков в руке, чтобы не было пересдачи по очкам.
 *
 * Minimum card points in a hand required to prevent a point-based redeal.
 */
export const MIN_HAND_POINTS = 14;

/**
 * Минимальное количество очков в руке, чтобы не было пересдачи по очкам. (Два игрока)
 * 
 * Minimum card points in a hand required to prevent a point-based redeal. (Two player mode)
 */
export const MIN_HAND_POINTS_TWO_PLAYERS = 28;

/**
 * Минимальное количество очков в прикупе, чтобы не было пересдачи по очкам.
 *
 * Minimum card points in the talon required to prevent a point-basedredeal.
 */
export const MIN_TALON_POINTS = 5;

/**
 * Максимальная ставка при блефе.
 * 
 * Max bid when bluffing.
 */
export const MAX_BLUFF_BID = 320;