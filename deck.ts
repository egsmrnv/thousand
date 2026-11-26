import { SUITS, RANKS } from "./constants.ts";
import { getCardId } from "./cards.ts";
import type { Card } from "./types.ts";

/**
 * Cards of all suits and all ranks
 */
export function createDeck(): Card[] {
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
 * Checks that the deck contains every valid suit and rank combination exactly once.
 */
export function validateDeck(deck: readonly Card[]): boolean {
    const suits = Object.values(SUITS);
    const ranks = Object.values(RANKS);
    if (deck.length !== suits.length * ranks.length)
        return false;

    const cardIds = new Set<number>();
    for (const card of deck) {
        if (!card || !suits.includes(card.suit) || !ranks.includes(card.rank))
            return false;

        cardIds.add(getCardId(card));
    }

    return cardIds.size === deck.length;
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
export function shuffleDeck(deck: readonly Card[]): Card[] {
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
export function dealCards(deck: readonly Card[], handCount: 3 | 4): {
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
export function validateDeal(hands: readonly (readonly Card[])[], talon: readonly Card[], handCount: 3 | 4): boolean {
    if(hands.length !== handCount || talon.length !== handCount)
        return false;
    
    const expectedCardCount = Math.floor((Object.keys(SUITS).length * Object.keys(RANKS).length - handCount) / handCount);
    
    for(let i = 0; i < hands.length; i++)
        if(hands[i].length !== expectedCardCount)
            return false;

    // combine all cards via [...hands.flat() - from hands, ...talon - from talon]
    return validateDeck([...hands.flat(), ...talon]);
}
