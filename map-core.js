
// Map Layers

const map = L.map('map', { zoomControl: false }).setView([-33.57, 115.82], 10);
L.control.zoom({ position: 'topright' }).addTo(map);

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const stadiaOutdoors = L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}@2x.png?api_key=86ff4306-49d2-4ba6-a5b2-eaf6d97ba472', {
    attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors'
});

const stadiaDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png?api_key=86ff4306-49d2-4ba6-a5b2-eaf6d97ba472', {
    attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors'
});

const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19
});

stadiaOutdoors.addTo(map);
let currentLayer = stadiaOutdoors;

//Pin Types Personalised 

const pinTypes = {
    camp:    { icon: '', color: '#2d8a4e', label: 'Campsite' },
    caravan: { icon: '', color: '#df1d1d', label: 'Caravan Site' },
    secret:  { icon: '', color: '#520b7e', label: 'Secret Spot' },
    car:     { icon: '', color: '#db21c5', label: 'Good Track' },
    point:   { icon: '', color: '#791a09', label: 'Point of Interest' },
    cafe:    { icon: '', color: '#e4a000', label: 'Cafe / Food' },
    water:   { icon: '', color: '#1a6dd8', label: 'Water Source' },
    dump:    { icon: '', color: '#1f15a8', label: 'Dump Site' },
    warn:    { icon: '', color: '#cc3333', label: 'Warning' },
};

// Firebase setup

const firebaseConfig = {
    apiKey: "AIzaSyBlFRgfgLIwubKc60ZAjAK8DP4oYyTd9No",
    authDomain: "boodja-42835.firebaseapp.com",
    databaseURL: "https://boodja-42835-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "boodja-42835",
    storageBucket: "boodja-42835.firebasestorage.app",
    messagingSenderId: "913649223248",
    appId: "1:913649223248:web:882cd7fd4ca09e0f2a7355"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const pinsRef = db.ref('pins');

let savedPins = [];
let markers = [];
let pendingLat, pendingLng;

pinsRef.on('value', function(snapshot) {
    const data = snapshot.val();
    savedPins = data ? Object.values(data) : [];
    savedPins.forEach(function(pin) {
    if (!pin.id) pin.id = 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
});
    renderAllPins();
});

function saveToStorage() {
    if (savedPins.length === 0) return;
    const pinsObj = {};
    savedPins.forEach(function(pin) {
        if (!pin.id) pin.id = 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        pinsObj[pin.id] = pin;
    });
    pinsRef.set(pinsObj);
}
// Custom icons comma on all except last default emojis which are image based
function makeIcon(type) {
    const customIcons = {
        fish: 'icons/fish.png',
        camp: 'icons/camp.png',
	    caravan: 'icons/caravan.png',
	    secret: 'icons/secret.png',
 	    car: 'icons/car.png',
	    point: 'icons/point.png',
        cafe: 'icons/cafe.png',
	    water: 'icons/water.png',
	    dump: 'icons/dump.png',
	    warn: 'icons/warn.png'
    };
    if (customIcons[type]) {
        return L.divIcon({
            html: '<img src="' + customIcons[type] + '" style="width:45px;height:45px;object-fit:contain;">',
            className: 'emoji-icon',
            iconSize: [45, 45],
            iconAnchor: [15, 30]
        });
    }
    const pinType = pinTypes[type] || pinTypes['point'];
    return L.divIcon({
        html: '<span style="font-size:24px;filter:drop-shadow(1px 1px 1px rgba(0,0,0,0.3));">' + pinType.icon + '</span>',
        className: 'emoji-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

function makeNavButton(lat, lng) {
    return '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '" target="_blank" style="display:inline-block;margin-top:10px;padding:8px 14px;border-radius:10px;background:#1a6dd8;color:white;font-size:13px;font-weight:600;text-decoration:none;">🧭 Navigate</a>';
}

function makePopup(p, index) {
    const t = pinTypes[p.type] || pinTypes['point'];
    return '<b>' + t.icon + ' ' + p.name + '</b><br>' +
        '<small>' + t.label + '</small><br><br>' +
        p.note + '<br><br>' +
        '⭐'.repeat(p.stars) + '<br>' +
        '<small>' + p.lat + ', ' + p.lng + '</small><br><br>' +
        (p.url ? '<a href="' + p.url + '" target="_blank">🔗 More info</a><br><br>' : '') +
        (p.photo ? '<img src="' + p.photo + '" style="width:100%;border-radius:8px;margin-bottom:8px;"><br>' : '') +
        '<button onclick="speakPin(' + index + ')" style="padding:8px 14px;border-radius:10px;border:none;background:#333;color:#f2f2f2;font-size:13px;font-weight:600;cursor:pointer;margin-right:4px;">Read</button>' +
        '<button onclick="editPin(' + index + ')" style="padding:8px 14px;border-radius:10px;border:none;background:rgba(214,114,20,0.85);color:white;font-size:13px;font-weight:600;cursor:pointer;margin-right:4px;">Edit</button>' +
        '<button onclick="deletePin(' + index + ')" style="padding:8px 14px;border-radius:10px;border:none;background:#f0f0f0;color:#444;font-size:13px;font-weight:600;cursor:pointer;">Remove</button>' +
        '<br>' + makeNavButton(p.lat, p.lng);
}

function speakPin(index) {
    const p = savedPins[index];
    const t = pinTypes[p.type];
    const text = t.label + '. ' + p.name + '. ' + p.note + '. Rated ' + p.stars + ' stars.';
    speak(text);
}

function renderAllPins() {
    markers.forEach(function(m) { map.removeLayer(m); });
    markers = [];
    savedPins.forEach(function(p, index) {
        const marker = L.marker([p.lat, p.lng], { icon: makeIcon(p.type) }).addTo(map);
        marker.bindPopup(makePopup(p, index));
        markers.push(marker);
    });
}

let speechUnlocked = false;



let longPressTimer = null;
let longPressFired = false;
let touchStartX = 0;
let touchStartY = 0;

map.getContainer().style.webkitUserSelect = 'none';
map.getContainer().style.userSelect = 'none';

map.getContainer().addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        clearTimeout(longPressTimer);
        return;
    }
    longPressFired = false;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    longPressTimer = setTimeout(function() {
        longPressFired = true;
        const rect = map.getContainer().getBoundingClientRect();
        const latlng = map.containerPointToLatLng(L.point(touchStartX - rect.left, touchStartY - rect.top));
        if (!speechUnlocked) {
            const unlock = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(unlock);
            speechUnlocked = true;
        }
        pendingLat = latlng.lat.toFixed(5);
        pendingLng = latlng.lng.toFixed(5);
        document.getElementById('edit-index').value = '-1';
        document.getElementById('pin-form').style.display = 'block';
        document.getElementById('pin-form').querySelector('h3').textContent = 'Add Pin';
        document.getElementById('pin-name').focus();
    }, 600);
}, { passive: false });

map.getContainer().addEventListener('touchend', function() {
    clearTimeout(longPressTimer);
});

map.getContainer().addEventListener('touchmove', function(e) {
    if (longPressFired) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clearTimeout(longPressTimer);
        longPressFired = false;
    }
});

map.getContainer().addEventListener('touchcancel', function() {
    clearTimeout(longPressTimer);
    longPressFired = false;
});

map.getContainer().addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

map.on('mousedown', function(e) {
    if (e.originalEvent.touches && e.originalEvent.touches.length > 1) return;
    if (e.originalEvent.button !== 0) return;
    longPressFired = false;
    const startLatLng = e.latlng;
    longPressTimer = setTimeout(function() {
        longPressFired = true;
        map.dragging.disable();
        if (!speechUnlocked) {
            const unlock = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(unlock);
            speechUnlocked = true;
        }
        pendingLat = startLatLng.lat.toFixed(5);
        pendingLng = startLatLng.lng.toFixed(5);
        document.getElementById('edit-index').value = '-1';
        document.getElementById('pin-form').style.display = 'block';
        document.getElementById('pin-form').querySelector('h3').textContent = 'Add Pin';
        document.getElementById('pin-name').focus();
    }, 600);
});

map.on('mouseup', function() {
    clearTimeout(longPressTimer);
    map.dragging.enable();
});

map.on('mousemove', function() {
    clearTimeout(longPressTimer);
});

function editPin(index) {
    const p = savedPins[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('pin-type').value = p.type;
    document.getElementById('pin-name').value = p.name;
    document.getElementById('pin-note').value = p.note;
    document.getElementById('pin-stars').value = p.stars;
    document.getElementById('pin-url').value = p.url || '';
    document.getElementById('pin-address').value = p.address || '';
    document.getElementById('pin-form').style.display = 'block';
    document.getElementById('pin-form').querySelector('h3').textContent = 'Edit Pin';
    if (p.photo) {
    document.getElementById('preview-img').src = p.photo;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('pin-photo').dataset.photo = p.photo;}
}

function deletePin(index) {
    savedPins.splice(index, 1);
    saveToStorage();
    renderAllPins();
}

function savePin() {
    const index = parseInt(document.getElementById('edit-index').value);
    const pin = {
        lat: index === -1 ? pendingLat : savedPins[index].lat,
        lng: index === -1 ? pendingLng : savedPins[index].lng,
        type: document.getElementById('pin-type').value,
        name: document.getElementById('pin-name').value || 'My pin',
        note: document.getElementById('pin-note').value || '',
        stars: document.getElementById('pin-stars').value || '',
        address: document.getElementById('pin-address').value || '',
        phone: document.getElementById('pin-phone').value || '',
        url: document.getElementById('pin-url').value || '',
        photo: document.getElementById('pin-photo').dataset.photo || '',
    };
    if (index === -1) {
        savedPins.push(pin);
    } else {
        savedPins[index] = pin;
    }
    saveToStorage();
    renderAllPins();
    cancelPin();
}

function cancelPin() {
    document.getElementById('pin-form').style.display = 'none';
    document.getElementById('pin-name').value = '';
    document.getElementById('pin-note').value = '';
    document.getElementById('pin-stars').value = '3';
    document.getElementById('pin-address').value = '';
    document.getElementById('pin-address').value = '';
    document.getElementById('pin-url').value = '';
    document.getElementById('edit-index').value = '-1';
    document.getElementById('pin-photo').value = '';
    document.getElementById('pin-photo').dataset.photo = '';
    document.getElementById('photo-preview').style.display = 'none';
}

let userMarker = null;

function startGPS() {
    if (!navigator.geolocation) return;
       navigator.geolocation.watchPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateGPSIndicator(position.coords.accuracy);
        if (userMarker) {
            userMarker.setLatLng([lat, lng]);
            checkProximity(lat, lng);
        } else {
            userMarker = L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: '#1a6dd8',
                color: 'white',
                weight: 3,
                opacity: 1,
                fillOpacity: 1
            }).addTo(map);
              map.setView([lat, lng], 12);
            getWeather(lat, lng);
            checkProximity(lat, lng);
            checkProximity(lat, lng);
        }
    }, function(error) {
        console.log('GPS error:', error);
    }, { enableHighAccuracy: true, maximumAge: 10000 });
}

startGPS();
renderAllPins();
let targetVoice = null;

// Function to load and cache the specific voice
function loadVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    targetVoice = voices.find(v => v.name === 'Google UK English Female') || voices[0];
}

// Trigger loadVoice when the browser finishes loading its voice list
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoice;
    loadVoice(); // Try loading immediately in case they are already cached
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    if (proximityMuted) return;
    if (!speechUnlocked) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    if (targetVoice) utterance.voice = targetVoice;
    window.speechSynthesis.speak(utterance);
}
let spokenPins = new Set();
let spokenCamps = new Set();
let proximityRadius = 2;
let proximityMuted = false;

function toggleProximityMute() {
    proximityMuted = !proximityMuted;
    const icon = document.getElementById('proximity-mute-icon');
    if (icon) icon.src = proximityMuted ? 'icons/soundoff.png' : 'icons/soundon.png';
    if ('speechSynthesis' in window) {
        const unlock = new SpeechSynthesisUtterance('');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(unlock);
        speechUnlocked = true;
    }
}

function checkProximity(userLat, userLng) {
    if (proximityMuted) return;

    // Check Firebase pins
    savedPins.forEach(function(p, index) {
        if (spokenPins.has(index)) return;
        const dist = getDistance(userLat, userLng, parseFloat(p.lat), parseFloat(p.lng));
        if (dist <= proximityRadius) {
            spokenPins.add(index);
            const t = pinTypes[p.type] || pinTypes['point'];
            const km = dist.toFixed(1);
            const text = p.name + '. ' + km + ' kilometres away.';
            speak(text);
            setTimeout(function() { spokenPins.delete(index); }, 120000);
        }
    });

    // Check camps layer
    if (waCampsActive) {
        waCampMarkers.forEach(function(marker, index) {
            if (spokenCamps.has(index)) return;
            const ll = marker.getLatLng();
            const dist = getDistance(userLat, userLng, ll.lat, ll.lng);
            if (dist <= proximityRadius) {
                spokenCamps.add(index);
                const name = marker._campName || 'Campsite';
                const km = dist.toFixed(1);
                speak('Campsite ahead. ' + name + '. ' + km + ' kilometres.');
                setTimeout(function() { spokenCamps.delete(index); }, 120000);
            }
        });
    }
}

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function getNoogarSeason() {
    const month = new Date().getMonth() + 1;
    if (month === 12 || month <= 1) return { name: 'Birak', desc: 'First summer. Hot and dry.', color: '#e4a000' };
    if (month <= 3) return { name: 'Bunuru', desc: 'Second summer. Hottest time.', color: '#cc3333' };
    if (month <= 5) return { name: 'Djeran', desc: 'Autumn. Cooler, calm winds.', color: '#7b3fa0' };
    if (month <= 7) return { name: 'Makuru', desc: 'Fertility season. Cold and wet.', color: '#1a6dd8' };
    if (month <= 9) return { name: 'Djilba', desc: 'First spring. Transitioning.', color: '#2d8a4e' };
    return { name: 'Kambarang', desc: 'Second spring. Wildflowers bloom.', color: '#e4a000' };
}

// top banner seasons moon icon included two sections
const season = getNoogarSeason();
const bar = document.getElementById('season-bar');
document.getElementById('season-text').innerHTML = '<img src="icons/moon.png" style="height:45px;vertical-align:middle;margin-right:4px;">' + season.name;

function updateGPSIndicator(accuracy) {
    let color, label;
    if (accuracy <= 20) { color = '#4ade80'; label = 'GPS'; }
    else if (accuracy <= 100) { color = '#fb923c'; label = 'GPS'; }
    else if (accuracy <= 500) { color = '#f87171'; label = 'GPS'; }
    else { color = '#6b7280'; label = 'GPS'; }
    const indicator = document.getElementById('gps-indicator');
    if (indicator) indicator.innerHTML = 
        '<span style="width:7px;height:7px;border-radius:50%;background:' + color + ';display:inline-block;margin-right:3px;"></span>' +
        '<span style="font-size:11px;color:' + color + ';">' + label + '</span>';
}

function getWeather(lat, lng) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng + '&current=temperature_2m,weathercode,windspeed_10m')
        .then(response => response.json())
        .then(data => {
            const temp = data.current.temperature_2m;
            const wind = data.current.windspeed_10m;
            const season = getNoogarSeason();
            const bar = document.getElementById('season-bar');
            document.getElementById('season-text').innerHTML = '<img src="icons/moon.png" style="height:50px;vertical-align:middle;margin-right:4px;">' + season.name + ' · ' + temp + '°C · ' + wind + 'km/h';
        });
}



document.getElementById('pin-photo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
            } else {
                if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const resized = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById('preview-img').src = resized;
            document.getElementById('photo-preview').style.display = 'block';
            document.getElementById('pin-photo').dataset.photo = resized;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

