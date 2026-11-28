import { getCardsPoints, getHandMarriagePoints } from "./cards.ts";
import { createDeck } from "./deck.ts";
import { DEFAULT_GAME_RULES } from "./settings.ts";
import type { GameRules } from "./settings.ts";
import type { Card, GameState, PlayerState } from "./types.ts";

const deckCardPoints = getCardsPoints(createDeck());

export function getMaxBid(hand: readonly Card[], rules: Readonly<GameRules> = DEFAULT_GAME_RULES): number {
    return deckCardPoints + getHandMarriagePoints(hand, rules);
}

export function getActivePlayers(game: GameState): readonly PlayerState[] {
    if (game.players.length === 4)
        return game.players.filter(player => player.id !== game.dealerId);

    return game.players;
}
