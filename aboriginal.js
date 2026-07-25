
// ── Aboriginal sites layer ──
let aboriginalMarkers = [];
let aboriginalActive = false;
let aboriginalData = null;

function toggleAboriginal() {
    const btn = document.getElementById('btn-aboriginal');
    if (aboriginalActive) {
        aboriginalMarkers.forEach(function(m) { map.removeLayer(m); });
        aboriginalMarkers = [];
        aboriginalActive = false;
        btn.classList.remove('active');
    } else {
        aboriginalActive = true;
        btn.classList.add('active');
        if (aboriginalData) {
            renderAboriginal();
        } else {
            fetch('aboriginal-sites.geojson')
                .then(r => r.json())
                .then(function(data) { aboriginalData = data; renderAboriginal(); })
                .catch(function(err) { console.log('Aboriginal sites error:', err); });
        }
    }
}

function renderAboriginal() {
    aboriginalData.features.forEach(function(f) {
        const p = f.properties;
        const icon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:#c1440e;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        const marker = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { icon }).addTo(map);
        const popupDiv = document.createElement('div');
        popupDiv.style.minWidth = '240px';
        popupDiv.innerHTML =
            '<b>' + p.name + '</b><br>' +
            '<small><b style="color:#d67214;">Country:</b> <b>' + p.country + '</b></small><br><br>' +
            (p.location ? '<b>Location:</b> ' + p.location + '<br>' : '') +
            (p.significance ? '<br>' + p.significance + '<br>' : '') +
            (p.access ? '<br><b>Access:</b> ' + p.access + '<br>' : '') +
            (p.permits ? '<b>Permits:</b> ' + p.permits + '<br>' : '') +
            (p.guided_tours ? '<b>Tours:</b> ' + p.guided_tours + '<br>' : '') +
            makeNavButton(f.geometry.coordinates[1], f.geometry.coordinates[0]);
        marker.bindPopup(popupDiv);
        aboriginalMarkers.push(marker);
    });
}

// ── GeoSites layer (fossils, caves, shells, minerals, meteorites) ──
