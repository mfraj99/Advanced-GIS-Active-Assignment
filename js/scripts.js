// mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoibWljaGFlbGZyYWptYW4xIiwiYSI6ImNsdXZzaTNiNjA2ejQycXBiaGU5dDNxM2UifQ.xQkObwg-QzODO9fKFMGUTw"

// generate map and have it centered to display Staten Island
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.153265, 40.577327],
    zoom: 11
});

// hazy outline layers
var backdropHazeLayers = [

    // initial haze around the whole island
    {
        'id': 'island-haze',
        'type': 'fill',
        'source': 'island-outline',
        'layout': {},
        'paint': {
            'fill-opacity': 0.5,
            'fill-color': '#4d4949',
        },

    },

    // exapnded outline for showing the exteded line off island
    {
        'id': 'expanded-haze',
        'type': 'fill',
        'source': 'expanded-outline',
        'layout': {},
        'paint': {
            'fill-opacity': 0.5,
            'fill-color': '#4d4949',
        },

    }
]

// all layers for polygons and lines
var contentLayer = [

    // layer for census block population density chloropleth
    {
        'id': 'population-density',
        'type': 'fill',
        'source': 'census-blocks',
        'layout': {},
        // the fill of each block is continously scaled for density from the min to max value observed
        'paint': {
            'fill-color': 'red',
            'fill-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'DENSITY'],
                0, 0,
                122471, 1
            ]
        }
    },

    // layer for the brt route
    {
        'id': 'brt-route',
        'type': 'line',
        'source': 'brtline',
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'orange',
        }
    },

    // layer for the proposed route
    {
        'id': 'proposed-route',
        'type': 'line',
        'source': 'proposedline',
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'fuchsia',
        }
    }

]

// Based on Chris Whong's pizza map example
map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {

    //import geojson of the haze mask around island
    map.addSource('island-outline', {
        type: 'geojson',
        data: invertedstatenoutline
    });

    //import geojson of the exapnded haze mask around island
    map.addSource('expanded-outline', {
        type: 'geojson',
        data: expandedhaze
    });

    // load the initial haze outline on startup
    map.addLayer(backdropHazeLayers[0]);

    //import geojson for chloropleth of staten island demogrphics by census block
    map.addSource('census-blocks', {
        type: 'geojson',
        data: sicensusblocks
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
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'blue',
        }
    });

    //import geojson of the brt route
    map.addSource('brtline', {
        type: 'geojson',
        data: brt
    });

    //import geojson of the proposed route
    map.addSource('proposedline', {
        type: 'geojson',
        data: proproute
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

    // using the SIR logo in place of the default mapbox marker
    let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/NYCS-bull-trans-SIR-Std.svg/1024px-NYCS-bull-trans-SIR-Std.svg.png';

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

// pressing the button to advance the story
var currentLayerIndex = 0;

function toggleLayer() {
    // incrementing the layer counting, there are 3 layers to the story total
    if (currentLayerIndex < 4) {
        currentLayerIndex += 1;
    }

    // layer one draws the populaton density map alongside the sir routes and stations
    if (currentLayerIndex === 1) {
        map.addLayer(contentLayer[0]);
    }
    // layer two shows the proposed staten island brt
    else if (currentLayerIndex === 2) {
        map.addLayer(contentLayer[1])
    }
    // layer three shows my proposed outerbridge spur
    else if (currentLayerIndex === 3) {
        map.addLayer(contentLayer[2])
        map.addLayer(backdropHazeLayers[1])
        map.removeLayer(backdropHazeLayers[0].id)

        // disable the continue button once story reaches its conclusion
        var mainButton = document.getElementById('main-toggle');
        mainButton.disabled = true;
        mainButton.style.opacity = 0.5;

        // enable the reset button
        var resButton = document.getElementById('reset');
        resButton.disabled = false;
        resButton.style.opacity = 1;
    }

}

// set the map back to the starting state
function resetMap() {
    currentLayerIndex = 0;

    // reset data layers
    map.removeLayer(contentLayer[0].id);
    map.removeLayer(contentLayer[1].id);
    map.removeLayer(contentLayer[2].id);

    //reset haze layers
    map.removeLayer(backdropHazeLayers[1].id)
    map.addLayer(backdropHazeLayers[0])

    // enable the continue button once story reaches its conclusion
    var mainButton = document.getElementById('main-toggle');
    mainButton.disabled = false;
    mainButton.style.opacity = 1;

    // disable the reset button
    var resButton = document.getElementById('reset');
    resButton.disabled = true;
    resButton.style.opacity = 0.5;
}
