export type GameRules = {
    /**
     * Разрешить пересдачу карт при определённых условиях?
     * - 4x9 Четыре девятки в руке.
     * - 4xJ Четыре валета в руке.
     * - Менее MIN_HAND_POINTS в руке.
     * - Менее MIN_TALON_POINTS в прикупе.
     *
     * Allow redealing cards under certain conditions?
     * - 4x9 Four Nines in the hand.
     * - 4xJ Four Jacks in the hand.
     * - Fewer than MIN_HAND_POINTS in the hand.
     * - Fewer than MIN_TALON_POINTS in the talon.
     */
    allowRedeal: boolean;

    /**
     * Включить «Барабаны»? Каждая разрешённая пересдача расходует один барабан.
     * Enable drums? Each allowed redeal spends one drum.
     */
    enableDrums?: boolean;

    /**
     * Можно объявлять марьяж, имея в руке туза каждой масти.
     *
     * Can declare a marriage by having an Ace of each suit in the hand.
     */
    allowAceMarriage: boolean;

    /**
     * Обязательно класть козырь?
     * true - Если нет карты нужной масти, но есть козырь, игрок обязан положить козырь.
     * false - Если нет карты нужной масти, игрок может положить любую карту.
     *
     * Is playing a trump card mandatory?
     * true - If the player cannot follow suit but has a trump card, they must play a trump card.
     * false - If the player cannot follow suit, they may play any card.
     */
    mustTrump: boolean;

    /**
     * Разрешить заход с чужого козыря?
     * true - Игрок может открывать взятку козырем, независимо от того, кто его объявил.
     * false - Запрещено открывать взятку чужим козырем, кроме случая, когда в руке остались только козыри. На ответные ходы запрет не распространяется.
     *
     * Allow leading with another player's trump suit?
     * true - The player may lead with a trump card, regardless of who declared the trump suit.
     * false - The player cannot lead with another player's trump suit unless only trump cards remain in hand. This restriction does not apply to following plays.
     */
    allowForeignTrumpLead: boolean;

    /**
     * Обязательно перебивать?
     * true - Если среди допустимых для хода карт есть карта, способная перебить текущую выигрывающую карту, игрок обязан сыграть одной из таких карт.
     * false - Игрок может сыграть любой допустимой картой, даже если она не перебивает текущую выигрывающую карту.
     *
     * Is beating the current winning card mandatory?
     * true - If any legal card can beat the current winning card, the player must play one of those cards.
     * false - The player may play any legal card, even if it cannot beat the current winning card.
     */
    mustBeat: boolean;

    /**
     * Обязательно взять хотя бы одну взятку перед объявлением марьяжа?
     *
     * Must win at least one trick before declaring a marriage?
     */
    requireTrickBeforeMarriage: boolean;

    /**
     * Включить систему штрафов за нарушение правил игры?
     *
     * Enable penalties for violating game rules?
     */
    enablePenalties: boolean;

    /**
     * Разрешить блеф при торговле?
     * Игрок может объявить ставку выше допустимой.
     * Соперники вправе оспорить ставку.
     * Если нарушение подтверждается, игрок получает штраф, раздача отменяется, сдающий меняется.
     * Блеф возможен только при включённой системе штрафов.
     *
     * Allow bluffing during bidding?
     * A player may place a bid above the legal limit.
     * Opponents may challenge the bid.
     * If a violation is confirmed, the player receives a penalty, the round is cancelled, and the dealer changes.
     * Bluffing is only available when penalties are enabled.
     */
    allowBidBluff: boolean;

    /**
     * Включить "самосвал"?
     * true - При счёте ровно 555/-555 счёт игрока обнуляется.
     *
     * Enable the score reset rule?
     * true - If the player's score reaches exactly 555/-555, the score resets to zero.
     */
    enableScoreReset: boolean;

    /**
     * Включить правило болтов? Болт начисляется если в раздаче игрок не взял ни одной взятки.
     *
     * Enable the "bolts" rule? A bolt counts if the player does not win any tricks in a round.
     */
    enableBolts: boolean;
};

/**
 * Стандартные настройки игры.
 * Default game rules.
 */
export const DEFAULT_GAME_RULES: Readonly<GameRules> = Object.freeze({
    allowRedeal: true,
    enableDrums: false,
    allowAceMarriage: true,
    mustTrump: true,
    allowForeignTrumpLead: false,
    mustBeat: true,
    requireTrickBeforeMarriage: true,
    enablePenalties: true,
    allowBidBluff: false,
    enableScoreReset: true,
    enableBolts: true
});

/**
 * Создаёт настройки на основе стандартных.
 * Creates rules based on the defaults.
 */
export function createGameRules(overrides: Partial<GameRules> = {}): GameRules {
    return {
        ...DEFAULT_GAME_RULES,
        ...overrides
    };
}
