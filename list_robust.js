const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/)?.[1]?.trim();

async function list() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.models) {
        data.models.forEach(m => console.log(m.name));
    } else {
        console.log(data);
    }
}
list();
