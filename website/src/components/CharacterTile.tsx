import React from 'react';
import { Character } from '../types/character';

export interface CharacterTileProps {
    character: Character;
    onEdit: (characterId: string) => void;
    className?: string;
}

export const CharacterTile: React.FC<CharacterTileProps> = ({
    character,
    onEdit,
    className
}) => {
    return (
        <article
            className={`character-tile ${className || ''}`}
            role="article"
            aria-labelledby={`character-${character.id}-name`}
        >
            <div className="character-info">
                <h3 id={`character-${character.id}-name`} className="character-name">
                    {character.characterName}
                </h3>
                <div className="character-details">
                    <span className="character-race">{character.race}</span>
                    <span className="character-class">{character.class}</span>
                    <span className="character-level">Level {character.level}</span>
                </div>
                {character.background && (
                    <p className="character-background">{character.background}</p>
                )}
                {character.playerName && (
                    <p className="character-player">Player: {character.playerName}</p>
                )}
            </div>
            <div className="character-actions">
                <button
                    className="edit-button"
                    onClick={() => onEdit(character.id!)}
                    aria-label={`Edit ${character.characterName}`}
                >
                    Edit Character
                </button>
            </div>
        </article>
    );
};