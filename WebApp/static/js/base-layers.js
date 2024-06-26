/*
 *    Return common layers used in different examples
 */
function getCommonBaseLayers(map) {
    var osmLayer = L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
        thumb: "images/osm.png",
        displayName: "OSM",
    });
    var bathymetryLayer = L.tileLayer.wms(
        "https://ows.emodnet-bathymetry.eu/wms",
        {
            layers: "emodnet:mean_atlas_land",
            format: "image/png",
            transparent: true,
            attribution: "EMODnet Bathymetry",
            opacity: 0.8,
        }
    );
    var coastlinesLayer = L.tileLayer.wms(
        "https://ows.emodnet-bathymetry.eu/wms",
        {
            layers: "coastlines",
            format: "image/png",
            transparent: true,
            attribution: "EMODnet Bathymetry",
            opacity: 0.8,
        }
    );
    var bathymetryGroupLayer = L.layerGroup([bathymetryLayer, coastlinesLayer]);
    bathymetryGroupLayer.options.thumb = "images/bath.png";
    bathymetryGroupLayer.options.displayName = "Bathymetry";
    //osmLayer.addTo(map);

    var topoLayer = L.tileLayer.wms(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
                'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
            opacity: 1,
            thumb: "images/topo.png",
            displayName: "Topo",
        }
    );

    var NatGeo_World_Map = L.tileLayer.wms(
        "https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
                'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
            opacity: 1,
            thumb: "images/natgeo.png",
            displayName: "NatGeo",
        }
    );

    var labelLayer = L.tileLayer.wms(
        "https://server.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
                'rest/services/Reference/World_Boundaries_and_Places/MapServer">ArcGIS</a>',
            opacity: 1,
        }
    );

    var satLayer = L.tileLayer.wms(
        "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
                'rest/services/Reference/World_Imagery/MapServer">ArcGIS</a>',
            opacity: 1,
        }
    );

    var satGroupLayer = L.layerGroup([satLayer, labelLayer]);
    satGroupLayer.options.thumb = "images/satellite.png";
    satGroupLayer.options.displayName = "Satellite";


    var gSatLayer = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © Map data ©2019 Google',
            opacity: 1,
            thumb: "images/gsatellite.png",
            displayName: "Google Satellite",
            subdomains:['mt0','mt1','mt2','mt3']
        }
    );
    gSatLayer.addTo(map);

    var terrainLayer = L.tileLayer(
        "https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token={accessToken}",
        {
            attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            minZoom: 0,
            maxZoom: 22,
            subdomains: 'abcd',
            accessToken: 'rU9sOZqw2vhWdd1iYYIFqXxstyXPNKIp9UKC1s8NQkl9epmf0YpFF8a2HX1sNMBM',
            opacity: 1,
            thumb: "images/terrain.png",
            displayName: "Terrain",
        }
    );

    //Dark Gray layer
var darkGrayLayer = L.tileLayer.wms('https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    {
        format: "image/jpeg",
        transparent: true,
        attribution:
            'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/Reference/Specialty/DeLorme_World_Base_Map/MapServer">ArcGIS</a>',
        opacity: 1,
        thumb: "images/darkgray.png",
        displayName: "Dark Gray",
    }
);

    var deLormeLayer = L.tileLayer.wms(
        "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/{z}/{y}/{x}",
        {
            format: "image/png",
            transparent: true,
            attribution:
                'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
                'rest/services/Reference/Specialty/DeLorme_World_Base_Map/MapServer">ArcGIS</a>',
            opacity: 1,
            thumb: "images/delorme.png",
            displayName: "DeLorme",
        }
    );

    var vectorTileUrl = 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';


// Create a new VectorGrid layer using the vector tile URL
    var vectorTileLayer = L.esri.Vector.vectorTileLayer(vectorTileUrl, {
        rendererFactory: L.canvas.tile, vectorTileLayerStyles: {
            // Define styles for different layers (optional)
        }, opacity: 1, thumb: "images/world_base.png", displayName: "World Base", zIndex: 0
    });

    return {
        OSM: osmLayer,
        Gsatellite: gSatLayer,
        Satellite: satGroupLayer,
        Topo: topoLayer,
        Terrain: terrainLayer,
        NatGeo: NatGeo_World_Map,
        dark_gray: darkGrayLayer
    };
}
