import { RANKS } from "./constants.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import { getCardId, getCardsPoints, findMarriages, findAceMarriage } from "./cards.ts";
import type { Card, Suit, PlayedCard } from "./types.ts";

/**
 * @param challenger Card challenging the current winner (if it wins return true). / Карта которая будет сравниваться с текущей (если она будет сильнее то true)
 * @param currentWinner Current winning card. / Текущая  карта, которая пока выигрывает взятку
 * @param trump Current trump suit (null if no trump). Козырная масть (null если нет козыря)
 * @returns True if the challenger beats the current winner, false otherwise. / Возвращает true, если новая карта (challenger) побеждает текущую выигрывающую карту, false в противном случае.
 */
export function beats(challenger: Card, currentWinner: Card, trump: Suit | null): boolean {
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
export function getLegalMoves(hand: readonly Card[], leadingSuit: Suit | null, winningCard: Card | null, trump: Suit | null, isTrumpOwner: boolean, rules: Readonly<GameRules> = DEFAULT_GAME_RULES): readonly Card[] {
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
    let legalMoves: readonly Card[] = hand.filter(card => card.suit === leadingSuit);

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
 * Determines the winner of a trick based on the cards played (trick) and the trump suit (trump, null if no trump).
 * @param trick Array of cards played in the trick. / Массив сыгранных во взятке карт.
 * @param trump The trump suit for the current round. / Масть козыря для текущего раунда.
 * @returns The winning card or null if the trick is empty. / Выигрывающая карта или null, если массив trick пуст.
 */
export function getTrickWinner(trick: readonly PlayedCard[], trump: Suit | null): PlayedCard | null {
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
export function getTrickPoints(trick: readonly PlayedCard[]): number {
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
export function canDeclareMarriage(hand: readonly Card[], card: Card, isLeading: boolean, hasWonTrick: boolean, rules: Readonly<GameRules> = DEFAULT_GAME_RULES): boolean {
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
