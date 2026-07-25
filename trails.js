let trailPins = { walk: [], paddle: [], '2x2': [] };
let trailLines = { walk: {}, paddle: {}, '2x2': {} };
let trailActive = { walk: false, paddle: false, '2x2': false };
let trailIndex = null;

const trailConfig = {
    'walk':   { color: '#8B4513', label: 'Walk',   type: 'Walking Trail'  },
    'paddle': { color: '#1a6dd8', label: 'Paddle', type: 'Paddle Trail'   },
    '2x2':    { color: '#7b2d8b', label: '2x2',    type: '2x2 Track'      }
};

function cleanTrailName(filename) {
    return filename
        .split('/').pop()
        .replace('.kml', '')
        .replace(/ Trail$/, '')
        .replace(/ Paddle$/, '')
        .replace(/ 2x2$/, '')
        .trim();
}

function toggleTrailLayer(category) {
    const btn = document.getElementById('btn-' + category);
    if (trailActive[category]) {
        trailPins[category].forEach(function(m) { map.removeLayer(m); });
        trailPins[category] = [];
        Object.values(trailLines[category]).forEach(function(l) { map.removeLayer(l); });
        trailLines[category] = {};
        trailActive[category] = false;
        if (btn) btn.classList.remove('active');
    } else {
        trailActive[category] = true;
        if (btn) btn.classList.add('active');
        if (trailIndex) {
            loadTrailPins(category);
        } else {
            fetch('trails-index.json')
                .then(r => r.json())
                .then(function(data) {
                    trailIndex = data;
                    loadTrailPins(category);
                })
                .catch(function(err) { console.log('Trail index error:', err); });
        }
    }
}

// ── Notes (stored in Firebase, shared helper for trails + camps) ──
let trailNotesCache = {};
let campNotesCache = {};

function trailKeyToFirebaseKey(fileKey) {
    return fileKey.replace(/[.#$\/\[\]]/g, '_');
}

function buildCampPopup(marker, e, name) {
    const popupDiv = document.createElement('div');
    popupDiv.style.minWidth = '220px';

    const header = document.createElement('div');
    header.innerHTML = '<b>' + name + '</b><br><small>WA Campsite</small>';
    popupDiv.appendChild(header);

    const osmDiv = document.createElement('div');
    osmDiv.style.cssText = 'margin-top:6px;font-size:13px;color:#333;';
    osmDiv.innerHTML =
        (e.tags.fee ? 'Fee: ' + e.tags.fee + '<br>' : '') +
        (e.tags.toilets ? 'Toilets: ' + e.tags.toilets + '<br>' : '') +
        (e.tags.shower ? 'Shower: ' + e.tags.shower + '<br>' : '') +
        (e.tags.water ? 'Water: ' + e.tags.water + '<br>' : '') +
        (e.tags.caravans ? 'Caravans: ' + e.tags.caravans + '<br>' : '') +
        (e.tags.website ? '<a href="' + e.tags.website + '" target="_blank">More info</a><br>' : '');
    popupDiv.appendChild(osmDiv);

    const notesDiv = document.createElement('div');
    notesDiv.style.cssText = 'margin-top:6px;font-size:13px;color:#333;';
    popupDiv.appendChild(notesDiv);

    const credit = document.createElement('div');
    credit.innerHTML = '<small>© OpenStreetMap</small>';
    credit.style.cssText = 'margin-top:6px;color:#999;';
    popupDiv.appendChild(credit);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:10px;';

    const notesBtn = document.createElement('button');
    notesBtn.textContent = 'Add Notes';
    notesBtn.style.cssText = 'padding:7px 14px;border-radius:8px;border:1.5px solid #d67214;background:white;color:#d67214;font-size:13px;font-weight:600;cursor:pointer;';
    const navBtn = document.createElement('a');
    navBtn.href = 'https://www.google.com/maps/dir/?api=1&destination=' + e.lat + ',' + e.lon;
    navBtn.target = '_blank';
    navBtn.textContent = '🧭 Navigate';
    navBtn.style.cssText = 'display:inline-block;padding:7px 14px;border-radius:8px;background:#1a6dd8;color:white;font-size:13px;font-weight:600;text-decoration:none;';
    btnRow.appendChild(navBtn);
    btnRow.appendChild(notesBtn);
    popupDiv.appendChild(btnRow);

    const campKey = 'camp_' + (e.id || (e.lat.toFixed(5) + '_' + e.lon.toFixed(5)));

    function renderNotes(notes) {
        if (!notes) { notesDiv.innerHTML = ''; notesBtn.textContent = 'Add Notes'; return; }
        notesBtn.textContent = 'Edit Notes';
        notesDiv.innerHTML = '<div style="margin-top:2px;"><b>My notes:</b><br>' + notes.blurb + '</div>';
    }

    notesBtn.addEventListener('click', function() {
        openNotesForm(campKey, name, '#d67214', notesDiv, campNotesCache, renderNotes, true);
    });

    if (campNotesCache[campKey] !== undefined) {
        renderNotes(campNotesCache[campKey]);
    } else {
        db.ref('campNotes/' + campKey).once('value').then(function(snap) {
            const notes = snap.val();
            campNotesCache[campKey] = notes;
            renderNotes(notes);
        }).catch(function() {});
    }

    marker.bindPopup(popupDiv);
}

// Generic simple notes form (blurb only) used for camps
function openNotesForm(key, name, color, notesDiv, cache, renderFn, simple) {
    const existing = cache[key] || {};

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:3000;display:flex;align-items:center;justify-content:center;';

    const form = document.createElement('div');
    form.style.cssText = 'background:white;border-radius:16px;padding:20px;width:300px;max-width:calc(100vw - 32px);box-shadow:0 8px 32px rgba(0,0,0,0.25);';

    form.innerHTML =
        '<h3 style="margin:0 0 12px;font-size:16px;">' + name + '</h3>' +
        '<textarea id="cn-blurb" placeholder="Your notes about this site..." style="width:100%;height:90px;margin-bottom:10px;padding:9px 11px;border-radius:8px;border:1.5px solid #e8e8e8;font-size:14px;box-sizing:border-box;resize:none;">' + (existing.blurb || '') + '</textarea>' +
        '<div style="display:flex;gap:8px;">' +
        '<button id="cn-save" style="flex:1;padding:11px;border-radius:10px;border:none;background:' + color + ';color:white;font-weight:600;cursor:pointer;">Save</button>' +
        '<button id="cn-cancel" style="flex:1;padding:11px;border-radius:10px;border:none;background:#f0f0f0;color:#444;font-weight:600;cursor:pointer;">Cancel</button>' +
        '</div>';

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    form.querySelector('#cn-cancel').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.addEventListener('click', function(ev) {
        if (ev.target === overlay) overlay.remove();
    });

    form.querySelector('#cn-save').addEventListener('click', function() {
        const blurb = form.querySelector('#cn-blurb').value.trim();
        const notes = blurb ? { blurb: blurb } : null;
        const ref = db.ref((key.startsWith('camp_') ? 'campNotes/' : 'trailNotes/') + key);
        const save = notes ? ref.set(notes) : ref.remove();
        save.then(function() {
            cache[key] = notes;
            renderFn(notes);
            overlay.remove();
        }).catch(function(err) {
            alert('Could not save notes: ' + err.message);
        });
    });
}

function buildTrailPopup(category, file, name, latlngs, marker) {
    const cfg = trailConfig[category];
    const popupDiv = document.createElement('div');
    popupDiv.style.minWidth = '220px';

    const header = document.createElement('div');
    header.innerHTML = '<b>' + cfg.label + ' — ' + name + '</b><br><small>' + cfg.type + '</small>';
    popupDiv.appendChild(header);

    const notesDiv = document.createElement('div');
    notesDiv.style.cssText = 'margin-top:8px;font-size:13px;color:#333;';
    popupDiv.appendChild(notesDiv);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:10px;';

    const routeBtn = document.createElement('button');
    routeBtn.textContent = trailLines[category][file] ? 'Hide Route' : 'Show Route';
    routeBtn.style.cssText = 'padding:7px 14px;border-radius:8px;border:none;background:' + cfg.color + ';color:white;font-size:13px;font-weight:600;cursor:pointer;';
    routeBtn.addEventListener('click', function() {
        showTrailRoute(category, file, latlngs);
        routeBtn.textContent = trailLines[category][file] ? 'Hide Route' : 'Show Route';
    });
    btnRow.appendChild(routeBtn);

    const notesBtn = document.createElement('button');
    notesBtn.textContent = 'Add Notes';
    notesBtn.style.cssText = 'padding:7px 14px;border-radius:8px;border:1.5px solid ' + cfg.color + ';background:white;color:' + cfg.color + ';font-size:13px;font-weight:600;cursor:pointer;';
    notesBtn.addEventListener('click', function() { openTrailNotesForm(file, name, cfg.color, notesDiv); });
    btnRow.appendChild(notesBtn);

    popupDiv.appendChild(btnRow);

    function renderNotes(notes) {
        if (!notes) { notesDiv.innerHTML = ''; notesBtn.textContent = 'Add Notes'; return; }
        notesBtn.textContent = 'Edit Notes';
        let html = '';
        if (notes.length) html += '<b>Length:</b> ' + notes.length + '<br>';
        if (notes.difficulty) html += '<b>Difficulty:</b> ' + notes.difficulty + '<br>';
        if (notes.estTime) html += '<b>Est. time:</b> ' + notes.estTime + '<br>';
        if (notes.blurb) html += '<div style="margin-top:4px;">' + notes.blurb + '</div>';
        notesDiv.innerHTML = html;
    }

    const fbKey = trailKeyToFirebaseKey(file);
    if (trailNotesCache[fbKey] !== undefined) {
        renderNotes(trailNotesCache[fbKey]);
    } else {
        db.ref('trailNotes/' + fbKey).once('value').then(function(snap) {
            const notes = snap.val();
            trailNotesCache[fbKey] = notes;
            renderNotes(notes);
        }).catch(function() {});
    }

    marker._renderTrailNotes = renderNotes;
    marker.bindPopup(popupDiv);
}

function openTrailNotesForm(file, name, color, notesDiv) {
    const fbKey = trailKeyToFirebaseKey(file);
    const existing = trailNotesCache[fbKey] || {};

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:3000;display:flex;align-items:center;justify-content:center;';

    const form = document.createElement('div');
    form.style.cssText = 'background:white;border-radius:16px;padding:20px;width:300px;max-width:calc(100vw - 32px);box-shadow:0 8px 32px rgba(0,0,0,0.25);';

    form.innerHTML =
        '<h3 style="margin:0 0 12px;font-size:16px;">' + name + '</h3>' +
        '<input id="tn-length" type="text" placeholder="Length (e.g. 4.5km)" style="width:100%;margin-bottom:8px;padding:9px 11px;border-radius:8px;border:1.5px solid #e8e8e8;font-size:14px;box-sizing:border-box;" value="' + (existing.length || '') + '">' +
        '<input id="tn-difficulty" type="text" placeholder="Difficulty (e.g. Easy, Class 3)" style="width:100%;margin-bottom:8px;padding:9px 11px;border-radius:8px;border:1.5px solid #e8e8e8;font-size:14px;box-sizing:border-box;" value="' + (existing.difficulty || '') + '">' +
        '<input id="tn-time" type="text" placeholder="Est. time (e.g. 1.5 hrs)" style="width:100%;margin-bottom:8px;padding:9px 11px;border-radius:8px;border:1.5px solid #e8e8e8;font-size:14px;box-sizing:border-box;" value="' + (existing.estTime || '') + '">' +
        '<textarea id="tn-blurb" placeholder="Notes..." style="width:100%;height:70px;margin-bottom:10px;padding:9px 11px;border-radius:8px;border:1.5px solid #e8e8e8;font-size:14px;box-sizing:border-box;resize:none;">' + (existing.blurb || '') + '</textarea>' +
        '<div style="display:flex;gap:8px;">' +
        '<button id="tn-save" style="flex:1;padding:11px;border-radius:10px;border:none;background:' + color + ';color:white;font-weight:600;cursor:pointer;">Save</button>' +
        '<button id="tn-cancel" style="flex:1;padding:11px;border-radius:10px;border:none;background:#f0f0f0;color:#444;font-weight:600;cursor:pointer;">Cancel</button>' +
        '</div>';

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    form.querySelector('#tn-cancel').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });

    form.querySelector('#tn-save').addEventListener('click', function() {
        const notes = {
            length: form.querySelector('#tn-length').value.trim(),
            difficulty: form.querySelector('#tn-difficulty').value.trim(),
            estTime: form.querySelector('#tn-time').value.trim(),
            blurb: form.querySelector('#tn-blurb').value.trim()
        };
        const isEmpty = !notes.length && !notes.difficulty && !notes.estTime && !notes.blurb;
        const ref = db.ref('trailNotes/' + fbKey);
        const save = isEmpty ? ref.remove() : ref.set(notes);
        save.then(function() {
            trailNotesCache[fbKey] = isEmpty ? null : notes;
            if (notesDiv) {
                let html = '';
                if (notes.length) html += '<b>Length:</b> ' + notes.length + '<br>';
                if (notes.difficulty) html += '<b>Difficulty:</b> ' + notes.difficulty + '<br>';
                if (notes.estTime) html += '<b>Est. time:</b> ' + notes.estTime + '<br>';
                if (notes.blurb) html += '<div style="margin-top:4px;">' + notes.blurb + '</div>';
                notesDiv.innerHTML = isEmpty ? '' : html;
            }
            overlay.remove();
        }).catch(function(err) {
            alert('Could not save notes: ' + err.message);
        });
    });
}

function loadTrailPins(category) {
    const categoryKey = category === 'walk' ? 'trails' : category;
    const files = trailIndex[categoryKey] || [];
    console.log('Loading', category, files.length, 'files');
    const cfg = trailConfig[category];
    files.forEach(function(file) {
        fetch(encodeURI(file))
            .then(r => r.text())
            .then(function(kmlText) {
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, 'text/xml');
                const coordNodes = kml.getElementsByTagName('coordinates');
                if (!coordNodes.length) return;
                const name = cleanTrailName(file);
                const raw = coordNodes[0].textContent.trim().split(/[\s]+/);
                const latlngs = raw.map(function(c) {
                    const parts = c.split(',');
                    return [parseFloat(parts[1]), parseFloat(parts[0])];
                }).filter(function(ll) { return !isNaN(ll[0]) && !isNaN(ll[1]); });
                if (latlngs.length < 2) return;
                const pinIcon = L.divIcon({
                    html: '<div style="width:14px;height:14px;background:' + cfg.color + ';border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
                    className: '',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });
                const marker = L.marker(latlngs[0], { icon: pinIcon }).addTo(map);
                buildTrailPopup(category, file, name, latlngs, marker);
                marker._trailLatlngs = latlngs;
                marker._trailKey = file;
                trailPins[category].push(marker);
            })
            .catch(function(err) { console.log('Trail load error:', file, err); });
    });
}

function showTrailRoute(category, fileKey, latlngs) {
    if (trailLines[category][fileKey]) {
        map.removeLayer(trailLines[category][fileKey]);
        delete trailLines[category][fileKey];
        return;
    }
    const line = L.polyline(latlngs, {
        color: trailConfig[category].color,
        weight: 3,
        opacity: 0.85
    }).addTo(map);
    trailLines[category][fileKey] = line;
    map.fitBounds(line.getBounds(), { padding: [40, 40] });
}

function toggle2x2() { toggleTrailLayer('2x2'); }
function show2x2Route() {}

