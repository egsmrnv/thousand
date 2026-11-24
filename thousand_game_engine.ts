import { SUITS, RANKS, POINTS, MARRIAGE_POINTS, MARRIAGE_ACE_POINTS } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";

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

function getCardsPoints(cards: Card[]): number {
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
function getMarriagePoints(suit: Suit): number {
    return MARRIAGE_POINTS[suit];
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

/**
 * Finds all standard (without Aces) marriages in a hand.
 * A marriage consists of a king and a queen of the same suit.
*/
function findMarriages(hand: Card[]): Suit[] {
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
function findAceMarriage(hand: Card[]): boolean {
    return Object.values(SUITS).every(s => hand.some(card => card.rank === RANKS.ACE && card.suit === s))
}

/**
 * Calculates the total value of a hand including card points and marriage bonuses.
 * Does not represent actually earned points because marriages are not guaranteed.
 * If ALLOW_ACE_MARRIAGE is true it calls findAceMarriage and adds MARRIAGE_ACE_POINTS if true.
 */
function getCardsPointsWithMarriages(hand: Card[], rules: Readonly<GameRules> = DEFAULT_GAME_RULES): number {
    const marriages = findMarriages(hand);
    let points = 0;

    for (const suit of marriages)
        points += getMarriagePoints(suit);

    if (rules.allowAceMarriage && findAceMarriage(hand))
        points += MARRIAGE_ACE_POINTS;

    return points + getCardsPoints(hand);
}

/**
 * @param challenger Card challenging the current winner (if it wins return true). / Карта которая будет сравниваться с текущей (если она будет сильнее то true)
 * @param currentWinner Current winning card. / Текущая  карта 
 * @param trump Current trump suit (null if no trump). Козырная масть (null если нет козыря)
 * @returns True if the challenger beats the current winner, false otherwise. / Возвращает true, если новая карта (challenger) побеждает текущую выигрывающую карту, false в противном случае.
 */
function beats(challenger: Card, currentWinner: Card, trump: Suit | null): boolean {
    return (challenger.suit === currentWinner.suit && challenger.rank < currentWinner.rank) || (trump !== null && challenger.suit === trump && currentWinner.suit !== trump);
}

/**
 * Определяет, какими картами игрок может ходить.
 * Учитывает масть первого хода, козырь и настройки игры.
 *
 * Finds all cards the player is allowed to play.
 * Takes into account the leading suit, trump and game rules.
 *
 * @param hand - Cards in the player's hand. / Карты в руке игрока.
 * @param leadingSuit - Suit of the first card in the trick. / Масть первой карты во взятке.
 * @param winningCard - Current winning card in the trick. / Текущая выигрывающая карта во взятке.
 * @param trump - Current trump suit (null if no trump). / Текущая масть козыря (null если нет козыря).
 * @param isTrumpOwner - Whether the player declared the current trump. / Является ли игрок владельцем текущего козыря.
 * @returns Array of legal moves. / Массив допустимых ходов.
 */
function getLegalMoves(hand: Card[], leadingSuit: Suit | null, winningCard: Card | null, trump: Suit | null, isTrumpOwner: boolean, rules: Readonly<GameRules> = DEFAULT_GAME_RULES): Card[] {
    if (leadingSuit === null) {
        // (!) If the player is first to play a card
        // > !ALLOW_FOREIGN_TRUMP_LEAD > can't start with another player's trump (because !isTrumpOwner and trump !== null)
        if (!rules.allowForeignTrumpLead && trump !== null && !isTrumpOwner) {
            const legalMoves = hand.filter(card => card.suit !== trump);

            // (!) If the player has no cards of a non-trump suit
            // > can play any card from their hand.
            return legalMoves.length > 0 ? legalMoves : hand;
        }

        return hand;
    }

    // (!) If the player is not first to play a card
    // > must play a card of the leading suit.
    let legalMoves = hand.filter(card => card.suit === leadingSuit);

    // (!) If the player has no cards of the leading suit
    // > MUST_TRUMP > Must play a trump card if there is one.
    if (rules.mustTrump && legalMoves.length === 0 && trump !== null)
        legalMoves = hand.filter(card => card.suit === trump);

    if (legalMoves.length === 0)
        legalMoves = hand;

    // (!) If MUST_BEAT the current winning card:
    // > Find cards that can beat it among the legal moves.
    if (rules.mustBeat && winningCard !== null) {
        const beatingCards = legalMoves.filter(card => beats(card, winningCard, trump));

        if (beatingCards.length > 0)
            legalMoves = beatingCards;
    }

    return legalMoves;
}

// ##############
// Logic for played cards and tricks.
// Логика сыгранных карт и взяток.
// ##############

/**
 * Card played by a player in a trick. / Сыгранная карта во взятке.
*/
type PlayedCard = {
    readonly playerId: number;
    readonly card: Card;
};

/**
 * Determines the winner of a trick based on the cards played (trick) and the trump suit (trump, null if no trump).
 * @param trick Array of cards played in the trick. / Массив сыгранных во взятке карт.
 * @param trump The trump suit for the current round. / Масть козыря для текущего раунда.
 * @returns The winning card or null if the trick is empty. / Выигрывающая карта или null, если массив trick пуст.
 */
function getTrickWinner(trick: PlayedCard[], trump: Suit | null): PlayedCard | null {
    if (trick.length === 0)
        return null;
    let winner = trick[0];

    // Compare each played card with the current winning card.
    for (let i = 1; i < trick.length; i++)
        if (beats(trick[i].card, winner.card, trump))
            winner = trick[i];

    return winner;
}

/**
 * Сумма очков во взятке без учёта марьяжей.
 * Total points in a trick without marriages.
 *
 * @param trick - Played cards. / Сыгранные во взятке карты.
 * @returns Total points. / Сумма очков.
 */
function getTrickPoints(trick: PlayedCard[]): number {
    const cards = trick.map(play => play.card)
    return getCardsPoints(cards);
}

/**
 * Может ли игрок объявить марьяж.
 * Checks whether the player can declare a marriage.

 * @param hand - Cards in the player's hand. / Карты в руке игрока.
 * @param card - Card the player wants to play. / Карта, которой игрок хочет походить.
 * @param isLeading - Whether the player is opening the trick. / Открывает ли игрок взятку.
 * @param hasWonTrick - Whether the player has already won a trick in the current round. / Брал ли игрок взятку в текущей раздаче.
 * @returns Whether a marriage can be declared. / Можно ли объявить марьяж.
 */
function canDeclareMarriage(hand: Card[], card: Card, isLeading: boolean, hasWonTrick: boolean, rules: Readonly<GameRules> = DEFAULT_GAME_RULES): boolean {
    // (!) If the player is not opening the trick:
    // > Cannot declare a marriage.
    if (!isLeading)
        return false;

    // (!) REQUIRE_TRICK_BEFORE_MARRIAGE
    // > Must win at least one trick before declaring a marriage.
    if (rules.requireTrickBeforeMarriage && !hasWonTrick)
        return false;

    // Check that the selected card is in the player's hand.
    if (!hand.some(c => getCardId(c) === getCardId(card)))
        return false;

    // (!) If the player wants to play an Ace:
    // > ALLOW_ACE_MARRIAGE > Must have all four Aces.
    if (card.rank === RANKS.ACE)
        return rules.allowAceMarriage && findAceMarriage(hand);

    // (!) If the player wants to play a King or Queen:
    // > Must have a marriage of the same suit.
    if (card.rank === RANKS.KING || card.rank === RANKS.QUEEN)
        return findMarriages(hand).includes(card.suit);

    return false;
}

// ##############
// Logic for game phases, rounds, and states.
// Логика игровых фаз, раундов и состояний.
// ##############

