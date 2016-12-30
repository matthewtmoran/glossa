const path = require('path');
const fs = require('fs');

const globalPaths = {
    relative: {
        root: '/data',
        markdown: '/data/markdown',
        image: '/data/image',
        audio: '/data/audio'
    },
};

module.exports = globalPaths;