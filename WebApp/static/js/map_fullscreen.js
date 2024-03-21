const opacity_esi_full = $('#opacity_esi_full');
const opacity_chirps_full = $('#opacity_chirps_full');
const chirps_full_opacity = $('#chirps_full_opacity');
const esi_full_opacity = $('#esi_full_opacity');
// Helpers to show/hide the popovers when the info button is clicked
let map;

$(function () {
// Initialize with map control with basemap and time slider
    map = L.map('map', {
        zoomControl: true, fullscreenControl: true, center: [27.41016657183734, 90.44523404431789], zoom: 8
    });
    map.zoomControl.setPosition('topright');
    terrainLayer.addTo(map);

// Add the Search Control to the map
    const search = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider(), showMarker: false, // optional: true|false  - default true
        showPopup: false, position: 'topright', autoClose: true,
    });
    map.addControl(search);
    $(".leaflet-bar-timecontrol").css("margin-left", "50px");
    $('.leaflet-bar-timecontrol').css('display', 'inline');
});

// Remove all basemap layers from the map
removeLayers = function () {
    satellite.remove();
    osm.remove();
    OpenTopoMap.remove();
    terrainLayer.remove();
    deLormeLayer.remove();
    gSatLayer.remove();
};
// Add selected basemap layer to the map
add_basemap = function (map_name) {
    removeLayers();
    switch (map_name) {
        case "osm":
            osm.addTo(map);
            break;
        case "delorme":
            deLormeLayer.addTo(map);
            break;
        case "satellite":
            satellite.addTo(map);
            break;
        case "terrain":
            terrainLayer.addTo(map);
            break;
        case "topo":
            OpenTopoMap.addTo(map);
            break;
        case "gsatellite":
            gSatLayer.addTo(map);
            break;
        default:
            osm.addTo(map);

    }
};

// Add legend to the map for CHIRPS
function add_legend_fixed_size(dataset, wms, variable, colorscalerange, palette, element) {
    if (variable === "") {
        $.ajax({
            url: wms + "/legend?f=json", type: "GET", async: true, crossDomain: true
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.warn(jqXHR + textStatus + errorThrown);
        }).done(function (data, _textStatus, _jqXHR) {
            if (data.errMsg) {
                console.info(data.errMsg);
            } else {
                add_other_legend(data, dataset, wms);
            }
        });
    } else {
        const legend = L.control({});
        const link = wms + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + variable + "&colorscalerange=" + colorscalerange + "&PALETTE=" + palette + "&transparent=TRUE";
        legend.onAdd = function () {
            const src = link;
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML += '<img src="' + src + '" alt="legend">';
            div.id = "legend_" + dataset;
            div.className = "thredds-legend";
            return div;
        };
        legend.addTo(map);
        set_parent(legend, element);
    }
}

// Remove legend from the map
function remove_legend_fixed_size(val) {
    document.getElementById("legend_" + val).remove();
}

// Add legend to the map for ESI
function add_other_legend(response, dataset, base_service_url) {
    let htmlString = "<table>";
    for (var iCnt = 0; iCnt < response.layers.length; iCnt++) {
        lyr = response.layers[iCnt];
        if (lyr.layerId === 3) {
            if (lyr.legend.length > 1) {
                htmlString += "<tr><td colspan='2' style='font-weight:bold;'>" + dataset + "</td></tr>";
                for (let jCnt = 0; jCnt < lyr.legend.length; jCnt++) {
                    const src = base_service_url + "/" + lyr.layerId + "/images/" + lyr.legend[jCnt].url;
                    const strlbl = lyr.legend[jCnt].label.replace("<Null>", "Null");
                    htmlString += "<tr><td><img src=\"" + src + "\" alt ='' /></td><td>" + strlbl + "</td></tr>";
                }
            } else {
                htmlString += "<tr><td colspan='2' class='tdLayerHeader' style='font-weight:bold;'>" + dataset + "</td></tr>";
                const img_src = base_service_url + "/" + lyr.layerId + "/images/" + lyr.legend[0].url;
                htmlString += "<tr><td colspan='2' ><img src=\"" + img_src + "\" alt ='' /></td></tr>";
            }
        }
    }
    htmlString += "</table>";
    const div = document.createElement('div');
    div.innerHTML += htmlString;
    div.id = "legend_" + dataset;
    div.className = "arcgis-legend";
    document.getElementById("legend_full_" + dataset).appendChild(div);

}

// Expand the sidebar when the user clicks the three line button on the top left
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    $("#nav_opener").hide();
    $(".leaflet-bar-timecontrol").css("margin-left", "270px");
    $('.leaflet-bar-timecontrol').css('display', 'flex');
}

// Collapse the sidebar when the user clicks close button on top of the sidebar
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    $("#nav_opener").show();
    $(".leaflet-bar-timecontrol").css("margin-left", "50px");
    $('.leaflet-bar-timecontrol').css('display', 'inline');
}