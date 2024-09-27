const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function loadCardData() {
    try {
        const filePath = path.join(__dirname, 'cards.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });
        
        return records.map(record => ({
            id: parseInt(record.id),
            name: record.name,
            type: record.type,
            power: parseInt(record.power),
            emo: record.emo,
            rarity: record.rarity,
            defense: parseInt(record.defense),
            mojo: parseInt(record.mojo)
        }));
    } catch (error) {
        console.error('Error loading card data:', error);
        return [];
    }
}

module.exports = loadCardData;