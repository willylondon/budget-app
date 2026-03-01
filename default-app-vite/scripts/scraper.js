import puppeteer from 'puppeteer';

/**
 * Scrapes the Jamaica Customs Agency Declaration Tracker portal
 * for a single shipment's current status.
 *
 * @param {string} officeCode  e.g. "JMKCT"
 * @param {string} year        e.g. "2026"
 * @param {string} reference   e.g. "CBJ286"
 * @param {string} trn         e.g. "1203709130000"
 * @param {boolean} isImporter true = "Importer" radio, false = "Declarant"
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function scrapeCustomsPortal(officeCode, year, reference, trn, isImporter = false) {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to the Declaration Tracker
        const url = 'https://jets.jacustoms.gov.jm/portal/services/document-tracking/declaration-tracker.jsf';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // --- Fill in the form ---

        // 1. Office selector
        await page.waitForSelector('#mainForm\\:officeCode', { timeout: 10000 });
        await page.select('#mainForm\\:officeCode', officeCode);

        // 2. Year
        await page.waitForSelector('#mainForm\\:year', { timeout: 5000 });
        await page.click('#mainForm\\:year', { clickCount: 3 });
        await page.type('#mainForm\\:year', year);

        // 3. Commercial Reference
        await page.waitForSelector('#mainForm\\:commercialRef', { timeout: 5000 });
        await page.click('#mainForm\\:commercialRef', { clickCount: 3 });
        await page.type('#mainForm\\:commercialRef', reference);

        // 4. TRN
        await page.waitForSelector('#mainForm\\:trn', { timeout: 5000 });
        await page.click('#mainForm\\:trn', { clickCount: 3 });
        await page.type('#mainForm\\:trn', trn);

        // 5. Role radio button
        if (isImporter) {
            await page.click('#mainForm\\:role\\:1'); // "Importer" radio
        } else {
            await page.click('#mainForm\\:role\\:0'); // "Declarant" radio
        }

        // 6. Click Search
        await page.click('#mainForm\\:searchBtn');

        // Wait for results to load
        await page.waitForFunction(
            () => document.querySelector('.ui-panel-content') !== null || document.querySelector('.ui-messages-error') !== null,
            { timeout: 15000 }
        );

        // Check for error messages
        const hasError = await page.$('.ui-messages-error');
        if (hasError) {
            const errorMsg = await page.$eval('.ui-messages-error', el => el.textContent.trim());
            return { success: false, error: errorMsg || 'No results found.' };
        }

        // --- Parse the results ---

        // Declaration Details section
        const declarationDetails = await page.evaluate(() => {
            const rows = document.querySelectorAll('.ui-panelgrid-cell');
            const data = {};
            for (let i = 0; i < rows.length - 1; i += 2) {
                const key = rows[i]?.textContent?.trim()?.replace(':', '');
                const value = rows[i + 1]?.textContent?.trim();
                if (key && value) data[key] = value;
            }
            return data;
        });

        // Customs Assigned Units table
        const assignedUnits = await page.evaluate(() => {
            const tableRows = document.querySelectorAll('.ui-datatable-data tr');
            return Array.from(tableRows).map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    unit: cells[0]?.textContent?.trim() || '',
                    dateAssigned: cells[1]?.textContent?.trim() || '',
                    dateCompleted: cells[2]?.textContent?.trim() || '',
                    status: cells[3]?.textContent?.trim() || '',
                };
            });
        });

        // Determine high-level status
        const customsRelease = declarationDetails['Customs Release'] || '';
        let highLevelStatus = 'Pending';
        if (customsRelease.toLowerCase().includes('generated')) {
            highLevelStatus = 'Released';
        } else if (assignedUnits.some(u => u.status === 'Completed')) {
            highLevelStatus = 'Assessment';
        }

        return {
            success: true,
            data: {
                customsReference: declarationDetails['Customs Reference Number'] || null,
                importerName: declarationDetails['Importer'] || null,
                status: highLevelStatus,
                customsRelease: declarationDetails['Customs Release'] || null,
                exitNote: declarationDetails['Exit Note'] || null,
                laneAssigned: declarationDetails['Lane Assigned'] || null,
                assignedUnits,
                rawDetails: declarationDetails,
            },
        };
    } catch (err) {
        return { success: false, error: err.message };
    } finally {
        if (browser) await browser.close();
    }
}
