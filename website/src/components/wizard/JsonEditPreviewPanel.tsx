import React, { useMemo } from 'react';
import { Character, CharacterCreationData } from '../../types/character';

interface JsonEditPreviewPanelProps {
    originalCharacter: Character;
    currentData: Partial<CharacterCreationData>;
    modifiedFields: Set<string>;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
    className?: string;
}

export const JsonEditPreviewPanel: React.FC<JsonEditPreviewPanelProps> = ({
    originalCharacter,
    currentData,
    modifiedFields,
    isVisible = false,
    onToggleVisibility,
    className
}) => {
    // Transform current data to API format for preview
    const currentApiFormat = useMemo(() => {
        try {
            // Basic transformation logic (similar to characterAPI.transformUpdateData)
            const result: any = {
                characterName: currentData.characterName || '',
                playerName: currentData.playerName || '',
                race: currentData.race || '',
                subrace: currentData.subrace || '',
                class: currentData.class || '',
                subclass: currentData.subclass || '',
                multiclass: currentData.multiclass || [],
                level: currentData.level || 1,
                experiencePoints: currentData.experiencePoints || 0,
                background: currentData.background || '',
                alignment: currentData.alignment || '',
                abilityScores: currentData.abilityScores ? {
                    strength: {
                        base: currentData.abilityScores.strength || 10
                    },
                    dexterity: {
                        base: currentData.abilityScores.dexterity || 10
                    },
                    constitution: {
                        base: currentData.abilityScores.constitution || 10
                    },
                    intelligence: {
                        base: currentData.abilityScores.intelligence || 10
                    },
                    wisdom: {
                        base: currentData.abilityScores.wisdom || 10
                    },
                    charisma: {
                        base: currentData.abilityScores.charisma || 10
                    }
                } : {
                    strength: { base: 10 },
                    dexterity: { base: 10 },
                    constitution: { base: 10 },
                    intelligence: { base: 10 },
                    wisdom: { base: 10 },
                    charisma: { base: 10 }
                },
                proficiencyBonus: calculateProficiencyBonus(currentData.level || 1)
            };

            // Only include alignment if it's not empty
            if (!result.alignment || result.alignment.trim() === '') {
                delete result.alignment;
            }

            return result;
        } catch (error) {
            return { error: `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }, [currentData]);

    // Generate formatted JSON strings with syntax highlighting and change highlighting
    const { originalJsonHtml, currentJsonHtml } = useMemo(() => {
        try {
            const originalJsonString = JSON.stringify(originalCharacter, null, 2);
            const currentJsonString = JSON.stringify(currentApiFormat, null, 2);

            // Basic syntax highlighting for JSON
            const highlightJson = (jsonString: string, isModified: boolean = false) => {
                return jsonString
                    .replace(/"([^"]+)":/g, `<span class="json-key">"$1"</span>:`) // Keys
                    .replace(/: "([^"]+)"/g, `: <span class="json-string">${isModified ? '<span class="json-modified">' : ''}"$1"${isModified ? '</span>' : ''}</span>`) // Strings
                    .replace(/: ([0-9]+(\.[0-9]+)?)/g, `: <span class="json-number">${isModified ? '<span class="json-modified">' : ''}$1${isModified ? '</span>' : ''}</span>`) // Numbers
                    .replace(/: (true|false)/g, `: <span class="json-boolean">${isModified ? '<span class="json-modified">' : ''}$1${isModified ? '</span>' : ''}</span>`) // Booleans
                    .replace(/: (\[|\{)/g, `: <span class="json-bracket">$1</span>`) // Brackets
                    .replace(/(\]|\})/g, `<span class="json-bracket">$1</span>`); // Brackets
            };

            // For now, we'll highlight entire modified fields
            // In a more advanced implementation, we could do line-by-line diffing
            const originalHighlighted = highlightJson(originalJsonString);
            const currentHighlighted = highlightJson(currentJsonString, modifiedFields.size > 0);

            return {
                originalJsonHtml: originalHighlighted,
                currentJsonHtml: currentHighlighted
            };
        } catch (error) {
            const errorHtml = `<span class="json-comment">// Error generating JSON: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
            return {
                originalJsonHtml: errorHtml,
                currentJsonHtml: errorHtml
            };
        }
    }, [originalCharacter, currentApiFormat, modifiedFields]);

    const copyToClipboard = async (data: any, label: string) => {
        try {
            const plainJson = JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(plainJson);
            // Could add a toast notification here
        } catch (error) {
            console.error(`Failed to copy ${label} to clipboard:`, error);
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
                    Show JSON Preview ({modifiedFields.size} changes)
                </button>
            </div>
        );
    }

    return (
        <div className={`json-preview-panel expanded ${className || ''}`}>
            <div className="json-preview-header">
                <h3 className="json-preview-title">
                    Character JSON Preview
                    {modifiedFields.size > 0 && (
                        <span className="changes-badge">{modifiedFields.size} changes</span>
                    )}
                </h3>
                <div className="json-preview-actions">
                    <button
                        className="copy-button"
                        onClick={() => copyToClipboard(originalCharacter, 'original')}
                        aria-label="Copy original JSON to clipboard"
                        title="Copy Original Data"
                    >
                        📋 Original
                    </button>
                    <button
                        className="copy-button"
                        onClick={() => copyToClipboard(currentApiFormat, 'current')}
                        aria-label="Copy current JSON to clipboard"
                        title="Copy Current Data"
                    >
                        📋 Current
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
                <div className="json-comparison">
                    <div className="json-column">
                        <h4 className="json-column-title">Original Character</h4>
                        <pre className="json-preview-code">
                            <code dangerouslySetInnerHTML={{ __html: originalJsonHtml }} />
                        </pre>
                    </div>
                    <div className="json-column">
                        <h4 className="json-column-title">
                            Current Changes
                            {modifiedFields.size > 0 && (
                                <span className="modified-indicator">Modified</span>
                            )}
                        </h4>
                        <pre className="json-preview-code">
                            <code dangerouslySetInnerHTML={{ __html: currentJsonHtml }} />
                        </pre>
                    </div>
                </div>
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