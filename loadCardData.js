const fs = require('fs');
const { parse } = require('csv-parse/sync');

function loadCardData() {
    try {
        const fileContent = fs.readFileSync('cards.csv', 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });
        
        // Convert numeric strings to numbers
        return records.map(record => ({
            id: parseInt(record.id),
            name: record.name,
            type: record.type,
            power: parseInt(record.power),
            emo: parseInt(record.emo),
            rarity: parseInt(record.rarity),
            defense: parseInt(record.defense)
        }));
    } catch (error) {
        console.error('Error loading card data:', error);
        return [];
    }
}

module.exports = loadCardData;