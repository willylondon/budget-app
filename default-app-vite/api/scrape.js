import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// ── Force low TLS security level so we can connect to JCA ──────────
// The JCA portal uses a weak DH key that Node.js 18+ rejects by default
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const JCA_URL = 'https://jets.jacustoms.gov.jm/portal/services/document-tracking/declaration-tracker.jsf';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/* ---------- Low-level HTTPS request to bypass TLS issues ---------- */

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
            // SECLEVEL=0 allows small DH keys
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

/* ---------- helpers ------------------------------------------------ */

async function getSessionAndViewState() {
    const res = await httpsRequest(JCA_URL);
    const html = res.text();

    // Extract JSESSIONID from set-cookie header
    const setCookies = res.headers['set-cookie'] || [];
    const cookieStr = Array.isArray(setCookies) ? setCookies.join('; ') : setCookies;
    const jsessionMatch = cookieStr.match(/JSESSIONID=([^;]+)/);
    const jsessionId = jsessionMatch ? jsessionMatch[1] : '';

    const vsMatch = html.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/);
    const viewState = vsMatch ? vsMatch[1] : '';

    return { jsessionId, viewState };
}

async function searchDeclaration(jsessionId, viewState, officeCode, year, commercialRef, trn, isImporter = false) {
    const params = new URLSearchParams();
    params.append('dec-trk', 'dec-trk');
    params.append('dec-trk:offices', officeCode);
    params.append('dec-trk:year', year);
    params.append('dec-trk:comRef', commercialRef);
    params.append('dec-trk:trn', trn);
    params.append('dec-trk:declarant', isImporter ? 'false' : 'true');
    params.append('dec-trk:j_idt63', 'Search');
    params.append('javax.faces.ViewState', viewState);

    const res = await httpsRequest(JCA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: `JSESSIONID=${jsessionId}`,
        },
        body: params.toString(),
    });

    return res.text();
}

function parseResults(html, reference) {
    import('fs').then(fs => { try { fs.writeFileSync('jca_dump_' + reference + '.html', html); } catch (e) { } });

    if (html.includes('ui-messages-error') || html.includes('No records found')) {
        return { success: false, error: 'No records found for this declaration.', isNotValid: true };
    }
    if (!html.includes('declarationDetails') && !html.includes('DECLARATION DETAILS')) {
        return { success: false, error: 'No results returned from the portal.' };
    }

    const details = {};

    // Extract from the declarationDetails table: rows with a lightGrey label + value cells
    const detailSection = html.match(/<table[^>]*id="declarationDetails"[^>]*>([\s\S]*?)<\/table>/i);
    if (detailSection) {
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(detailSection[1])) !== null) {
            const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            const tds = [];
            let tdMatch;
            while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
                tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
            }
            if (tds.length >= 2 && tds[0]) {
                // First td is the label (e.g. "CUSTOMS REFERENCE"), rest are values
                const key = tds[0].replace(/:$/, '').trim().toUpperCase();
                const value = tds.slice(1).join(' ').trim();
                if (key && value) details[key] = value;
            }
        }
    }

    // Extract Assigned Units from the dataTable (plain tbody rows)
    const assignedUnits = [];
    const dataTableMatch = html.match(/<table[^>]*class="[^"]*dataTable[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (dataTableMatch) {
        const tbodyMatch = dataTableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/i);
        const bodyHtml = tbodyMatch ? tbodyMatch[1] : dataTableMatch[1];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(bodyHtml)) !== null) {
            const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            const tds = [];
            let tdMatch;
            while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
                tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
            }
            if (tds.length >= 4) {
                assignedUnits.push({ unit: tds[0], dateAssigned: tds[1], dateCompleted: tds[2], status: tds[3] });
            }
        }
    }

    // Determine high-level status from the parsed details
    const customsRelease = details['CUSTOMS RELEASE'] || details['CustomS RELEASE'] || '';
    const exitNote = details['CUSTOMS EXIT NOTE'] || details['Customs Exit Note'] || '';
    let status = 'Pending';
    if (customsRelease.toUpperCase().includes('GENERATED') && exitNote.toUpperCase().includes('GENERATED')) {
        status = 'Released';
    } else if (customsRelease.toUpperCase().includes('GENERATED')) {
        status = 'Release Ready';
    } else if (assignedUnits.length === 0) {
        status = 'Assessment Notice Need to be Paid';
    } else if (assignedUnits.some((u) => u.status.toUpperCase().includes('QUERY') || u.status.toUpperCase().includes('QUERIED'))) {
        status = 'Queried';
    } else if (assignedUnits.some((u) => u.status.toUpperCase().includes('APPROVED') || u.status.toUpperCase().includes('COMPLETED'))) {
        status = 'Assessment';
    } else if (assignedUnits.length > 0) {
        status = 'In Progress';
    }

    return {
        success: true,
        data: {
            customsReference: details['CUSTOMS REFERENCE'] || null,
            importerName: details['IMPORTER NAME'] || null,
            status,
            customsRelease: customsRelease || null,
            exitNote: exitNote || null,
            laneAssigned: details['LANE ASSIGNED'] || null,
            assignedUnits,
            rawDetails: details,
        },
    };
}

/* ---------- main handler ------------------------------------------ */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

        const { shipmentId } = req.body || {};
        let shipmentsToScrape;
        if (shipmentId) {
            const { data } = await supabase.from('shipments').select('*').eq('id', shipmentId);
            shipmentsToScrape = data;
        } else {
            const { data } = await supabase.from('shipments').select('*').neq('status', 'Released').neq('status', 'Not Valid');
            shipmentsToScrape = data;
        }

        if (!shipmentsToScrape || shipmentsToScrape.length === 0) {
            return res.status(200).json({ message: 'No shipments to scrape', results: [] });
        }

        const results = [];
        for (const shipment of shipmentsToScrape) {
            try {
                // Get a FRESH session for each shipment (JSF ViewState is stateful per-search)
                let jsessionId, viewState;
                try {
                    const session = await getSessionAndViewState();
                    jsessionId = session.jsessionId;
                    viewState = session.viewState;
                } catch (portalErr) {
                    results.push({ shipmentId: shipment.id, ref: shipment.commercial_reference, success: false, error: `JCA unreachable: ${portalErr.message}` });
                    continue;
                }
                if (!viewState) {
                    results.push({ shipmentId: shipment.id, ref: shipment.commercial_reference, success: false, error: 'Could not get ViewState' });
                    continue;
                }

                const isImporter = shipment.tracking_role === 'Importer';
                const html = await searchDeclaration(jsessionId, viewState, shipment.office_code, shipment.year || '2026', shipment.commercial_reference, shipment.trn, isImporter);
                const parsed = parseResults(html, shipment.commercial_reference);
                results.push({ shipmentId: shipment.id, ref: shipment.commercial_reference, ...parsed });

                if (!parsed.success && parsed.isNotValid) {
                    await supabase.from('shipments').update({
                        status: 'Not Valid',
                        last_scraped_at: new Date().toISOString(),
                    }).eq('id', shipment.id);
                } else if (parsed.success) {
                    await supabase.from('shipments').update({
                        status: parsed.data.status,
                        customs_reference: parsed.data.customsReference,
                        last_scraped_at: new Date().toISOString(),
                    }).eq('id', shipment.id);

                    for (const unit of parsed.data.assignedUnits) {
                        await supabase.from('shipment_statuses').upsert({
                            shipment_id: shipment.id,
                            status_type: unit.unit,
                            status_value: unit.status,
                            date_time_assigned: unit.dateAssigned ? new Date(unit.dateAssigned).toISOString() : null,
                            date_time_completed: unit.dateCompleted ? new Date(unit.dateCompleted).toISOString() : null,
                        }, { onConflict: 'shipment_id,status_type' });
                    }

                    // Store extra details as keyed status entries
                    const extraFields = [
                        { key: 'ATTR:IMPORTER NAME', val: parsed.data.importerName },
                        { key: 'ATTR:LANE ASSIGNED', val: parsed.data.laneAssigned },
                        { key: 'ATTR:CUSTOMS RELEASE', val: parsed.data.customsRelease },
                        { key: 'ATTR:CUSTOMS EXIT NOTE', val: parsed.data.exitNote },
                    ];

                    for (const field of extraFields) {
                        if (field.val) {
                            await supabase.from('shipment_statuses').upsert({
                                shipment_id: shipment.id,
                                status_type: field.key,
                                status_value: String(field.val),
                                created_at: new Date().toISOString()
                            }, { onConflict: 'shipment_id,status_type' });
                        }
                    }
                }
            } catch (err) {
                results.push({ shipmentId: shipment.id, ref: shipment.commercial_reference, success: false, error: err.message });
            }
        }

        return res.status(200).json({ message: `Scraped ${results.length} shipment(s)`, results });
    } catch (err) {
        console.error('Scrape error:', err);
        return res.status(500).json({ error: err.message });
    }
}
