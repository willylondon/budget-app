import https from 'https';
import fs from 'fs';

const REFERENCE = 'CONVOYOFHOPE1843'; // Assuming this might have BRA approval, or we'll find out
const TRN = '000000000';
const OFFICE = 'JMKCT';

const agent = new https.Agent({ ciphers: 'DEFAULT:@SECLEVEL=0' });

const getReq = https.request({
    hostname: 'jets.jacustoms.gov.jm',
    port: 443,
    path: '/portal/services/document-tracking/declaration-tracker.jsf',
    method: 'GET',
    agent
}, (res) => {
    let cookie = '';
    if (res.headers['set-cookie']) {
        cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const viewStateMatch = data.match(/id="javax\.faces\.ViewState" value="(.*?)"/);
        const viewState = viewStateMatch ? viewStateMatch[1] : '';

        const postData = new URLSearchParams({
            'javax.faces.partial.ajax': 'true',
            'javax.faces.source': 'formTracking:btnSearch',
            'javax.faces.partial.execute': '@all',
            'javax.faces.partial.render': 'formTracking',
            'formTracking:btnSearch': 'formTracking:btnSearch',
            'formTracking': 'formTracking',
            'formTracking:txtReference': REFERENCE,
            'formTracking:txtTrn': TRN,
            'formTracking:selOffice': OFFICE,
            'javax.faces.ViewState': viewState
        }).toString();

        const postReq = https.request({
            hostname: 'jets.jacustoms.gov.jm',
            port: 443,
            path: '/portal/services/document-tracking/declaration-tracker.jsf',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(postData),
                'Faces-Request': 'partial/ajax',
                'Cookie': cookie
            },
            agent
        }, (postRes) => {
            let postBody = '';
            postRes.on('data', chunk => postBody += chunk);
            postRes.on('end', () => {
                fs.writeFileSync('jca_dump.html', postBody);
                console.log('Saved to jca_dump.html');
            });
        });
        postReq.write(postData);
        postReq.end();
    });
});
getReq.end();
