const SUITS = {
    HEARTS: 0,
    DIAMONDS: 1,
    CLUBS: 2,
    SPADES: 3
} as const;

/**
 * Cards in this game: 9, J, Q, K, 10, A
 */
const RANKS = {
    ACE: 0,
    TEN: 1,
    KING: 2,
    QUEEN: 3,
    JACK: 4,
    NINE: 5
} as const;

const POINTS = {
    [RANKS.ACE]: 11,
    [RANKS.TEN]: 10,
    [RANKS.KING]: 4,
    [RANKS.QUEEN]: 3,
    [RANKS.JACK]: 2,
    [RANKS.NINE]: 0
} as const;

type Suit = (typeof SUITS)[keyof typeof SUITS];

type Rank = (typeof RANKS)[keyof typeof RANKS];

type Card = {
    readonly suit: Suit;
    readonly rank: Rank;
};

function getCardId(card: Card): number {
    return card.suit * Object.keys(RANKS).length + card.rank;
}

function getCardPoints(card: Card): number {
    return POINTS[card.rank];
}

/**
 * Cards of all suits and all ranks
 */
function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of Object.values(SUITS))
        for (const rank of Object.values(RANKS))
            deck.push({
                suit: suit,
                rank: rank
            });
    
    return deck;
}

/**
 * Check that deck is valid (cards count and ID uniqueness)
 */
function validateDeck(deck: Card[]): boolean {
    const expectedCardCount = Object.keys(SUITS).length * Object.keys(RANKS).length;
    return deck.length === expectedCardCount && (new Set(deck.map(getCardId))).size === expectedCardCount
}

/**
 * Fisher–Yates shuffle.
 * Based on Laurens Holst's implementation:
 * https://stackoverflow.com/a/12646864
 *
 * Adapted for TypeScript.
 * Source: CC BY-SA 4.0
 * https://creativecommons.org/licenses/by-sa/4.0/
 */
function shuffleDeck(deck: Card[]): Card[] {
    const deckCopy = [...deck];

    for (let i = deckCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckCopy[i], deckCopy[j]] = [deckCopy[j], deckCopy[i]];
    }

    return deckCopy;
}

/**
 * Deals cards into 3 or 4 hands.
 * The remaining cards go to the talon.
 * Does not mutate the original deck.
 */
function dealCards(deck: Card[], handCount: 3 | 4): {
    hands: Card[][];
    talon: Card[];
} {
    const hands: Card[][] = [];
    const talon: Card[] = [];

    // prepare new arrays for each hand
    for(let i = 0; i < handCount; i++)
        hands[i] = [];

    for(let i = 0; i < deck.length; i++) {
        if(i < deck.length - handCount)
            hands[i % handCount].push(deck[i]);
        else
            talon.push(deck[i]);
    }
    return {
        hands: hands,
        talon: talon
    }
}

/**
 * Validates card distribution between hands and talon.
 *
 * @param hands - Array of dealt hands.
 * @param talon - Remaining cards in the talon.
 * @param handCount - Number of hands (3 or 4).
 * @returns True if the deal is valid.
 */
function validateDeal(hands: Card[][], talon: Card[], handCount: 3 | 4): boolean {
    if(hands.length !== handCount || talon.length !== handCount)
        return false;
    
    const expectedCardCount = Math.floor((Object.keys(SUITS).length * Object.keys(RANKS).length - handCount) / handCount);
    
    for(let i = 0; i < hands.length; i++)
        if(hands[i].length !== expectedCardCount)
            return false;

    // combine all cards via [...hands.flat() - from hands, ...talon - from talon]
    return validateDeck([...hands.flat(), ...talon]);
}