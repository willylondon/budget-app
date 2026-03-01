import https from 'https';
import { URL } from 'url';

const JCA_URL = 'https://jets.jacustoms.gov.jm/portal/services/document-tracking/declaration-tracker.jsf';

function httpsReq(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = https.request({
            hostname: parsed.hostname, port: 443, path: parsed.pathname,
            method: opts.method || 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0', ...(opts.headers || {}) },
            rejectUnauthorized: false, ciphers: 'DEFAULT:@SECLEVEL=0',
        }, (res) => {
            let body = ''; res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        if (opts.body) req.write(opts.body);
        req.end();
    });
}

async function testRef(ref, trn) {
    console.log(`\n=== Testing: ${ref} ===`);

    // Fresh session
    const get = await httpsReq(JCA_URL);
    const jsid = (Array.isArray(get.headers['set-cookie']) ? get.headers['set-cookie'].join(';') : (get.headers['set-cookie'] || '')).match(/JSESSIONID=([^;]+)/)?.[1] || '';
    const vs = get.body.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/)?.[1] || '';

    const params = new URLSearchParams();
    params.append('dec-trk', 'dec-trk');
    params.append('dec-trk:offices', 'JMKCT');
    params.append('dec-trk:year', '2026');
    params.append('dec-trk:comRef', ref);
    params.append('dec-trk:trn', trn);
    params.append('dec-trk:declarant', 'true');
    params.append('dec-trk:j_idt63', 'Search');
    params.append('javax.faces.ViewState', vs);

    const post = await httpsReq(JCA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: `JSESSIONID=${jsid}` },
        body: params.toString(),
    });

    const html = post.body;
    const hasDetails = html.includes('declarationDetails') && html.includes('DECLARATION DETAILS');
    const hasError = html.includes('ui-messages-error');

    // Extract customs reference
    const custRef = html.match(/CUSTOMS REFERENCE<\/td>\s*<td[^>]*>(.*?)<\/td>/s)?.[1]?.trim() || 'NOT FOUND';
    // Extract release status
    const releaseMatch = html.match(/CUSTOMS RELEASE<\/td>\s*<td>(.*?)<\/td>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'NOT FOUND';
    // Extract exit note
    const exitMatch = html.match(/CUSTOMS EXIT NOTE<\/td>\s*<td>(.*?)<\/td>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'NOT FOUND';

    console.log(`  Has details: ${hasDetails}`);
    console.log(`  Has error: ${hasError}`);
    console.log(`  Customs Ref: ${custRef}`);
    console.log(`  Release: ${releaseMatch}`);
    console.log(`  Exit Note: ${exitMatch}`);
}

// Test all 3 references
await testRef('CBJ286', '1203709130000');
await testRef('CBJ298', '1203709130000');
await testRef('UNICEF8000', '1203709130000');
