const TYPE_CHART = {
    city: {
        city: 1,
        forest: 2,
        water: 0.5
    },
    forest: {
        city: 0.5,
        forest: 1,
        water: 2
    },
    water: {
        city: 2,
        forest: 0.5,
        water: 1
    }
};

const WORLD_TYPE_MULTIPLIER = 1.2;

function getTypeMultiplier(attackerType, defenderType) {
    return TYPE_CHART[attackerType][defenderType];
}

function getWorldTypeMultiplier(characterType, worldType) {
    return characterType === worldType ? WORLD_TYPE_MULTIPLIER : 1;
}

module.exports = {
    getTypeMultiplier,
    getWorldTypeMultiplier
};