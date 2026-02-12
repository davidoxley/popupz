async function testStreaming() {
    console.log('Testing Streaming API: http://127.0.0.1:3000/api/chat');
    try {
        const response = await fetch('http://127.0.0.1:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hi' }]
            })
        });

        if (!response.ok) {
            console.error('❌ Status:', response.status);
            console.error('Body:', await response.text());
            return;
        }

        console.log('✅ Connected. Reading stream...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let done = false;
        while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            if (value) {
                const chunk = decoder.decode(value);
                process.stdout.write(chunk);
            }
        }
        console.log('\n--- Stream Ended ---');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testStreaming();
