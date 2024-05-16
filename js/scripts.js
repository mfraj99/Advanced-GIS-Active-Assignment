// mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoibWljaGFlbGZyYWptYW4xIiwiYSI6ImNsdXZzaTNiNjA2ejQycXBiaGU5dDNxM2UifQ.xQkObwg-QzODO9fKFMGUTw"

// generate map and have it centered to display Staten Island
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.153265,40.577327],
    zoom: 11
});

// Based on Chris Whong's pizza map example
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

    //import geojson for chloropleth of staten island demogrphics by census block
    map.addSource('census-blocks', {
        type: 'geojson',
        data: sicensusblocks
    });

    //generate layer for chloropleth of staten island demogrphics by census block
    map.addLayer({
        'id': 'population-density',
        'type': 'fill',
        'source': 'census-blocks',
        'layout' : {},
        // the fill of each block is continously scaled for density from the min to max value observed
        'paint': {
            'fill-color': 'red',
            'fill-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'DENSITY'],
                0,0,
                122471,1
            ]
        }
    });

    // used chatgpt and discussed with Luke Buttenwieser for how feature clicking can be achieved

    // interactivity for population density map, clicking on a census block shows population and density numbers
    // Add click event to show popup containing 
    map.on('click', 'population-density', (e) => {
        // get feature that is clicked on
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['population-density']
        });
    
        // check that a feature was clicked, if no feature than exit
        if (!features.length) {
            return;
        }
    
        // extract geojson properties
        var feature = features[0];
        var properties = feature.properties;

        // build popup message
        var popupContent = '<h3>' + properties.NAME20 + '</h3>' +
                           '<p>Population: ' + properties.POP20 + '</p>' +
                           '<p>Density: ' + properties.DENSITY + ' pop/sqr m</p>';

        // display popup messages
        new mapboxgl.Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);

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

    // Setting cursor depending on layer
    // Change cursor to pointer when hovering over a polygon in density layer
    map.on('mouseenter', 'population-density', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change cursor back to default when entering the haze layer
    map.on('mouseenter', 'island-haze', () => {
        map.getCanvas().style.cursor = '';
    });

});

// loop over the station array to make a marker for each record
stations.forEach(function (stationRecord) {

    // create a popup to attach to the marker
    const popup = new mapboxgl.Popup({
        // removed the "x" from the popups as it crowded the small space
        // https://stackoverflow.com/questions/66254088/how-to-remove-the-x-close-symbol-from-mapbox-pop-up
        closeButton: false, 
        offset: -5,
        anchor: 'top'
    // display the text in the popup
    }).setText(
        `${stationRecord.StopName}`
    );

    // placing an image depending on if the station is ADA compliant
    let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/NYCS-bull-trans-SIR-Std.svg/1024px-NYCS-bull-trans-SIR-Std.svg.png';
    // Define image URL based on attributes
    // switch (stationRecord.ADA) {
    // // is ADA accessible
    // case 1:
    //     imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Wheelchair_accessible_icon.svg/768px-Wheelchair_accessible_icon.svg.png';
    //     break;

    // default:
    //     imageUrl = 'https://cdn-icons-png.flaticon.com/512/565/565410.png'; // Default image
    // }

    // creating a div to contain the image
    let markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.backgroundImage = `url(${imageUrl})`;
    markerElement.style.width = '25px';
    markerElement.style.height = '25px';

    // create a marker, set the coordinates, add the popup, add it to the map
    new mapboxgl.Marker(markerElement)
        .setLngLat([stationRecord.GTFSLongitude, stationRecord.GTFSLatitude])
        .setPopup(popup)
        .addTo(map);
})
