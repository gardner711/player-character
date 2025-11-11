import React, { useMemo } from 'react';
import { CharacterCreationData } from '../../types/character';

interface JsonPreviewPanelProps {
    characterData: Partial<CharacterCreationData>;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
    className?: string;
}

export const JsonPreviewPanel: React.FC<JsonPreviewPanelProps> = ({
    characterData,
    isVisible = false,
    onToggleVisibility,
    className
}) => {
    // Transform character data to API format for preview
    const apiFormatData = useMemo(() => {
        try {
            // Basic transformation logic (similar to characterAPI.transformCreationData)
            const result: any = {
                characterName: characterData.characterName || '',
                playerName: characterData.playerName || '',
                race: characterData.race || '',
                subrace: characterData.subrace || '',
                class: characterData.class || '',
                subclass: characterData.subclass || '',
                multiclass: characterData.multiclass || [],
                level: characterData.level || 1,
                experiencePoints: characterData.experiencePoints || 0,
                background: characterData.background || '',
                alignment: characterData.alignment || '',
                abilityScores: characterData.abilityScores ? {
                    strength: {
                        base: characterData.abilityScores.strength || 10
                    },
                    dexterity: {
                        base: characterData.abilityScores.dexterity || 10
                    },
                    constitution: {
                        base: characterData.abilityScores.constitution || 10
                    },
                    intelligence: {
                        base: characterData.abilityScores.intelligence || 10
                    },
                    wisdom: {
                        base: characterData.abilityScores.wisdom || 10
                    },
                    charisma: {
                        base: characterData.abilityScores.charisma || 10
                    }
                } : {
                    strength: { base: 10 },
                    dexterity: { base: 10 },
                    constitution: { base: 10 },
                    intelligence: { base: 10 },
                    wisdom: { base: 10 },
                    charisma: { base: 10 }
                },
                proficiencyBonus: calculateProficiencyBonus(characterData.level || 1)
            };

            // Only include alignment if it's not empty
            if (!result.alignment || result.alignment.trim() === '') {
                delete result.alignment;
            }

            return result;
        } catch (error) {
            return { error: `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }, [characterData]);

    // Generate formatted JSON string with syntax highlighting
    const jsonPreviewHtml = useMemo(() => {
        try {
            const jsonString = JSON.stringify(apiFormatData, null, 2);
            // Basic syntax highlighting for JSON
            return jsonString
                .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:') // Keys
                .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>') // Strings
                .replace(/: ([0-9]+(\.[0-9]+)?)/g, ': <span class="json-number">$1</span>') // Numbers
                .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>'); // Booleans
        } catch (error) {
            return `<span class="json-comment">// Error generating JSON: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
        }
    }, [apiFormatData]);

    const copyToClipboard = async () => {
        try {
            // Copy the plain JSON without HTML tags
            const plainJson = JSON.stringify(apiFormatData, null, 2);
            await navigator.clipboard.writeText(plainJson);
            // Could add a toast notification here
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    if (!isVisible) {
        return (
            <div className={`json-preview-panel collapsed ${className || ''}`}>
                <button
                    className="json-preview-toggle"
                    onClick={onToggleVisibility}
                    aria-label="Show JSON Preview"
                >
                    <span className="toggle-icon">▼</span>
                    Show JSON Preview
                </button>
            </div>
        );
    }

    return (
        <div className={`json-preview-panel expanded ${className || ''}`}>
            <div className="json-preview-header">
                <h3 className="json-preview-title">Character JSON Preview</h3>
                <div className="json-preview-actions">
                    <button
                        className="copy-button"
                        onClick={copyToClipboard}
                        aria-label="Copy JSON to clipboard"
                    >
                        📋 Copy
                    </button>
                    <button
                        className="json-preview-toggle"
                        onClick={onToggleVisibility}
                        aria-label="Hide JSON Preview"
                    >
                        <span className="toggle-icon">▲</span>
                        Hide Preview
                    </button>
                </div>
            </div>
            <div className="json-preview-content">
                <pre className="json-preview-code">
                    <code dangerouslySetInnerHTML={{ __html: jsonPreviewHtml }} />
                </pre>
            </div>
        </div>
    );
};

// Calculate proficiency bonus based on character level
function calculateProficiencyBonus(level: number): number {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
}