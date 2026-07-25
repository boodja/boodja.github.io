let dfesMarkers = [];
let dfesActive = false;

function toggleDFES() {
    if (dfesActive) {
        dfesMarkers.forEach(function(m) { map.removeLayer(m); });
        dfesMarkers = [];
        dfesActive = false;
        document.getElementById('btn-dfes').style.background = 'white';
        document.getElementById('btn-dfes').style.opacity = '1';
    } else {
        dfesActive = true;
        document.getElementById('btn-dfes').style.background = '#ffe0e0';
        fetchDFES();
    }
}

function fetchDFES() {
    fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.emergency.wa.gov.au/v1/incidents'))
        .then(response => response.json())
        .then(data => {
            data.incidents.forEach(function(incident) {
                if (!incident.location || !incident.location.latitude) return;
                
                const lat = incident.location.latitude;
                const lng = incident.location.longitude;
                const name = incident.name || 'Incident';
                const type = incident['incident-type'] || '';
                const status = incident['incident-status'] || '';
                const suburb = incident.suburbs ? incident.suburbs[0] : '';
                
                const iconMap = {
    'ew-other-burn-off': 'ew-prescribed-burn-or-burn-off',
    'ew-other-fire': 'ew-other-fire',
    'ew-structure-fire': 'ew-structure-fire-warning',
    'ew-earthquake': 'ew-earthquake',
    'ew-other-road-crash': 'ew-other-incident',
    'ew-hazmat-general-warning': 'ew-hazmat-general-warning',
    'ew-other-smell-of-gas': 'ew-hazardous-materials',
    'ew-other-active-alarm': 'ew-other-incident',
    'ew-other-report-of-smoke': 'ew-other-incident',
};
const incidentIcon = iconMap[incident['incident-icon']] || 'ew-other-incident';
    const icon = L.divIcon({
    html: '<img src="icons/dfes/' + incidentIcon + '.svg" style="width:36px;height:36px;">',
    className: 'emoji-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
});
                
                const marker = L.marker([lat, lng], { icon }).addTo(map);
                marker.bindPopup(
                    '<b>' + name + '</b><br>' +
                    '<small>' + type + '</small><br><br>' +
                    'Status: ' + status + '<br>' +
                    'Location: ' + suburb + '<br><br>' +
                    '<a href="https://www.emergency.wa.gov.au" target="_blank">🔗 Emergency WA</a>'
                );
                dfesMarkers.push(marker);
            });
        })
        .catch(function(error) {
            console.log('DFES error:', error);
            alert('Could not load DFES data — try again shortly');
        });
}
let waCampMarkers = [];
let waCampsActive = false;
const waCampCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    iconCreateFunction: function(cluster) {
        return L.divIcon({
            html: '<div style="background:#d67214;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);">' + cluster.getChildCount() + '</div>',
            className: '',
            iconSize: [34, 34]
        });
    }
});

function toggleWACamps() {
    const btn = document.getElementById('btn-wacamps');
    if (waCampsActive) {
        waCampCluster.clearLayers();
        map.removeLayer(waCampCluster);
        waCampMarkers = [];
       waCampsActive = false;
        btn.classList.remove('active');
    } else {
        waCampsActive = true;
        btn.classList.add('active');
    map.addLayer(waCampCluster);
    fetchWACamps();
}

}



let fuelMarkers = [];
let fuelActive = false;

function toggleFuel() {
    const btn = document.getElementById('btn-fuel');
    if (fuelActive) {
        fuelMarkers.forEach(m => map.removeLayer(m));
        fuelMarkers = [];
        fuelActive = false;
        btn.classList.remove('active');
    } else {
        fuelActive = true;
        btn.classList.add('active');
        fetchOSMLayer('amenity=fuel', fuelMarkers, '#e63946', 'Fuel Station');
    }
}

let waterMarkers = [];
let waterActive = false;

function toggleWater() {
    const btn = document.getElementById('btn-water');
    if (waterActive) {
        waterMarkers.forEach(m => map.removeLayer(m));
        waterMarkers = [];
        waterActive = false;
        btn.classList.remove('active');
    } else {
        waterActive = true;
        btn.classList.add('active');
        fetchOSMLayer('amenity=drinking_water', waterMarkers, '#1a6dd8', 'Drinking Water');
    }
}

function fetchOSMLayer(tag, markersArray, colour, label) {
    const b = map.getBounds();
    const bbox = b.getSouth() + ',' + b.getWest() + ',' + b.getNorth() + ',' + b.getEast();
    fetch('https://overpass-api.de/api/interpreter?data=[out:json];node[' + tag + '](' + bbox + ');out;')
        .then(r => r.json())
        .then(data => {
            markersArray.length = 0;
            data.elements.forEach(function(e) {
                if (!e.lat || !e.lon) return;
                const name = e.tags.name || label;
                const icon = L.divIcon({
                    html: '<div style="width:12px;height:12px;background:' + colour + ';border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>',
                    className: '',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });
                const marker = L.marker([e.lat, e.lon], { icon }).addTo(map);
                marker.bindPopup(
                    '<b>' + name + '</b><br>' +
                    '<small>' + label + '</small><br>' +
                    (e.tags.brand ? e.tags.brand + '<br>' : '') +
                    (e.tags.opening_hours ? 'Hours: ' + e.tags.opening_hours + '<br>' : '') +
                    (e.tags.website ? '<br><a href="' + e.tags.website + '" target="_blank">More info</a>' : '') +
                    '<br><small>© OpenStreetMap</small>'
                );
                markersArray.push(marker);
            });
        });
}

let moveEndTimer = null;
map.on('moveend', function() {
    clearTimeout(moveEndTimer);
    moveEndTimer = setTimeout(function() {

        if (fuelActive) { fuelMarkers.forEach(m => map.removeLayer(m)); fuelMarkers.length = 0; fetchOSMLayer('amenity=fuel', fuelMarkers, '#e63946', 'Fuel Station'); }
        if (waterActive) { waterMarkers.forEach(m => map.removeLayer(m)); waterMarkers.length = 0; fetchOSMLayer('amenity=drinking_water', waterMarkers, '#1a6dd8', 'Drinking Water'); }
    }, 500);
});

function fetchWACamps() {
    if (!waCampsActive) return;
    const WA_BBOX = '-35.5,112.0,-13.5,129.0';
    fetch('https://overpass-api.de/api/interpreter?data=[out:json];node[tourism=camp_site](' + WA_BBOX + ');out;')
        .then(r => r.json())
        .then(function(data) {
            data.elements.forEach(function(e) {
                if (!e.lat || !e.lon) return;
                const name = e.tags.name || 'Campsite';
                const icon = L.divIcon({
                    html: '<div style="width:12px;height:12px;background:#d67214;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>',
                    className: '',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });
                const marker = L.marker([e.lat, e.lon], { icon });
                marker._campName = name;
                buildCampPopup(marker, e, name);
                waCampCluster.addLayer(marker);
                waCampMarkers.push(marker);
            });
        })
        .catch(function(err) { console.log('Camps error:', err); });
}
