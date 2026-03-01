import handler from './scrape.js';

async function run() {
    const req = { method: 'POST', body: {} };
    const res = {
        status: (code) => {
            console.log('Status:', code);
            return {
                json: (data) => console.log('Response:', data)
            };
        }
    };

    try {
        await handler(req, res);
    } catch (e) {
        console.error(e);
    }
}
run();
