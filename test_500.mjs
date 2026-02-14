async function test() {
    const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }]
        })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
}
test();
