import https from 'https';
import fs from 'fs';
import { URL } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const JCA_URL = 'https://jets.jacustoms.gov.jm/portal/services/document-tracking/declaration-tracker.jsf';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const reqOptions = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': BROWSER_UA,
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                ...(options.headers || {}),
            },
            rejectUnauthorized: false,
            ciphers: 'DEFAULT:@SECLEVEL=0',
            secureOptions: 0,
        };

        const req = https.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    text: () => body,
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(25000, () => { req.destroy(new Error('Request timed out')); });

        if (options.body) req.write(options.body);
        req.end();
    });
}

async function getSessionAndViewState() {
    console.log('Fetching initial page...');
    const res = await httpsRequest(JCA_URL);
    if (res.status !== 200) {
        throw new Error(`Initial page load failed: ${res.status}`);
    }

    let sessionCookies = '';
    if (res.headers['set-cookie']) {
        sessionCookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }

    const html = res.text();
    const viewStateMatch = html.match(/id="javax\.faces\.ViewState" value="(.*?)"/);
    if (!viewStateMatch) {
        throw new Error('Could not find ViewState on initial page');
    }

    return { sessionCookies, viewState: viewStateMatch[1] };
}

async function scrapeLogic(reference, officeCode) {
    console.log(`Scraping ${reference}...`);
    const { sessionCookies, viewState } = await getSessionAndViewState();
    const payload = new URLSearchParams({
        'javax.faces.partial.ajax': 'true',
        'javax.faces.source': 'formTracking:btnSearch',
        'javax.faces.partial.execute': '@all',
        'javax.faces.partial.render': 'formTracking',
        'formTracking:btnSearch': 'formTracking:btnSearch',
        'formTracking': 'formTracking',
        'formTracking:txtReference': reference,
        'formTracking:txtTrn': '000000000',
        'formTracking:selOffice': officeCode,
        'javax.faces.ViewState': viewState
    });

    const res = await httpsRequest(JCA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Faces-Request': 'partial/ajax',
            Cookie: sessionCookies,
        },
        body: payload.toString()
    });

    const rawHtml = res.text();
    console.log(`Received rawHtml length = ${rawHtml.length}`);
    fs.writeFileSync('jca_dump_real.html', rawHtml);
}

scrapeLogic('CONVOYOFHOPE1843', 'JMKCT');
