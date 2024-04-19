// mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoibWljaGFlbGZyYWptYW4xIiwiYSI6ImNsdXZzaTNiNjA2ejQycXBiaGU5dDNxM2UifQ.xQkObwg-QzODO9fKFMGUTw"

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-74.153265,40.577327],
    zoom: 11
});

map.addControl(new mapboxgl.NavigationControl());

// loop over the station array to make a marker for each record
stations.forEach(function (stationRecord) {

    // create a popup to attach to the marker
    const popup = new mapboxgl.Popup({
        offset: 24,
        anchor: 'bottom'
    }).setText(
        `${stationRecord.name}`
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