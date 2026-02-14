const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/)?.[1]?.trim();

async function list() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    fs.writeFileSync('ALL_MODELS.json', JSON.stringify(data, null, 2));
}
list();
