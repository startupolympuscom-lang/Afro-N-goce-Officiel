const fs = require('fs');

const content = fs.readFileSync('/src/data/initialClients.ts', 'utf8');
const regex = /id: '([^']+)'/g;
const ids = [];
let match;

while ((match = regex.exec(content)) !== null) {
  ids.push(match[1]);
}

const counts = {};
ids.forEach(id => {
  counts[id] = (counts[id] || 0) + 1;
});

const duplicates = Object.keys(counts).filter(id => counts[id] > 1);
console.log('Duplicate IDs:', duplicates);
duplicates.forEach(id => {
    console.log(`ID ${id} occurs ${counts[id]} times`);
});
