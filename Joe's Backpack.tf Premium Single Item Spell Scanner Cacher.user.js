// ==UserScript==
// @name         Joe's Backpack.tf Premium Single Item Spell Scanner/Cacher
// @namespace    https://joekiller.com
// @version      1.0
// @description  Scans through backpack.tf premium search pages with ctrl+leftarrow. The scanning stops when all things, crafable and quality types are exhausted. Ctrl + down arrow to force stop.
// @author       Joseph Lawson
// @match        *backpack.tf/premium/search*
// ==/UserScript==
// Chrome > Settings > Privacy and Security > Site Settings > Additional Permissions > Automatic downloads > add https://[*.]backpack.tf:443
// weapons of quality 15 "decorated" need to iterate through all the qualities so skip for now
// All the items we want to scan for spells
// "make texture things" things with texture get inserted into things, make it put in both for url
let searchDelay = 0;

let errorDelay = 1000;

const params = new URLSearchParams(window.location.search);

const item = params.get("item");

const cacheName = (function() {
    const item = params.get("item");
    if (null !== item) {
        return `spellCacheSingle-${item}`;
    }
    return null;
})();

const cookieName = `cacheSearchStateSingle${item}`;

let [searchState, searchIndex, currentThing, currentSpell] = getCookie(cookieName);

let raw = true;

/*
searchState=
[searchState, searchIndex, currentThing, currentSpell]
 */

let spells = [
    "Halloween Fire",
    "Exorcism",
    "Pumpkin Bombs",
    "Voices from Below",
    "Team Spirit Footprints",
    "Headless Horseshoes",
    "Corpse Gray Footprints",
    "Violent Violet Footprints",
    "Bruised Purple Footprints",
    "Gangreen Footprints",
    "Rotten Orange Footprints",
    "Die Job",
    "Chromatic Corruption",
    "Putrescent Pigmentation",
    "Spectral Spectrum",
    "Sinister Staining"
];

/*
  0: -1 when searching by going backwards, 0 when staying still, 1 when searching forwards
  1: current index of overall iteration
  2: things index
  3: spell index
*/


const Voices = 'Voices from Below'
const DieJob = 'Die Job'
const Corruption = 'Chromatic Corruption'
const Pigmentation = 'Putrescent Pigmentation'
const Spectrum = 'Spectral Spectrum'
const Sinister = 'Sinister Staining'
const TeamSpirit = 'Team Spirit Footprints'
const Headless = 'Headless Horseshoes'
const CorpseGray = 'Corpse Gray Footprints'
const Violet = 'Violent Violet Footprints'
const Purple = 'Bruised Purple Footprints'
const Gangreen = 'Gangreen Footprints'
const Orange = 'Rotten Orange Footprints'
const Exorcism = 'Exorcism'
const PumpkinBombs = 'Pumpkin Bombs'
const HalloweenFire = 'Halloween Fire'

function  isColor(spell) {
    return [DieJob, Corruption, Pigmentation, Spectrum, Sinister].some((s) => spell.includes(s))
}

function  isFootprint(spell) {
    return [TeamSpirit, Headless, CorpseGray, Violet, Purple, Gangreen, Orange].some((s) => spell.includes(s))
}

function  isExorcism(spell) {
    return spell.includes(Exorcism);
}

function  isVoices(spell) {
    return spell.includes(Voices);
}

function  normalize(spell1, spell2) {
    const normal = [spell1, spell2];
    const flip = [spell2, spell1];
    const voices = isVoices(spell1) || isVoices(spell2);
    const colored = isColor(spell1) || isColor(spell2);
    const prints = isFootprint(spell1) || isFootprint(spell2);
    if (colored && voices) {
        return isColor(spell1) ? normal : flip;
    } else if (prints && voices) {
        return isFootprint(spell1) ? normal : flip;
    } else if (prints && colored) {
        return isColor(spell1) ? normal : flip;
    } else {
        return isExorcism(spell1) ? flip : normal;
    }
}

class Item {
    isCraftable() {
        return this.craftable === 1;
    }

    isTradable() {
        return this.tradable === 1;
    }

    constructor(title, originalId, spell1, spell2, basename, quality, tradable, craftable, qualityElevated, qualityElevatedName, ksTier, owner, qualityName, onlyOwner) {
        this.title = title;
        this.originalId = originalId;
        this.craftable = craftable;
        this.tradable = tradable;
        this.quality = quality;
        this.basename = basename;
        this.qualityElevated = qualityElevated;
        this.qualityElevatedName = qualityElevatedName;
        this.ksTier = ksTier;
        this.owner = owner;
        this.qualityName = qualityName;
        if (null !== spell2) {
            const [s1, s2] = normalize(spell1, spell2);
            this.spell = `${s1.slice(s1.indexOf(":") + 2)} ${s2.slice(s2.indexOf(":") + 2)}`;
            this.double = true;
        } else {
            this.spell = spell1.slice(spell1.indexOf(":") + 2);
            this.double = false;
        }
        this.onlyOwner = onlyOwner
    }

    isDouble() {
        return this.double;
    }

    toString() {
        let result = '';
        if (options.showCraftable) {
            if (!this.isCraftable()) {
                result = 'Non-Craftable ';
            }
        }
        if (!this.tradable) {
            result = result ? `${result}Non-Tradable ` : 'Non-Tradable '
        }
        if (options.showQuality) {
            if (this.qualityElevated !== null && this.qualityElevated !== this.quality) {
                result = result ? `${result}${this.qualityElevatedName} ` : `${this.qualityElevatedName} `
            }
            if (this.quality === 14) {
                result = result ? `${result}Collector\'s ` : 'Collector\'s ';
            } else if (this.quality === 15) {
                result = result ? `${result}Decorated ` : 'Decorated ';
            } else if (this.quality === 1) {
                result = result ? `${result}Genuine ` : 'Genuine ';
            } else if (this.quality === 13) {
                result = result ? `${result}Haunted ` : 'Haunted ';
            } else if (this.quality === 6) {
                // nothing it is Unique
            } else if (this.quality === 0) {
                // nothing it is Normal
            } else if (this.quality === 9) {
                result = result ? `${result}Self-Made ` : 'Self-Made ';
            } else if (this.quality === 11) {
                result = result ? `${result}Strange ` : 'Strange ';
            } else if (this.quality === 5) {
                result = result ? `${result}Unusual ` : 'Unusual ';
            } else if (this.quality === 3) {
                result = result ? `${result}Vintage ` : 'Vintage ';
            } else {
                throw new Error(`Unknown Quality ${this.quality}`);
            }
        }
        if (options.showKillstreak) {
            if (null !== this.ksTier) {
                if (this.ksTier === 1) {
                    result = result ? `${result}Killstreak ` : 'Killstreak ';
                } else if (this.ksTier === 2) {
                    result = result ? `${result}Specialized Killstreak ` : 'Specialized Killstreak ';
                } else if (this.ksTier === 3) {
                    result = result ? `${result}Professional Killstreak ` : 'Professional Killstreak ';
                } else {
                    throw new Error(`Unknown Killstreak Tier ${this.ksTier}`);
                }
            }
        }
        if (options.showSpell) {
            result = result ? `${result}${this.spell} ` : `${this.spell} `;
        }
        return result ? `${result}${this.basename}` : this.basename;
    }

    static parseEntry(obj) {
        const keys = Object.keys(obj);
        const title = obj.title;
        const originalId = parseInt(obj['data-original_id']);
        const spell1 = obj['data-spell_1'];
        const spell2 = keys.includes('data-spell_2') ? obj['data-spell_2'] : null;
        const baseName = obj['data-base_name'];
        const quality = parseInt(obj['data-quality']);
        const qualityname = obj['data-q_name'];
        const tradable = parseInt(obj['data-tradable']);
        const craftable = parseInt(obj['data-craftable']);
        const qe = keys.includes('data-quality_elevated') ? parseInt(obj['data-quality_elevated']) : null;
        const qeName = keys.includes('data-qe_name') ? obj['data-qe_name'] : null;
        const ksTier = keys.includes('data-ks_tier') ? parseInt(obj['data-ks_tier']) : null;
        const owner = keys.includes('owner') ? obj['owner'] : null;
        let onlyOwner = keys.includes('onlyOwner') ? obj['onlyOwner'] : null;
        if (keys.includes('ownlyOwner')) {
            onlyOwner = obj['ownlyOwner']
        }
        return new Item(title, originalId, spell1, spell2, baseName, quality, tradable, craftable, qe, qeName, ksTier, owner, qualityname, onlyOwner);
    }
}

const options = {
    showQuality: true,
    showKillstreak: true,
    showCraftable: true,
    showSpell: true,
}

function runGroup(itemsMap, itemIdList, extra) {
    let pick = "all" ;
    if (null == extra)
        extra = -1;
    let pickTest = (item) => true;
    if (1 === extra) {
        pickTest = (item) => false === item.double;
        pick = "single";
    } else if (2 === extra) {
        pickTest = (item) => true === item.double;
        pick = "double";
    }
    console.log(`running ${JSON.stringify(options)}`);
    const ids = [];
    const baseNames = {};
    const nameQuality = [];
    const totalItems = itemIdList.length;
    console.log(`${totalItems} items to process`)
    itemIdList.forEach((id, n) => {
        const i = itemsMap[id];
        if (i.isTradable() && !ids.includes(i.originalId) && pickTest(i)) {
            // assemble basename quality groupings
            const nq = `${i.qualityName} ${i.basename}`;
            if (!nameQuality.includes(nq)) {
                nameQuality.push(nq)
                baseNames[nq] = {};
                baseNames[nq][i.originalId] = i;
            } else {
                baseNames[nq][i.originalId] = i;
            }
            ids.push(i.originalId);
        }
        if(n % 10000 === 0) {
            console.log(`${n}/${totalItems} finished`);
        }
    });
    return nameQuality.map(name => {
        let itemOutputs = {};
        let spells = [];
        let itemOutput = null;
        let indexOutput = null;
        const outfn = (result) => {
            return `${result.title} (${result.spell})-https://backpack.tf/item/${result.originalId}\n`
        }
        const indexfn = (result) => {
            return `https://backpack.tf/item/${result.originalId}\n`
        }
        const ids = Object.keys(baseNames[name]).sort((a, b) => baseNames[name][a].spell - baseNames[name][b].spell);
        let allItems = 0;
        for(let n = 0; n < ids.length; n++) {
            const id = ids[n];
            const result = baseNames[name][id];
            if(!spells.includes(result.spell)) {
                itemOutputs[result.spell] = {}
                spells.push(result.spell);
            }
            itemOutputs[result.spell][result.originalId] = result;
            allItems += 1;
        }

        if(0 !== allItems) {
            itemOutput = `Total: ${allItems}\n`
        }

        // list totals first
        let headerOut = [];
        for(let i = 0; i < spells.length; i++) {
            let spell = spells[i];
            let ids = Object.keys(itemOutputs[spell]);
            let header = `${spell}: ${ids.length}\n`;
            headerOut.push({raw: header, index: i});
        }

        headerOut.sort((a, b) => {
            let asplit = a.raw.split(':',2);
            let bsplit = b.raw.split(':',2);
            let result = parseInt(asplit[1]) - parseInt(bsplit[1]);
            if (0 !== result) return result;
            return asplit[0].localeCompare(bsplit[0]);
        })

        if(null !== itemOutput) {
            itemOutput = `${itemOutput}${headerOut.map(out => out.raw).join('')}\n`;
        }

        // list items
        let total = 1;
        for(let i = 0; i < headerOut.length; i++) {
            let spell = spells[headerOut[i].index];
            let ids = Object.keys(itemOutputs[spell]);
            let header = `${spell}: ${ids.length}\n`;
            itemOutput = null === itemOutput ? header : `${itemOutput}${header}`;
            for(let j = 0; j < ids.length; j++) {
                let id = ids[j];
                let item = itemOutputs[spell][id];
                itemOutput = `${itemOutput}${total}. ${outfn(item)}`
                total++;
                indexOutput = null === indexOutput ? indexfn(item) : `${indexOutput}${indexfn(item)}`
            }
        }
        itemOutput = `${itemOutput}\nfast access\n↓ ↓ ↓\n\n`;
        itemOutput = `${itemOutput}${indexOutput}`
        return {name: name, output: itemOutput};
    });
}



let transitioned = false;
run();

// Stores all spells into localStorage
function saveSpells() {
    let spellCache = {};
    if (cacheName) {
        if (localStorage.getItem(cacheName)) {
            try {
                spellCache = JSON.parse(localStorage.getItem(cacheName));
            } catch {
                spellCache = {};
            }
        }
        let rows = document.evaluate(
            "./main/div[2]/div[1]/div/div",
            document.body,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null);

        if(0 === rows.snapshotLength) {
            rows = document.evaluate(
                "./main/div/div[1]/div/div",
                document.body,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null);
        }

        for (let i = 0; i < rows.snapshotLength; i++) {
            let thisRow = rows.snapshotItem(i);
            let thisItem = document.evaluate(
                "./ul/li",
                thisRow,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null).snapshotItem(0);

            let thisDetail = document.evaluate(
                "./div/div/div/span/a",
                thisRow,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null).snapshotItem(0);

            // Checks for a spell
            if (null !== thisItem && thisItem.hasAttribute("data-spell_1")) {
                let itemId = thisItem.getAttribute("data-original_id");
                let entry = {};
                let attributes = thisItem.getAttributeNames();
                for (let j = 0; j < attributes.length; j++) {
                    entry[attributes[j]] = thisItem.getAttribute(attributes[j]);
                }
                // detect craft number
                let topLeft = thisItem.getElementsByClassName('tag top-left');
                if (topLeft && topLeft.length && topLeft[0].innerText) {
                    entry.craftNumber = topLeft[0].innerText;
                }
                entry.owner = thisDetail.getAttribute("data-id");
                spellCache[itemId] = entry;
                console.log(`wrote ${itemId}: ${JSON.stringify(entry)}`);
            }
        }
        let cacheSize = Object.keys(spellCache).length;
        if (cacheSize > 0) {
            localStorage.setItem(cacheName, JSON.stringify(spellCache));
        }
        if (cacheSize > 4999) {
            downloadCache();
        }
    }
}

// back to first page
function updateUrl(loc) {
    if (0 === Array.from(params.keys()).length) {
        loc = loc + `?item=${bpTfName(item)}`;
    } else {
        const cItem = params.get('item');
        loc = cItem ? loc.replace(`item=${bpTfName(cItem)}`, `item=${bpTfName(item)}`) : loc + `&item=${bpTfName(item)}`;
    }
    const cSpell = params.get('spell');
    loc = cSpell ? loc.replace(`spell=${bpTfName(cSpell)}`, `spell=${bpTfName(spells[currentSpell])}`) : loc + `&spell=${bpTfName(spells[currentSpell])}`;
    const cPage = params.get('page');
    loc = cPage ? loc.replace(`page=${cPage}`, `page=1`) : loc + "&page=1";
    return loc;
}

function downloadCache() {
    let dumpObject = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.match(/^spellCache.*/)) {
            const item = key.substr('spellCacheSingle-'.length);
            if ('null' !== item) {
                dumpObject[item] = JSON.parse(localStorage.getItem(key));
                localStorage.removeItem(key);
            }
        }
    }
    if (raw) {
        download(`dump-${item}.json`, JSON.stringify(dumpObject, null, 2))
    } else {
        Object.keys(dumpObject).forEach((itemName) => {
            const processed = {}
            const processedKeys = [];
            const rawIds = Object.keys(dumpObject[itemName]);
            rawIds.forEach(itemId => {
                processed[itemId] = Item.parseEntry(dumpObject[itemName][itemId]);
                if(!processedKeys.includes(itemId)) {
                    processedKeys.push(parseInt(itemId));
                }
            })
            if(0 !== Object.keys(processedKeys).length) {
                const outputs = runGroup(processed, processedKeys, null);
                outputs.forEach(output => download(`spells-${output.name}.txt`, output.output));
            }
        });
    }
}

function run() {
    let loc = location.href;
    // snapshot every time (for science)
    saveSpells();
    // first time run
    if (
        currentThing === 0
        && searchIndex === 0
        && currentSpell === 0
        && (searchState === -1)
        && transitioned // person did something on kb otherwise we are just passing through
    )
    {
        console.log('first run');
        setTimeout(function() {
            saveSpells();
            saveCookie(cookieName, 1, searchIndex, currentThing, currentSpell, 7);
            if (searchState !== 0) {
                location.assign(updateUrl(loc));
            } else {
                return null;
            }
        }, searchDelay);
    } else if (searchState == -1) {
        setTimeout(function() {
            saveSpells();
            if (
                decodeURIComponent(params.get('item')) !== item
                || decodeURIComponent(params.get('spell')) !== spells[currentSpell]
            ) {
                // search is enabled but on wrong page so move to current in index
                console.log('wrong url');
                saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                const newUrl = updateUrl(loc);
                if (searchState !== 0) {
                    saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                    location.assign(newUrl);
                } else {
                    return null;
                }
                // else do nothing
            } else if(!onFirstPage()) {
                openPreviousPage();
            } else { // we are running and on the first page so jump to next quantity
                if(searchState !== 0) {
                    console.log('next quantity');
                    if (currentSpell + 1 < spells.length) {
                        currentSpell = currentSpell + 1;
                        // otherwise this drives most
                    } else {
                        downloadCache();
                        currentSpell = 0;
                        searchState = 0;
                    }
                    searchIndex = searchIndex + 1;
                    // if we haven't reached the end of our list keep going
                    if (searchState !== 0) {
                        saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                        location.assign(updateUrl(loc));
                    } else {
                        saveCookie(cookieName, 0,  searchIndex, currentThing, currentSpell, 7);
                        return null;
                    }
                }
            }
        }, searchDelay);
    }
    // effectively init
    else if (searchState == 1) {
        console.log('in init');
        setTimeout(function() {
            if (searchState !== 0) {
                let countRows;
                let rawCount;
                try {
                    countRows = document.evaluate(
                        '//*[@id="page-content"]/div[2]/div[2]/div[2]/h6',
                        document,
                        null,
                        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                        null);
                    rawCount = countRows.snapshotItem(0).textContent;
                } catch {
                    // I have no idea why but some people's results come in under here it appears
                    countRows = document.evaluate(
                        '//*[@id="page-content"]/div/div[2]/div[2]/h6',
                        document,
                        null,
                        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                        null);
                    rawCount = countRows.snapshotItem(0).textContent;
                }
                let totalResults = parseInt(rawCount.substring(rawCount.indexOf('(') + 1, rawCount.indexOf(')') - 8).replaceAll(',', ''));
                if (!onFirstPage() && !onLastPage()) {
                    saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                    openFirstPage();
                } else if (onFirstPage() && onLastPage()) {
                    // if we are on the first page and last page there isn't anything for this quality so run to iterate on through.
                    saveCookie(cookieName, -1,  searchIndex, currentThing, currentSpell, 7);
                    searchState = -1;
                    run();
                } else if (!onFirstPage() && onLastPage()) {
                    const cPage = params.get('page');
                    if (15 >= totalResults / parseInt(cPage)) {
                        // if we have 15 or less results per page, we got a full index, so just start searching
                        saveCookie(cookieName, -1,  searchIndex, currentThing, currentSpell, 7);
                        searchState = -1;
                        run();
                    } else if (15 >= totalResults / 3333) { // >= 49,995
                        const newPage = parseInt(totalResults / 15);
                        loc = cPage ? loc.replace(`page=${cPage}`, `page=${newPage}`) : loc + `&page=${newPage}`;
                        saveCookie(cookieName, -1,  searchIndex, currentThing, currentSpell, 7);
                        searchState = -1;
                        location.assign(loc);
                    } else {
                        const cPage = params.get('page');
                        loc = cPage ? loc.replace(`page=${cPage}`, `page=3333`) : loc + "&page=3333";
                        saveCookie(cookieName, -1,  searchIndex, currentThing, currentSpell, 7);
                        searchState = -1;
                        location.assign(loc);
                    }
                } else if (!onFirstPage()) {
                    saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                    openFirstPage();
                } else { // on first page and too many results
                    console.log('on first page');
                    if (15 <= totalResults / 3333) {
                        // too many results, we'll have to page
                        console.log('too many results paging');
                        saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                        location.assign(loc);
                    } else {
                        console.log('no paging needed');
                        saveCookie(cookieName, 1,  searchIndex, currentThing, currentSpell, 7);
                        openLastPage();
                    }

                }
            }
        }, searchDelay);
    }
    else if (searchState === 0) {
        saveCookie(cookieName, 0,  searchIndex, currentThing, currentSpell, 7);
    }
}

// Determines if the first or last page is loaded.
function onFirstPage() {
    return document.getElementsByClassName('fa fa-angle-left')[0].parentElement.parentElement.className == "disabled";
}

function onLastPage() {
    return document.getElementsByClassName('fa fa-angle-right')[0].parentElement.parentElement.className == "disabled";
}


// Cookies are used for saving and loading searchState between page loads in this script.

// Saves a cookie under backpack.tf
function saveCookie(cname, cvalue, cindex, cthing, spellvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    let cookie = cname + "=" + JSON.stringify([cvalue, cindex, cthing, spellvalue]) + ";" + expires + ";path=/";
    document.cookie = cookie;
}

// Loads a cookie from under backpack.tf
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            console.log(c);
            try {
                let r = JSON.parse(c.substring(name.length, c.length));
                return r;
            } catch (e){
                console.log(e);
            }
        }
    }
    return [0,0,0,0];
}

function openNextPage() {
    let nextButton = document.getElementsByClassName('fa fa-angle-right')[0];
    nextButton.click();
}

function openPreviousPage() {
    saveCookie(cookieName, searchState, searchIndex, currentThing, currentSpell, 7);
    try {
        let prevButton = document.getElementsByClassName('fa fa-angle-left')[0];
        prevButton.click();
    } catch {
        // check for 500's
        let rows = document.evaluate('/html/body/div[1]/div/div/h1',document,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE)
        let row = rows.snapshotItem(0)
        if ("500 - Server Error" === row.innerText) {
            setTimeout(function () {
                location.assign(location.href)
            }, searchDelay);
        }
    }
}

function openFirstPage() {
    let firstPageButton = document.getElementsByClassName('fa fa-angle-double-left')[0];
    firstPageButton.click();
}

function openLastPage() {
    let lastPageButton = document.getElementsByClassName('fa fa-angle-double-right')[0];
    lastPageButton.click();
}

function bpTfName(s) {
    return encodeURI(s)
        .replace(/'/g, "%27")
        .replace(/!/g, "%21")
        .replace(/,/g, "%2C")
        .replace(/\(/g, "%28")
        .replace(/\?/g, "%3F")
        .replace(/\)/g, "%29");
}

// Handles keyboard inputs
window.onkeydown = function(e) {
    if (e.ctrlKey) {
        if (e.keyCode == 40) { // Ctrl + down arrow
            searchState = 0;
            saveCookie(cookieName, 0,  searchIndex, currentThing, currentSpell, 7);
            transitioned = true;
            run();
        }

        if (e.keyCode == 37) { // Ctrl + left arrow
            searchState = -1;
            saveCookie(cookieName, -1,  searchIndex, currentThing, currentSpell, 7);
            transitioned = true;
            run();
        }
    }
};

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
