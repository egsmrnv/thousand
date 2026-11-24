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

const MARRIAGE_POINTS = {
    [SUITS.HEARTS]: 100,
    [SUITS.DIAMONDS]: 80,
    [SUITS.CLUBS]: 60,
    [SUITS.SPADES]: 40
} as const;

const MARRIAGE_ACE_POINTS = 200;
const useAceMarriage = true;

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
 * If useAceMarriage is true it calls findAceMarriage and adds MARRIAGE_ACE_POINTS if true.
 */
function getCardsPointsWithMarriages(hand: Card[]): number {
    const marriages = findMarriages(hand);
    let points = 0;

    for (const suit of marriages)
        points += getMarriagePoints(suit);

    if (useAceMarriage && findAceMarriage(hand))
        points += MARRIAGE_ACE_POINTS;

    return points + getCardsPoints(hand);
}

/**
 * @param cardA (current card) If it wins, function returns <false>
 * @param cardB (challenging card) If it wins, function returns <true>
 * @param trump Current trump suit (null if no trump)
 * @returns True if cardB wins over cardA, false otherwise
 */
function compareCards(cardA: Card, cardB: Card, trump: Suit | null): boolean {
    return (cardA.suit === cardB.suit && cardA.rank > cardB.rank) || (trump !== null && cardB.suit === trump && cardA.suit !== trump);
}

/**
 * Обязательно класть козырь?
 * true — Если нет карты нужной масти, но есть козырь, игрок обязан положить козырь.
 * false — Если нет карты нужной масти, игрок может положить любую карту.
 *
 * Is playing a trump card mandatory?
 * true — If the player cannot follow suit but has a trump card, they must play a trump card.
 * false — If the player cannot follow suit, they may play any card.
 */
const MUST_TRUMP = true;

/**
 * Разрешить заход с чужого козыря?
 * true — Игрок может открывать взятку козырем, независимо от того, кто его объявил.
 * false — Запрещено открывать взятку чужим козырем, кроме случая, когда в руке остались только козыри. На ответные ходы запрет не распространяется.
 *
 * Allow leading with another player's trump suit?
 * true — The player may lead with a trump card, regardless of who declared the trump suit.
 * false — The player cannot lead with another player's trump suit unless only trump cards remain in hand. This restriction does not apply to following plays.
 */
const ALLOW_FOREIGN_TRUMP_LEAD = false;

/**
 * Обязательно перебивать?
 * true — Если среди допустимых для хода карт есть карта, способная перебить текущую выигрывающую карту, игрок обязан сыграть одной из таких карт.
 * false — Игрок может сыграть любой допустимой картой, даже если она не перебивает текущую выигрывающую карту.
 *
 * Is beating the current winning card mandatory?
 * true — If any legal card can beat the current winning card, the player must play one of those cards.
 * false — The player may play any legal card, even if it cannot beat the current winning card.
 */
const MUST_BEAT = true;

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
function getLegalMoves(hand: Card[], leadingSuit: Suit | null, winningCard: Card | null, trump: Suit | null, isTrumpOwner: boolean): Card[] {
    if (leadingSuit === null) {
        // (!) If the player is first to play a card
        // > !ALLOW_FOREIGN_TRUMP_LEAD > must play a card of the leading suit if not an owner of the leading trump suit.
        if (!ALLOW_FOREIGN_TRUMP_LEAD && trump !== null && !isTrumpOwner) {
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
    if (MUST_TRUMP && legalMoves.length === 0 && trump !== null)
        legalMoves = hand.filter(card => card.suit === trump);

    if (legalMoves.length === 0)
        legalMoves = hand;

    // (!) If must beat the current winning card:
    // > Find cards that can beat it among the legal moves.
    if (MUST_BEAT && winningCard !== null) {
        const beatingCards = legalMoves.filter(card => compareCards(winningCard, card, trump));

        if (beatingCards.length > 0)
            legalMoves = beatingCards;
    }

    return legalMoves;
}