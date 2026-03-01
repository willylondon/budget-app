import https from 'https';
import * as cheerio from 'cheerio';

const REFERENCE = 'ODPEM6019'; // One of the valid ones
const TRN = '000000000'; // Usually 000000000
const OFFICE = 'JMKCT';

function performScrape() {
    const agent = new https.Agent({
        ciphers: 'DEFAULT:@SECLEVEL=0'
    });

    const getReq = https.request({
        hostname: 'www.jacustoms.gov.jm',
        port: 443,
        path: '/portals/declTrk.jsf',
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
            const $ = cheerio.load(data);
            const viewState = $('input[name="javax.faces.ViewState"]').val();

            const postData = new URLSearchParams({
                'frmDeclTrk': 'frmDeclTrk',
                'frmDeclTrk:j_id20': REFERENCE,
                'frmDeclTrk:j_id22': TRN,
                'frmDeclTrk:j_id25': OFFICE,
                'frmDeclTrk:j_id27': 'Search',
                'javax.faces.ViewState': viewState
            }).toString();

            const postReq = https.request({
                hostname: 'www.jacustoms.gov.jm',
                port: 443,
                path: '/portals/declTrk.jsf',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'Cookie': cookie
                },
                agent
            }, (postRes) => {
                let postBody = '';
                postRes.on('data', chunk => postBody += chunk);
                postRes.on('end', () => {
                    console.log(parseResults(postBody));
                });
            });

            postReq.write(postData);
            postReq.end();
        });
    });

    getReq.end();
}

function parseResults(html) {
    const $ = cheerio.load(html);

    if ($('div.pbError').text().includes('No records found')) {
        return { isNotValid: true };
    }

    const assignedUnits = [];
    $('table.dataTable tr').each((i, row) => {
        if (i === 0) return;
        const cols = $(row).find('td');
        if (cols.length >= 2) {
            assignedUnits.push({
                unit: $(cols[0]).text().trim(),
                status: $(cols[1]).text().trim()
            });
        }
    });

    const details = {};
    $('table#declarationDetails tr').each((i, row) => {
        const cols = $(row).find('td');
        if (cols.length === 2) {
            const key = $(cols[0]).text().trim().replace(/:/g, '').toUpperCase();
            const value = $(cols[1]).text().trim();
            if (key && value) {
                details[key] = value;
            }
        }
    });

    let overallStatus = 'Pending';
    const customsRelease = details['CUSTOMS RELEASE'];
    const exitNote = details['EXIT NOTE STATUS'] || details['EXIT NOTE'];

    const hasAssessment = assignedUnits.some(u => u.unit === 'ASSESSMENT');
    const hasInProgress = assignedUnits.some(u => u.status.includes('IN PROGRESS') || u.status.includes('QUERIED'));

    if (customsRelease === 'Generated' && exitNote === 'Generated') {
        overallStatus = 'Released';
    } else if (customsRelease === 'Generated' && exitNote === 'Pending') {
        overallStatus = 'Awaiting Exit';
    } else if (hasInProgress) {
        overallStatus = 'In Progress';
    } else if (hasAssessment) {
        overallStatus = 'Assessment';
    }

    return { assignedUnits, details, status: overallStatus };
}

performScrape();
