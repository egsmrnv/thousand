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
 * Deals cards into 2, 3 or 4 hands.
 * Two hands: 10 cards each and two talons of 2 cards.
 * Three or four hands: one talon, with size equal to handCount.
 * Does not mutate the original deck.
*/
export function dealCards(deck: readonly Card[], handCount: 2 | 3 | 4): {
    hands: Card[][];
    talon: Card[];
    secondTalon: Card[];
} {
    const hands: Card[][] = [];
    const talon: Card[] = [];
    const secondTalon: Card[] = [];
    const talonSize = handCount === 2 ? 2 : handCount;
    const secondTalonSize = handCount === 2 ? 2 : 0;
    const handCardsEnd = deck.length - talonSize - secondTalonSize;

    // prepare new arrays for each hand
    for(let i = 0; i < handCount; i++)
        hands[i] = [];

    for(let i = 0; i < deck.length; i++) {
        if(i < handCardsEnd)
            hands[i % handCount].push(deck[i]);
        else if(i < handCardsEnd + talonSize)
            talon.push(deck[i]);
        else
            secondTalon.push(deck[i]);
    }
    return {
        hands: hands,
        talon: talon,
        secondTalon: secondTalon
    }
}

/**
 * Validates card distribution between hands and talons.
 *
 * @param hands - Array of dealt hands.
 * @param talon - Cards in the first (or only) talon.
 * @param handCount - Number of hands (2, 3 or 4).
 * @param secondTalon - Second talon, empty except in the two-player deal.
 * @returns True if the deal is valid.
*/
export function validateDeal(
    hands: readonly (readonly Card[])[],
    talon: readonly Card[],
    handCount: 2 | 3 | 4,
    secondTalon: readonly Card[] = []
): boolean {
    const talonSize = handCount === 2 ? 2 : handCount;
    const secondTalonSize = handCount === 2 ? 2 : 0;

    if(hands.length !== handCount || talon.length !== talonSize || secondTalon.length !== secondTalonSize)
        return false;

    const deckCardCount = Object.keys(SUITS).length * Object.keys(RANKS).length;
    const expectedCardCount = (deckCardCount - talonSize - secondTalonSize) / handCount;

    for(let i = 0; i < hands.length; i++)
        if(hands[i].length !== expectedCardCount)
            return false;

    // Combine both talons and all hands; each card must occur exactly once.
    return validateDeck([...hands.flat(), ...talon, ...secondTalon]);
}
