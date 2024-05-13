// mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoibWljaGFlbGZyYWptYW4xIiwiYSI6ImNsdXZzaTNiNjA2ejQycXBiaGU5dDNxM2UifQ.xQkObwg-QzODO9fKFMGUTw"

// generate map and have it centered to display Staten Island
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.153265,40.577327],
    zoom: 11
});

// Based on Chris Wong's pizza map example
map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {

    //import geojson of the haze mask around island
    map.addSource('island-outline', {
        type: 'geojson',
        data: invertedstatenoutline
    });

    //generate layer for the haze mask around island
    map.addLayer({
        'id': 'island-haze',
        'type': 'fill',
        'source': 'island-outline',
        'layout' : {},
        'paint': {
            'fill-opacity': 0.5,
            'fill-color': '#4d4949',
        }
    });

    //import geojson of the railline
    map.addSource('railline', {
        type: 'geojson',
        data: sirroute
    });

    //generate layer for the railline
    map.addLayer({
        'id': 'railway-route',
        'type': 'line',
        'source': 'railline',
        'layout' : {},
        'paint': {
            'line-width': 8,
            'line-color': 'blue',
        }
    });

});

// loop over the station array to make a marker for each record
stations.forEach(function (stationRecord) {

    // create a popup to attach to the marker
    const popup = new mapboxgl.Popup({
        // removed the "x" from the popups as it crowded the small space
        // https://stackoverflow.com/questions/66254088/how-to-remove-the-x-close-symbol-from-mapbox-pop-up
        closeButton: false, 
        offset: 24,
        anchor: 'bottom'
    // display the text in the popup
    }).setText(
        `${stationRecord.StopName}`
    );

    // create a marker, set the coordinates, add the popup, add it to the map
    new mapboxgl.Marker({
        scale: 0.65,
        color: "#4287f5"
    })
        .setLngLat([stationRecord.GTFSLongitude, stationRecord.GTFSLatitude])
        .setPopup(popup)
        .addTo(map);
})
