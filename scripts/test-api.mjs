import fs from 'fs';

async function testApi() {
    console.log('Testing local API: http://127.0.0.1:3000/api/chat');
    try {
        const response = await fetch('http://127.0.0.1:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hi' }]
            })
        });

        const status = response.status;
        const text = await response.text();

        const result = {
            status,
            body: text
        };

        fs.writeFileSync('scripts/api_debug.json', JSON.stringify(result, null, 2));
        console.log(`Finished with status ${status}. Results in scripts/api_debug.json`);
    } catch (error) {
        fs.writeFileSync('scripts/api_debug.json', JSON.stringify({ error: error.message }, null, 2));
        console.error('Fetch failed:', error.message);
    }
}

testApi();
