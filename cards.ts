import { SUITS, RANKS, POINTS, MARRIAGE_POINTS, MARRIAGE_ACE_POINTS } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import type { Card, Suit } from "./types.ts";

export function getCardId(card: Card): number {
    return card.suit * Object.keys(RANKS).length + card.rank;
}

export function getCardPoints(card: Card): number {
    return POINTS[card.rank];
}

export function getCardsPoints(cards: readonly Card[]): number {
    let result = 0;
    for (const card of cards)
        result += getCardPoints(card);

    return result;
}

/**
 * 
 * @param suit - Get points of marriage of given suit
 * @returns - Point for marriage of given suit
*/
export function getMarriagePoints(suit: Suit): number {
    return MARRIAGE_POINTS[suit];
}

/**
 * Finds all standard (without Aces) marriages in a hand.
 * A marriage consists of a king and a queen of the same suit.
*/
export function findMarriages(hand: readonly Card[]): Suit[] {
    const marriages: Suit[] = [];

    for (const suit of Object.values(SUITS)) {
        // if there is a king of current suit in the hand
        const hasKing = hand.some(
            card => card.suit === suit &&
                    card.rank === RANKS.KING
        );

        // if there is a queen of current suit in the hand
        const hasQueen = hand.some(
            card => card.suit === suit &&
                    card.rank === RANKS.QUEEN
        );

        if (hasKing && hasQueen)
            marriages.push(suit);
    }

    return marriages;
}

/**
 * Checks whether the hand contains an ace of every suit
*/
export function findAceMarriage(hand: readonly Card[]): boolean {
    return Object.values(SUITS).every(s => hand.some(card => card.rank === RANKS.ACE && card.suit === s))
}

export function getHandMarriagePoints(hand: readonly Card[], rules: Readonly<GameRules> = DEFAULT_GAME_RULES): number {
    const marriages = findMarriages(hand);
    let points = 0;

    for (const suit of marriages)
        points += getMarriagePoints(suit);

    if (rules.allowAceMarriage && findAceMarriage(hand))
        points += MARRIAGE_ACE_POINTS;

    return points;
}

/**
 * Calculates the total value of a hand including card points and marriage bonuses.
 * Does not represent actually earned points because marriages are not guaranteed.
 * If ALLOW_ACE_MARRIAGE is true it calls findAceMarriage and adds MARRIAGE_ACE_POINTS if true.
*/
export function getCardsPointsWithMarriages(hand: readonly Card[], rules: Readonly<GameRules> = DEFAULT_GAME_RULES): number {
    return getHandMarriagePoints(hand, rules) + getCardsPoints(hand);
}
