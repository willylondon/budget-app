import { scrapeLogic, getSessionAndViewState } from './scrape.js';
import fs from 'fs';

async function test() {
    const { sessionCookies, viewState } = await getSessionAndViewState();
    const res = await scrapeLogic('CONVOYOFHOPE1843', 'JMKCT', sessionCookies, viewState);

    if (res.rawHtml) {
        fs.writeFileSync('jca_dump_real.html', res.rawHtml);
        console.log('Saved to jca_dump_real.html');
    } else {
        console.log('No rawHtml returned', res);
    }
}
test();
