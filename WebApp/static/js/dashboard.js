let baseLayers;
let the_input;
let yearSlider;
let selectedYear = 2016;
let all_active = true;
let global_dzongkhag_data;
let paddy_layer;
// Initialize a variable to track the status of compare_control
let compareControlAdded = false;
let compare_control;
let minYear = Infinity;
let maxYear = -Infinity;

/**
 * Updates the dimensions of the pie chart based on the current width of the
 * container element.
 *
 * This function retrieves the width of the container element and calculates
 * the height of the pie chart using a 16:9 aspect ratio. It then updates
 * the pie chart's size accordingly using Highcharts' `setSize` method.
 *
 * @returns {void} This function does not return a value.
 */
function updateChartDimensions() {
    // Get the width of the container element
    const containerWidth = document.getElementById('pie_chart').clientWidth;

    // Calculate height based on the container width and aspect ratio
    const aspectRatio = 16 / 9;
    const height = containerWidth / aspectRatio;

    // Update the chart dimensions
    piechart.setSize(containerWidth, height);
}

window.addEventListener('resize', function () {
    updateChartDimensions();
});

/**
 * Builds and renders a pie chart displaying the distribution of paddy area
 * in acres by Dzongkhag.
 *
 * This function calculates the height of the pie chart based on the container's
 * width and an aspect ratio of 16:9. It initializes a Highcharts pie chart,
 * setting the title and customizing the tooltip to show value and percentage
 * of each slice in the chart.
 *
 * @returns {void} This function does not return a value.
 */
function buildPie() {
    // Get the width of the container element
    const containerWidth = document.getElementById('pie_chart').clientWidth;

// Calculate height based on the container width and aspect ratio
    const aspectRatio = 16 / 9;
    const height = containerWidth / aspectRatio;

    piechart = Highcharts.chart('pie_chart', {
        chart: {
            type: 'pie', height: height, width: containerWidth
        }, title: {
            text: 'Paddy area distribution in acres by Dzongkhag'
        }, tooltip: {
            useHTML: true, headerFormat: '<table>', footerFormat: '</table>', pointFormatter: function () {
                let dataSum = 0, percentage;

                this.series.points.forEach(function (point) {
                    dataSum += point.y;
                });

                percentage = ((this.y / dataSum) * 100).toFixed(2);

                return `<tr><th colspan="2"><b>${this.name}</b></th></tr>
                                    <tr><th>Value:</th><td>${this.y} acres</td></tr>
                                    <tr><th>Percent:</th><td>${percentage}%</td></tr>`;
            }
        }, series: [{
            name: 'Percentage', colorByPoint: true, data: getPieChartData(get_formatted_data(full_data), selectedYear)
        }]
    });
}

/**
 * Builds and renders a Highcharts chart with specified configurations.
 *
 * This function initializes a chart with various customization options, including
 * chart type, title, subtitle, axis labels, series data, and color. It also supports
 * both single and multi-series data, and the tooltip displays values for each series.
 *
 * @param {string} id - The HTML element ID where the chart will be rendered.
 * @param {string} title - The main title of the chart.
 * @param {string} subtitle - The subtitle of the chart (currently unused in the implementation).
 * @param {string} type - The type of the chart (e.g., 'line', 'bar').
 * @param {number} pointStart - The starting point for the x-axis (used for datetime).
 * @param {string} yAxisText - The label for the y-axis.
 * @param {string} rangeDescription - A description of the data range (currently unused in the implementation).
 * @param {Array<Object>} seriesObject - An array of series data objects to be plotted on the chart.
 * @param {Array<string>} color - An array of colors to use for the series.
 * @param {boolean} isYearly - Indicates whether the x-axis data is on a yearly basis.
 *
 * @returns {void} This function does not return a value.
 */
function buildChart(id, title, subtitle, type, pointStart, yAxisText, rangeDescription, seriesObject, color, isYearly) {
    const isArrayData = seriesObject[0].data[0] instanceof Array;

    xaxisObj = {};
    if (isArrayData) {
        xaxisObj.type = 'datetime';
    }

    Highcharts.chart(id, {
        chart: {
            type: type, zoomType: 'xy'
        }, colors: color, title: {
            text: title, align: 'left'
        },

        yAxis: {
            title: {
                text: yAxisText
            }
        },

        xAxis: xaxisObj,

        legend: {
            layout: 'vertical', align: 'right', verticalAlign: 'middle'
        },

        plotOptions: {
            series: {
                states: {
                    inactive: {
                        opacity: 1
                    }
                }, inactiveOtherPoints: false, label: {
                    connectorAllowed: false
                }, tooltip: {
                    xDateFormat: isYearly ? '%Y' : '%m/%Y', pointFormatter: function () {

                        let tooltip = '<span style="color:' + this.series.color + '">\u25CF</span> ' + this.series.name + ': <b>' + this.y + ' ' + yAxisText + '</b><br/>';

                        // Loop through other series to add their values to the tooltip
                        this.series.chart.series.forEach(function (series) {
                            if (series !== this.series) {
                                let point = series.points[this.index];
                                tooltip += '<span style="color:' + series.color + '">\u25CF</span> ' + series.name + ': <b>' + point.y + ' ' + yAxisText + '</b><br/>';
                            }
                        }, this);

                        return tooltip;
                    }
                },
            }
        },

        series: seriesObject,

        responsive: {
            rules: [{
                condition: {
                    width: '100%',
                }, chartOptions: {
                    legend: {
                        layout: 'horizontal', align: 'center', verticalAlign: 'bottom'
                    }
                }
            }]
        }

    }, function () {
        this.series[0].hide();
        this.series[0].show();
    });

}

/**
 * Loads Gewogs for a given Dzongkhag and updates the options in the UI.
 *
 * This function first clears the current Gewog options and adds a filter box.
 * It then fetches Gewogs associated with the specified Dzongkhag from the server
 * and updates the UI with the received data. It also includes an option to
 * load Gewogs based on a provided identifier, overriding the Dzongkhag if necessary.
 *
 * @param {string} dzongkhag - The ID of the Dzongkhag for which to load Gewogs.
 * @param {string} [which] - An optional parameter that can override the dzongkhag ID.
 *
 * @returns {void} This function does not return a value.
 */
function loadGewogs(dzongkhag, which) {
    document.getElementById("gewogOptions").innerHTML = "";
    addFilterBox("gewogOptions", "gewogsFilter");

    addOptions([{
        name: "All Gewogs", gewog_id: "-999"
    }, ...(getGewogs(dzongkhag))], "gewogOptions", "gewogsFilter", 'gewog');
    if (which) {
        dzongkhag = which;
    }

    $.ajax({
        url: '/get-gewog-by-dzongkhag-id/' + dzongkhag, // Adjust the URL as per your Django API endpoint
        method: 'GET', success: function (data) {
            // Handle the response data here
            // Remove previously added features
            removePreviousFeatures();

            // Add features from JSON object to the layer
            addFeaturesToLayer(data);
        }, error: function (error) {
            // Handle errors here
            console.error('Error loading Gewogs:', error);
        }
    });
}

/**
 * Highlights a table row in the rice area table based on the provided name.
 *
 * This function removes any existing background color from all rows in the table and
 * highlights the row that matches the specified name by changing its background color
 * to dark cyan. The function searches for the row by checking the text content of the
 * first cell in each row.
 *
 * @param {string} name - The name used to identify the table row to be highlighted.
 * @returns {void} This function does not return a value.
 */
function highlightTableRow(name) {
    // Remove background color from all rows
    const tableRows = document.querySelectorAll('#rice_area tbody tr');
    tableRows.forEach(row => {
        row.style.backgroundColor = '';
    });

    // Find the row with the matching name and add background color
    tableRows.forEach(row => {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell && firstCell.textContent.trim() === name) {
            row.style.backgroundColor = 'darkcyan';
        }
    });
}

/**
 * Updates the range of the year slider to reflect the current minimum and maximum years.
 *
 * This function uses the noUiSlider library to adjust the slider's range based on the
 * global variables `minYear` and `maxYear`. It ensures that the slider only allows
 * selection within the updated range of years.
 *
 * @function
 * @returns {void} This function does not return a value.
 */
function updateSliderRange() {

    yearSlider.noUiSlider.updateOptions({
        range: {
            'min': minYear, 'max': maxYear
        }
    });
}

/**
 * Processes input data to extract average rice values for each Dzongkhag per year.
 *
 * The function iterates through the provided data object, excluding specific Dzongkhags
 * from processing. It constructs an array of objects containing the year and corresponding
 * average rice values while also tracking the minimum and maximum years present in the data.
 *
 * @param {Object} data - An object where keys are Dzongkhag names and values are
 *                        objects containing year-wise data, which includes 'average_rice'.
 *
 * @returns {Array<Object>} An array of formatted objects for each Dzongkhag, where each
 *                          object has the following structure:
 *                          {
 *                              name: {string} - The name of the Dzongkhag,
 *                              values: Array<{year: number, value: number|null}> - An array of objects
 *                              representing the year and its corresponding average rice value.
 *                          }
 *
 * @throws {Error} Logs an error to the console if there's an issue processing any year's data.
 */
function get_formatted_data(data) {
    const formatted_data = [];
    const excluded = ["temperature", "precipitation", "ndvi", "soil_moisture", "paddy_gain", "paddy_loss", "yield", "rice_area"];

    let holdmin = minYear;
    let holdmax = maxYear;
    minYear = Infinity;
    maxYear = -Infinity;

    for (const dzongkhag_name in data) {
        if (data.hasOwnProperty(dzongkhag_name) && !excluded.includes(dzongkhag_name)) {
            const dzongkhag_values = Object.keys(data[dzongkhag_name]).map(year => {
                try {
                    const average_rice_value = data[dzongkhag_name][year]['average_rice'];
                    const value = average_rice_value.length > 0 ? average_rice_value[0] : null;

                    // Update minYear and maxYear
                    const yearInt = parseInt(year);
                    minYear = Math.min(minYear, yearInt);
                    maxYear = Math.max(maxYear, yearInt);

                    return { year: yearInt, value };
                } catch (e) {
                    console.error(`Error processing year ${year} for Dzongkhag ${dzongkhag_name}:`, e);
                    return null; // Or handle it as needed
                }
            }).filter(item => item !== null); // Filter out null values due to errors

            formatted_data.push({ name: dzongkhag_name, values: dzongkhag_values });
        }
    }

    minYear = minYear === Infinity ? holdmin : minYear;
    maxYear = maxYear === -Infinity ? holdmax : maxYear;

    return formatted_data;
}

$(function () {
    // Initial call to set aspect ratio on page load
    updateAspectRatio();

    buildChart('paddy_gain', 'Paddy change since base year', 'Bumthang Dzongkhag 2016: 10.96 acres', 'column', 2017, 'acres', 'Range: 2016 to 2022', [{
        name: 'Base 2008, Transition to democracy', data: full_data["paddy_gain"].map(function (data) {
            return [data.year, data.val];
        })
    }, {
        name: 'Base 2020, COVID Outbreak', data: full_data.paddy_loss.map(function (data) {
            return [data.year, data.val];
        })
    }], ['rgb(90,254,44)', 'rgb(0,93,14)']);

    const seriesData = [{
        name: 'NDVI', data: full_data["ndvi"].map(function (data) {
            return [data.x, data.val];
        }), unit: 'NDVI'
    }, {
        name: 'Precipitation', data: full_data["precipitation"].map(function (data) {
            return [data.x, data.val];
        }), unit: 'mm'
    }, {
        name: 'Soil Moisture', data: full_data["soil_moisture"].map(function (data) {
            return [data.x, data.val];
        }), unit: 'mm'
    }, {
        name: 'Temperature Min', data: full_data["temperature"].map(function (data) {
            return [data.x, data.min];
        }), unit: '&deg;C'
    }, {
        name: 'Temperature Max', data: full_data["temperature"].map(function (data) {
            return [data.x, data.max];
        }), unit: '&deg;C'
    }, {
        name: 'Paddy Yield', data: full_data["yield"].map(function (data) {
            return [data.x, data.yield];
        }), unit: 'Kg/acres'
    }, {
        name: 'Predicted Paddy Yield', data: full_data["yield"].map(function (data) {
            return [data.x, data.predicted];
        }), unit: 'Kg/acres'
    }, {
        name: 'Paddy Area', data: full_data["rice_area"].map(function (data) {
            return [data.x, data.val];
        }), unit: 'acres'
    }];

    buildChart('rice_yield', 'Paddy Yield vs Predicted', '', 'line', 2017, 'Kg/acres', '', [{
        name: 'Yield', data: full_data["yield"].map(function (data) {
            return [data.x, data.yield];
        })
    }, {
        name: 'Predicted', data: full_data["yield"].map(function (data) {
            return [data.x, data.predicted];
        })
    }], ['rgb(90,254,44)', 'rgb(0,93,14)'], true);

    buildChart("rice_area", "Paddy Area", '', 'line', '', 'Acres', '', [seriesData.find(data => data.name === 'Paddy Area')], ['rgb(0,93,14)']);
    buildChart('ndvi-spark', 'NDVI', '', 'line', '', 'NDVI', '', [seriesData.find(data => data.name === 'NDVI')], ['rgb(0,93,14)']);
    buildChart('precipitation-spark', 'Monthly Precipitation', '', 'line', '', 'mm', '', [seriesData.find(data => data.name === 'Precipitation')], ['rgb(0,93,14)']);
    buildChart('soil-moisture-spark', 'Soil Moisture', '', 'line', '', 'mm', '', [seriesData.find(data => data.name === 'Soil Moisture')], ['rgb(0,93,14)']);
    buildChart('temperature-spark', 'Temperature', '', 'line', '', '&deg;C', '', [seriesData.find(data => data.name === 'Temperature Min'), seriesData.find(data => data.name === 'Temperature Max')], ['#8AAFFF', '#FF0200']);

    buildPie();

    map = L.map('map', {
        zoomControl: true, fullscreenControl: true, center: [27.41016657183734, 90.44523404431789], zoom: 8
    });

    map.createPane('left');
    map.createPane('right');
    map.zoomControl.setPosition('topright');

    // Add the Search Control to the map
    const search = new GeoSearch.GeoSearchControl({
        id: "search_ctl", provider: new GeoSearch.OpenStreetMapProvider(), showMarker: false, // optional: true|false  - default true
        showPopup: false, position: 'topright', autoClose: true,
    });
    map.addControl(search);

    // Create an empty array to hold the GeoJSON features
    let dzongkhagFeatures = [];

    // Iterate over the Dzongkhag data
    dzongkhagData.forEach(function (dzongkhag) {
        // Create a GeoJSON feature object
        let feature = {
            "type": "Feature", "properties": {
                "id": dzongkhag.id, "name": dzongkhag.name
            }, "geometry": dzongkhag.geometry
        };

        // Add the feature to the array
        dzongkhagFeatures.push(feature);
    });
    gewog_features = L.geoJSON(null, {
        id: 'gewog_features', // Add style function to customize the appearance of features
        style: function () {
            return {
                fillColor: 'transparent', // Set fill color to 'none' to remove fill
                color: '#0a57c9', // Set border color (stroke color)
                weight: 4 // Set border width (stroke width)
            };
        }, onEachFeature: function (feature, layer) {

            // Add a click event listener to load Gewogs when clicking the layer
            layer.on('click', function (e) {

                // Call the loadGewogs function passing the ID from the clicked feature
                selectGewogOption(feature.properties.name, feature.properties.id);

                if (feature.properties.id !== "-999") {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    L.DomEvent.stop(e);
                    L.DomEvent.stopPropagation(e.originalEvent);
                    L.DomEvent.preventDefault(e.originalEvent);
                    L.DomEvent.stop(e.originalEvent);
                }
            });
        }
    }).addTo(map);

    // Create a GeoJSON layer with hover and click events
    dzongkhagLayer = L.geoJSON(dzongkhagFeatures, {
        id: "dzongkhagLayer", style: function () {
            return {
                fillColor: 'transparent', // Set fill color to 'none' to remove fill
                color: '#ffffff', // Set border color (stroke color)
                weight: 2 // Set border width (stroke width)
            };
        }, onEachFeature: function (feature, layer) {
            // Add a click event listener to load Gewogs when clicking the layer
            layer.on('click', function () {
                map.fitBounds(layer.getBounds());

                const sidebarWidth = document.getElementById('sidebar-content').offsetWidth;
                const mapCenter = map.getCenter();
                const newCenter = map.unproject(map.project(mapCenter).subtract(L.point(sidebarWidth / 2, 0)));

                // Call the loadGewogs function passing the ID from the clicked feature
                selectOption(feature.properties.name, feature.properties.id);
                map.setView(newCenter);
            });
        }
    }).addTo(map);

// Fit the map to the extent of the GeoJSON layer
    map.fitBounds(dzongkhagLayer.getBounds());
    $(".leaflet-bar-timecontrol").css("margin-left", "50px");
    $('.leaflet-bar-timecontrol').css('display', 'inline');
    window.dispatchEvent(new Event('resize'));

    setupMenu();
    makeSlider();
    add_paddy_wms(2016);
    baseLayers = getCommonBaseLayers(map); // use baselayers.js to add, remove, or edit
    sidebar = L.control.sidebar("sidebar").addTo(map);
    for (let key of Object.keys(baseLayers)) {
        const map_thumb = $("<div>");
        map_thumb.addClass("map-thumb");
        map_thumb.attr("datavalue", key);
        map_thumb.on("click", handleBaseMapSwitch);

        const thumb_cap = $("<div>");
        thumb_cap.addClass("caption-text");

        const thumb_text = $("<h2>");
        thumb_text.text(baseLayers[key].options.displayName);

        thumb_text.appendTo(thumb_cap);
        const img = $("<img src='" + static_url + "" + baseLayers[key].options.thumb + "' alt='" + baseLayers[key].options.displayName + "'>", {
            title: baseLayers[key].options.displayName,
            datavalue: key,
            click: 'handleBaseMapSwitch($(this)[0].getAttribute("datavalue"))'
        });
        img.addClass("basemapbtn");
        img.appendTo(map_thumb);
        thumb_cap.appendTo(map_thumb);
        map_thumb.appendTo("#basemap");
    }

    sidebar.open('layers');
    client_layers.forEach(createLayer);
    sortableLayerSetup();
    adjust_layer_index();
    $('.yearpicker').off();
    setupYearPicker();
    setupMonthlyPicker();
});
//End ready

/**
 * Removes all features from the gewog features layer.
 * This function clears any previously added GeoJSON features
 * from the `gewog_features` layer, effectively resetting it.
 *
 * @function
 * @returns {void} This function does not return a value.
 *
 * @example
 * // To remove all previous features from the layer
 * removePreviousFeatures();
 */
function removePreviousFeatures() {
    gewog_features.clearLayers();
}

/**
 * Adds GeoJSON features representing gewogs to a specified layer.
 * This function iterates over an array of gewogs from the provided data,
 * creates GeoJSON features for each gewog, and adds them to the layer.
 *
 * @function
 * @param {Object} data - The JSON object containing gewog information.
 * @param {Array} data.gewogs - An array of gewog objects, each containing
 *                               properties and geometry.
 * @param {string} data.gewogs[].id - The unique identifier for the gewog.
 * @param {string} data.gewogs[].name - The name of the gewog.
 * @param {Object} data.gewogs[].geometry - The geometry of the gewog in GeoJSON format.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Assuming `gewogData` is an object containing gewog information
 * addFeaturesToLayer(gewogData);
 */
function addFeaturesToLayer(data) {
    // Iterate over each gewog in the JSON object
    data.gewogs.forEach(function (gewog) {
        // Create a GeoJSON feature for each gewog
        let feature = {
            "type": "Feature", "properties": {
                "id": gewog.id, "name": gewog.name
            }, "geometry": gewog.geometry
        };

        // Add the feature to the layer
        gewog_features.addData(feature);
    });
}

/**
 * Positions the date picker relative to the specified input field.
 * This function adjusts the vertical position of the date picker to ensure it
 * does not extend beyond the boundaries of the sidebar content.
 *
 * @function
 * @param {jQuery} inputField - A jQuery object representing the input field
 *                               for which the date picker is being positioned.
 *                               This input field should be a sibling of the
 *                               date picker element.
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Position the date picker for an input field
 * positionDatepicker($('#myInputField'));
 */
function positionDatepicker(inputField) {
    the_input = inputField;
    let inputOffset = inputField.offset();
    let sidebarContentOffset = $('.sidebar-content').offset();
    let inputHeight = inputField.outerHeight();
    let datePicker = $(inputField.siblings()[2]);
    let datePickerHeight = datePicker.outerHeight();
    let sidebarContentHeight = $('#sidebar').height();

    the_picker = datePicker;

    // Check if the datepicker would be partially or fully outside the sidebar content
    if (inputOffset.top + inputHeight + datePickerHeight > sidebarContentOffset.top + sidebarContentHeight) {
        datePicker.css('top', datePickerHeight * -1 + "px");
    }
}

/**
 * Opens a date picker for the specified input element.
 * This function triggers the date picker to be displayed for the input element
 * identified by the provided ID.
 *
 * @function
 * @param {Object} which - The DOM element that triggered the function call.
 *                         This element is expected to have an `id` property
 *                         that corresponds to the input field associated with the date picker.
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Open the date picker for an element with ID 'dateInput'
 * openPicker({ id: 'dateInput' });
 */
function openPicker(which) {
    $("#" + which.id).datepicker('show');
}

/**
 * Opens a dialog displaying the legend graphic for a specified layer.
 * This function first closes any open dialog, then constructs the legend URL
 * for the selected layer, retrieves the corresponding legend image, and displays
 * it within a jQuery UI dialog. The dialog's title is set to the layer's title.
 *
 * @function
 * @param {string} which - The identifier of the layer for which the legend is requested.
 *                          This identifier may include the string "TimeLayer", which is stripped off
 *                          to find the corresponding layer data.
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Open the legend for a specific layer
 * openLegend("SomeLayerName");
 */
function openLegend(which) {
    close_dialog();
    const dialog = $("#dialog");
    let id = which.replace("TimeLayer", "") + "ens";
    const active_layer = getLayer(which) || getLayer($("[id^=" + id + "]")[0].id);
    const src = active_layer.url + "&REQUEST=GetLegendGraphic&LAYER=" + active_layer.layers + "&colorscalerange=" + active_layer.colorrange + "&style=" + active_layer.styles.substring(active_layer.styles.indexOf("/") + 1) + "&format=image/png"; //+
    // active_layer.styles.substring(active_layer.styles.indexOf("/") + 1);
    const style = "text-align:center;";
    dialog.html('<p style="' + style + '"><img src="' + src + '" alt="legend"></p>');
    dialog.dialog({
        title: active_layer.title, resizable: {handles: "se"}, width: 169, height: 322, position: {
            my: "center", at: "center", of: window
        }
    });
    $(".ui-dialog-title").attr("title", active_layer.title);
}

/**
 * Closes the jQuery UI dialog if it is currently open.
 * This function selects the dialog element with the ID "dialog" and invokes the close method
 * to hide it from the user interface.
 *
 * @function
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Close the dialog if it is open
 * close_dialog();
 */
function close_dialog() {
    const dialog = $("#dialog");
    if (dialog.dialog()) {
        dialog.dialog("close");
    }
}

/**
 * Retrieves a layer from the `client_layers` array based on the provided layer ID.
 * The function removes the suffix "TimeLayer" from the provided ID before matching it with the `id` property of layers in the `client_layers` array.
 *
 * @function
 * @param {string} which - The ID of the layer, potentially with a "TimeLayer" suffix that will be removed for matching.
 * @returns {Object|undefined} The layer object from `client_layers` that matches the ID, or `undefined` if no match is found.
 *
 * @example
 * // Assuming `client_layers` contains layers with IDs like 'layer1' or 'layer2'
 * const layer = getLayer("layer1TimeLayer");
 * console.log(layer); // Returns the layer object with the ID 'layer1'
 */
function getLayer(which) {
    return client_layers.find((item) => item.id === which.replace("TimeLayer", ""));
}

/**
 * Handles the switching of the base map layer on the map.
 * This function removes the currently active base layer, switches to the new one,
 * and updates the Dzongkhag layer style based on the selected base map.
 *
 * @function
 * @param {Event|string} which - The event or string representing the selected base map.
 *                               If it's an event, the `datavalue` attribute of the target is used.
 *
 * @example
 * // Handle the base map switch triggered by a click event
 * document.getElementById("basemapButton").addEventListener("click", handleBaseMapSwitch);
 *
 * @example
 * // Switch directly by passing the base map name as a string
 * handleBaseMapSwitch("Satellite");
 */

function handleBaseMapSwitch(which) {
    if (which.currentTarget) {
        which = which.currentTarget.getAttribute('datavalue');
    }
    map.removeLayer(baseLayers[active_basemap]);
    active_basemap = which;
    baseLayers[active_basemap].addTo(map);
    changeDzongkhagLayerStyle(which);
}

/**
 * Updates the style of each layer in the `dzongkhagLayer` based on the selected basemap.
 * The function checks the basemap name and applies a different border color to the Dzongkhag layer.
 * It supports predefined color schemes for satellite and terrain-based maps.
 *
 * @function
 * @param {string} basemapName - The name of the selected basemap, used to determine the new layer style.
 *
 * @example
 * // Change Dzongkhag layer style to white borders for satellite basemaps:
 * changeDzongkhagLayerStyle("Gsatellite");
 *
 * @example
 * // Change Dzongkhag layer style to green borders for terrain basemaps:
 * changeDzongkhagLayerStyle("Terrain");
 */
function changeDzongkhagLayerStyle(basemapName) {
    // Check the name of the basemap and set the fill color of dzongkhagLayer accordingly
    const white = ["Gsatellite", "Satellite"];
    const green = ["OSM", "Topo", "Terrain", "NatGeo"];
    dzongkhagLayer.eachLayer(function (layer) {
        // Define default style properties
        const style = {
            fillColor: 'transparent', // Default fill color
            color: '#0D3309', // Default border color
            weight: 2 // Default border width
        };

        // Update style based on the basemapName
        if (green.includes(basemapName)) {
            style.color = '#0D3309'; // Change fill color to green
        } else if (white.includes(basemapName)) {
            style.color = '#ffffff'; // Change fill color to white
        }

        layer.setStyle(style);
    });
}

/**
 * Filters the layers in a list based on the user input in a text field.
 * The function listens to the value entered in the input field with the ID `layer_filter` and compares it to the
 * text content of each layer's label (with class `cblabel`) within the layer list.
 * Layers that match the filter are displayed, while those that don't are hidden.
 *
 * @function
 *
 * @example
 * // Assuming you have an input field with ID 'layer_filter' and a layer list with ID 'layer-list':
 * // The function filters the layers in real-time based on the input:
 * layer_filter();
 */
function layer_filter() {
    const input = document.getElementById('layer_filter');
    const filter = input.value.toUpperCase();
    const layer_list = document.getElementById("layer-list");
    const layers = layer_list.getElementsByTagName('li');

    for (let i = 0; i < layers.length; i++) {
        const label = layers[i].getElementsByClassName("cblabel")[0];
        if (label) {
            const txtValue = label.textContent || label.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                layers[i].style.display = "";
            } else {
                layers[i].style.display = "none";
            }
        }
    }
}

/**
 * Initializes a month and year picker widget using Bootstrap Datepicker for each element with the `monthlypicker` class.
 * The picker allows users to select a month and year within a predefined range (January 2002 to December 2023).
 *
 * The month and year picker is initialized with several configurations, including:
 * - `format`: Display format for the selected month and year (MM-YYYY).
 * - `viewMode` and `minViewMode`: Configured to show months in the picker.
 * - `startDate` and `endDate`: Restrict selection to months between January 2002 and December 2023.
 * - `defaultViewDate`: Sets the initial view date to January 2016.
 *
 * Upon showing the month picker, the function repositions the picker using the global `positionDatepicker` function.
 *
 * @global {Function} positionDatepicker - A function that repositions the datepicker element dynamically.
 *
 * @example
 * // Setup month and year picker for all elements with the 'monthlypicker' class:
 * setupMonthlyPicker();
 */
function setupMonthlyPicker() {
    $('.monthlypicker').each(function () {
        const container = $(this).parent();
        $(this).datepicker({
            format: "mm-yyyy", // Set the format to display month and year
            viewMode: "months", // Display the datepicker in month view mode
            minViewMode: "months", // Set the minimum view mode to months
            autoclose: true, container: container, orientation: 'auto', startDate: "01-2002", // Set the start date to January 2016
            endDate: "12-2023", // Set the end date to December 2022
            defaultViewDate: {year: 2016, month: 0}
        }).on('show', function () {
            positionDatepicker($(this));
        });
    });
}

/**
 * Initializes a year picker widget using Bootstrap Datepicker for each element with the `yearpicker` class.
 * The year picker allows users to select a year from a predefined range (2002 - 2023) and ensures the calendar view shows only years.
 * It dynamically generates the list of selectable years and updates the picker UI accordingly.
 *
 * The year picker widget is initialized with several configurations, including:
 * - `format`: Display format for the selected year (YYYY).
 * - `viewMode` and `minViewMode`: Configured to show only years in the picker.
 * - `startDate`: Restricts selection to years starting from 2002.
 *
 * Upon showing the year picker, the function clears out any existing years and generates a custom list of years
 * based on the start and end years. It also handles the active year display and repositions the picker.
 *
 * @global {Function} positionDatepicker - A function that repositions the datepicker element dynamically.
 *
 * @example
 * // Setup year picker for all elements with the 'yearpicker' class:
 * setupYearPicker();
 */
function setupYearPicker() {
    $('.yearpicker').each(function () {
        const container = $(this).parent();
        $(this).datepicker({
            format: "yyyy",
            viewMode: "years",
            startView: "years",
            minViewMode: "years",
            maxViewMode: "years",
            autoclose: true,
            container: container,
            orientation: 'auto',
            startDate: new Date(2002, 0, 1)
        }).on('show', function () {
            const currentYear = $(this).datepicker('getDate').getFullYear();
            const startYear = 2002;
            const endYear = 2023;
            const numYears = endYear - startYear + 1;

            // Clear out all existing years
            $('.datepicker-years .datepicker-switch').text(startYear);

            // Generate and append years
            let yearsHtml = '';
            for (let i = 0; i < numYears; i++) {
                let year = startYear + i;
                yearsHtml += '<span class="year' + (year === currentYear ? ' active' : '') + '">' + year + '</span>';
            }
            $('.datepicker-years tbody').html('<tr><td colspan="7">' + yearsHtml + '</td></tr>');

            positionDatepicker($(this));
        });
    });
}

/**
 * Initializes a noUiSlider for selecting a year within a predefined range.
 * The slider allows users to choose a year from 2016 to 2022, updating the pie chart data accordingly.
 * The slider is rendered with pips (marks) and listens for changes to update the chart based on the selected year.
 *
 * The `setPieYear` function is called on slider update to refresh the pie chart with data for the selected year.
 *
 * @global {Object} yearSlider - The HTML element used for the slider.
 * @global {Function} setPieYear - A function that updates the pie chart data based on the selected year.
 * @function updateSliderRange - A function that updates the range or additional configuration of the slider.
 *
 * @example
 * // Creates and initializes a slider on the #yearSlider element:
 * makeSlider();
 */
function makeSlider() {
    // Initialize noUiSlider
    yearSlider = document.getElementById('yearSlider');
    noUiSlider.create(yearSlider, {
        start: [2016], // Initial value
        step: 1, range: {
            'min': [2016], 'max': [2022]
        }, pips: {
            mode: 'steps', density: -1
        }
    });
    updateSliderRange();

    // Listen for change event
    yearSlider.noUiSlider.on('update', function (values, handle) {
        // set pie chart data for selected year
        setPieYear(parseInt(values[handle]));

    });
}

/**
 * Retrieves pie chart data for the given dataset and year. It filters and
 * structures the data to show the distribution of values (e.g., paddy area) for each
 * Dzongkhag (or Gewog) in the specified year. Dzongkhags (or Gewogs) with a value of zero are excluded.
 *
 * @param {Array<Object>} data - The dataset containing the values for each Dzongkhag (or Gewog).
 * Each object in the array should have a `name` property (Dzongkhag or Gewog name) and a `values` property,
 * which is an array of objects with `year` and `value` properties.
 * @param {number} year - The year for which the pie chart data should be filtered and returned.
 *
 * @returns {Array<Object>} An array of objects formatted for use in a pie chart. Each object contains:
 * - `name` (string): The Dzongkhag (or Gewog) name.
 * - `y` (number): The value associated with that Dzongkhag (or Gewog) in the selected year.
 * Only objects with a non-zero value are included.
 *
 * @example
 * const data = [
 *   { name: 'Dzongkhag A', values: [{ year: 2020, value: 100 }, { year: 2021, value: 120 }] },
 *   { name: 'Dzongkhag B', values: [{ year: 2020, value: 0 }, { year: 2021, value: 50 }] }
 * ];
 * const year = 2021;
 * const result = getPieChartData(data, year);
 * // result => [{ name: 'Dzongkhag A', y: 120 }, { name: 'Dzongkhag B', y: 50 }]
 */
function getPieChartData(data, year) {
    // Find the dzongkhag data for the selected year
    let final_pie_data = data.map(function (item) {
        let pie_data = item.values.find(function (value) {
            return value.year === year;
        });
        return {
            name: item.name, y: pie_data ? pie_data.value : 0
        };
    });

    return final_pie_data.filter(function (item) {
        return item.y > 0; // Remove dzongkhags with zero values
    });
}

/**
 * Updates the pie chart based on the selected year and whether the data is
 * being displayed at the Dzongkhag or Gewog level. It also updates the chart title
 * accordingly and refreshes the chart data for the selected year.
 *
 * @param {number} year - The year for which the pie chart data should be displayed.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Set the pie chart data and title for the year 2021
 * setPieYear(2021);
 */
function setPieYear(year) {
    let data;
    if (all_active) {
        data = full_data;
        piechart.setTitle({text: `Paddy area distribution in acres by Dzongkhag`});
    } else {
        piechart.setTitle({text: `Paddy area distribution in acres by Gewog`});
        data = global_dzongkhag_data;
    }

    selectedYear = year;
    // Update the pie chart data
    piechart.series[0].setData(getPieChartData(get_formatted_data(data), selectedYear));
}

window.addEventListener('resize', updateAspectRatio);

/**
 * Updates the height of all elements with the class 'aspect-ratio-container'
 * to maintain a 9:16 aspect ratio based on the container's current width.
 * This ensures the container's height scales dynamically with its width to preserve the ratio.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Dynamically adjust the aspect ratio of all elements with the class 'aspect-ratio-container'
 * updateAspectRatio();
 */
function updateAspectRatio() {
    const aspectRatio = 9 / 16; // 9:16 aspect ratio
    const containers = document.querySelectorAll('.aspect-ratio-container');
    containers.forEach(function (container) {
        const containerWidth = container.offsetWidth;
        const containerHeight = containerWidth * aspectRatio;
        container.style.height = containerHeight + 'px';
    });
}

/**
 * Filters the options displayed in a dropdown list based on user input in a filter box.
 * This function hides options that do not match the filter text and displays those that do.
 *
 * @param {string} optionsID - The ID of the dropdown list element containing the options to filter.
 * @param {string} filterID - The ID of the input element used for filtering the options.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Filter options in the dropdown with ID "dzongkhagOptions" based on input from "dzongkhagFilter"
 * filterOptions("dzongkhagOptions", "dzongkhagFilter");
 */
function filterOptions(optionsID, filterID) {
    let input, filter, ul, li, a, i;
    input = document.getElementById(filterID);
    filter = input.value.toUpperCase();
    ul = document.getElementById(optionsID);
    li = ul.getElementsByTagName("li");
    for (i = 1; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

/**
 * Creates and adds a filter input box to a specified options list.
 * This filter box allows users to search through the options dynamically
 * as they type, updating the displayed options accordingly.
 *
 * @param {string} optionsID - The ID of the element containing the options to be filtered.
 * @param {string} filterID - The ID to assign to the created filter input element.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Add a filter box to the dropdown options with ID "dzongkhagOptions"
 * addFilterBox("dzongkhagOptions", "dzongkhagFilter");
 */
function addFilterBox(optionsID, filterID) {
    const filterInput = document.createElement("input");
    filterInput.setAttribute("class", "form-control");
    filterInput.setAttribute("type", "text");
    filterInput.setAttribute("id", filterID);
    filterInput.setAttribute("onkeyup", "filterOptions('" + optionsID + "','" + filterID + "')");
    filterInput.setAttribute("placeholder", "Search...");
    const filterLi = document.createElement("li");
    filterLi.appendChild(filterInput);
    document.getElementById(optionsID).appendChild(filterLi);
}

/**
 * Retrieves Gewogs for a specified Dzongkhag within the selected country.
 * This function checks if the Dzongkhag exists within the country's boundaries
 * and returns the corresponding Gewogs if available.
 *
 * @param {string} dzongkha - The name of the Dzongkhag for which to retrieve Gewogs.
 *
 * @returns {Array} An array of Gewogs associated with the specified Dzongkhag, or an empty array if none are found.
 *
 * @example
 * // Get Gewogs for the Dzongkhag named "Thimphu"
 * const gewogs = getGewogs("Thimphu");
 */
function getGewogs(dzongkha) {
    let country = $("#selectedCountry").text();
    if (boundary["Countries"][country]["dzongkhags"][dzongkha]) {
        return boundary["Countries"][country]["dzongkhags"][dzongkha]["gewogs"];
    } else {
        return [];
    }
}

/**
 * Loads Dzongkhags for a specified country into the dropdown options.
 * This function clears previous Dzongkhag options, retrieves the new Dzongkhags for the given country,
 * and populates the dropdown menu with the Dzongkhag options, including an "All Dzongkhags" option.
 *
 * @param {string} country - The name of the country for which to load Dzongkhags.
 *
 * @returns {void} This function does not return a value.
 *
 * @example
 * // Load Dzongkhags for Bhutan into the dropdown
 * loadDzongkhags("Bhutan");
 */
function loadDzongkhags(country) {
    // Clear the previous options
    document.getElementById("dzongkhagOptions").innerHTML = "";
    addFilterBox("dzongkhagOptions", "dzongkhagFilter");

    const dzongkhags = getDzongkhags(country);
    const dzongkhas_list = [];
    for (const key in dzongkhags) {
        dzongkhas_list.push(dzongkhags[key]);
    }

    addOptions([{
        name: "All Dzongkhags", dzongkhag_id: "-999"
    }, ...dzongkhas_list], "dzongkhagOptions", "dzongkhagFilter");
}

/**
 * Retrieves a list of Dzongkhags for a given country from the boundary data structure.
 * If the country does not exist in the boundary data, an empty array is returned.
 *
 * @param {string} country - The name of the country for which to retrieve Dzongkhags.
 * @returns {Array<Object>} An array of Dzongkhag objects associated with the specified country.
 *
 * Each Dzongkhag object may contain properties such as:
 * @param {string} dzongkhag.id - The unique identifier for the Dzongkhag.
 * @param {string} dzongkhag.name - The name of the Dzongkhag.
 *
 * @example
 * // Retrieving Dzongkhags for a specific country
 * const dzongkhags = getDzongkhags("Bhutan");
 * console.log(dzongkhags); // Outputs the array of Dzongkhags for Bhutan
 */
function getDzongkhags(country) {
    if (boundary["Countries"][country]) {
        return boundary["Countries"][country]["dzongkhags"];
    } else {
        return [];
    }
}

/**
 * Adds options to a dropdown menu dynamically based on the provided options.
 * Each option is wrapped in a list item and configured to trigger a specific selection function when clicked.
 *
 * @param {Array<Object>} options - An array of option objects to be added to the dropdown.
 * @param {string} dropdownID - The ID of the dropdown menu to which the options will be appended.
 * @param {string} filterID - The ID of the filter (not used in the current implementation but can be referenced for future use).
 * @param {boolean} isGewog - Indicates whether the options being added are Gewogs. If true, a Gewog-specific function is called.
 *
 * Each option object in the `options` array should have the following structure:
 * @param {string} options[].name - The display name for the option.
 * @param {string} options[].gewog_id - The unique identifier for the Gewog (if isGewog is true).
 * @param {string} options[].dzongkhag_id - The unique identifier for the Dzongkhag (if isGewog is false).
 *
 * This function performs the following actions:
 * 1. Selects the target dropdown menu by its ID.
 * 2. Iterates through each option in the provided options array.
 * 3. Creates a new list item (`<li>`) and a link (`<a>`) for each option.
 * 4. Configures the link's `onclick` attribute to call the appropriate selection function (`selectGewogOption` or `selectOption`).
 * 5. Appends the link to the list item, and then appends the list item to the dropdown menu.
 *
 * @example
 * // Adding Gewog options to a dropdown
 * addOptions([{ name: "Gewog A", gewog_id: "1" }, { name: "Gewog B", gewog_id: "2" }], "gewogDropdown", "filterID", true);
 *
 * // Adding Dzongkhag options to a dropdown
 * addOptions([{ name: "Dzongkhag A", dzongkhag_id: "1" }, { name: "Dzongkhag B", dzongkhag_id: "2" }], "dzongkhagDropdown", "filterID", false);
 */
function addOptions(options, dropdownID, filterID, isGewog) {
    const gewog = isGewog ? "Gewog" : "";
    let ul = document.getElementById(dropdownID);

    options.forEach(function (option) {
        let li = document.createElement("li");
        let a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "dropdown-item");
        if (isGewog) {
            a.setAttribute("onclick", "select" + gewog + "Option('" + option.name + "', '" + option.gewog_id + "')");
        } else {
            a.setAttribute("onclick", "selectOption('" + option.name + "', '" + option.dzongkhag_id + "')");
        }
        a.textContent = option.name;
        li.appendChild(a);
        ul.appendChild(li);
    });
}

/**
 * Handles the selection of a Gewog from a dropdown menu.
 * Updates the corresponding charts and filters based on the selected Gewog.
 *
 * @param {string} name - The name of the selected Gewog, used to update the label of the second dropdown.
 * @param {string} id - The unique identifier of the selected Gewog. If the id is "-999", it selects the associated Dzongkhag.
 *
 * This function performs the following actions:
 * 1. Updates the label of the "selectGewog" dropdown.
 * 2. Clears the current filters for Gewogs.
 * 3. If the id is "-999", it triggers a click event on the associated Dzongkhag option.
 * 4. If the id is valid (not "-999"), it highlights the corresponding table row and retrieves Gewog data from the server.
 * 5. It then builds several charts based on the received data, including:
 *    - Paddy change since the base year
 *    - Paddy area
 *    - Paddy yield vs predicted yield
 *    - Temperature (min and max)
 *    - NDVI
 *    - Soil moisture
 *    - Monthly precipitation
 * 6. It also fits the map bounds to the selected Gewog's feature.
 *
 * @example
 * // Selecting a Gewog with a valid ID
 * selectGewogOption("Some Gewog", "123");
 *
 * // Selecting a Dzongkhag with a specific ID
 * selectGewogOption("Some Dzongkhag", "-999");
 */
function selectGewogOption(name, id) {
    // Update the label of the second dropdown
    document.getElementById("selectGewog").innerHTML = name;
    $("#gewogsFilter").val('');
    filterOptions('gewogOptions', 'gewogsFilter');
    if (id === "-999") {
        gewog_features.clearLayers();
        // ********   selectOption()
        let buttonText = document.getElementById('selectDzongkhag').innerText.trim();

        // Step 2: Iterate through the list items inside the dropdown menu
        let listItems = document.querySelectorAll('#dzongkhagOptions .dropdown-item');
        listItems.forEach(function (listItem) {
            // Step 3: Extract the text of the <a> tag
            let linkText = listItem.innerText.trim();

            // Step 4: If the text matches the text of the button, trigger a click event on that <a> tag
            if (linkText === buttonText) {
                listItem.click();
            }
        });
    } else {
        highlightTableRow(name);
        $.ajax({
            url: '/get-gewog-data/' + id, // Adjust the URL as per your Django API endpoint
            method: 'GET', success: function (gewog_data) {
                buildChart('paddy_gain', 'Paddy change since base year', 'something different', 'column', 2017, 'acres', 'Range: 2016 to 2022', [{
                    name: 'Base 2020, COVID Outbreak', data: gewog_data["paddy_loss"].map(function (data) {
                        return [data.year, data.val];
                    })
                }], ['rgb(0,93,14)']);

                buildChart('rice_area', 'Paddy Area', 'something different', 'line', '', 'acres', '', [{
                    name: 'Paddy Area', data: gewog_data["rice_area"].map(function (data) {
                        return [data.x, data.val];
                    })
                }], ['rgb(0,93,14)']);

                buildChart('rice_yield', 'Paddy Yield vs Predicted', '', 'line', 2017, 'Kg/acres', '', [{
                    name: 'Yield', data: gewog_data["yield"].map(function (data) {
                        return [data.x, data.yield];
                    })
                }, {
                    name: 'Predicted', data: gewog_data["yield"].map(function (data) {
                        return [data.x, data.predicted];
                    })
                }], ['rgb(90,254,44)', 'rgb(0,93,14)'], true);

                const precip_data = {
                    name: 'Precipitation', data: gewog_data["precipitation"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                const temp_min = {
                    name: 'Temperature Min', data: gewog_data["temperature"].map(function (data) {
                        return [data.x, data.min];
                    }), unit: '&deg;C'
                };

                const temp_max = {
                    name: 'Temperature Max', data: gewog_data["temperature"].map(function (data) {
                        return [data.x, data.max];
                    }), unit: '&deg;C'
                };

                // uncomment this line when temp data for Dzongkhags is loaded
                buildChart('temperature-spark', 'Temperature', '', 'line', '', '&deg;C', '', [temp_min, temp_max], ['#8AAFFF', '#FF0200']);

                const ndvi_data = {
                    name: 'NDVI', data: gewog_data["ndvi"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                buildChart('ndvi-spark', 'NDVI', '', 'line', '', 'NDVI', '', [ndvi_data], ['rgb(0,93,14)']);

                const sm_data = {
                    name: 'Soil Moisture', data: gewog_data["soil_moisture"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                buildChart('soil-moisture-spark', 'Soil Moisture', '', 'line', '', 'mm', '', [sm_data], ['rgb(0,93,14)']);
                buildChart('precipitation-spark', 'Monthly Precipitation', '', 'line', '', 'mm', '', [precip_data], ['rgb(0,93,14)']);
            }, error: function (error) {
                // Handle errors here
                console.error('Error getting new data:', error);
            }
        });

        gewog_features.eachLayer(function (layer) {
            // Check if the layer's feature id matches the provided featureId
            if (layer.feature.properties.id === id) {
                // Fit the map bounds to the geometry of the matched layer
                map.fitBounds(layer.getBounds());
            }
        });
    }
    updateSliderRange();
}

/**
 * Selects an option from the dropdown and updates the related charts and data based on the selected dzongkhag.
 *
 * This function updates the second dropdown's label and handles data retrieval
 * and chart updates based on whether the user selects "All Dzongkhags" or a specific
 * dzongkhag. It makes an AJAX request to fetch dzongkhag-specific data when a
 * specific dzongkhag is selected and builds various charts based on the retrieved data.
 *
 * @param {string} option - The name of the selected option (e.g., "All Dzongkhags" or a specific dzongkhag).
 * @param {string} dzongkhagID - The ID of the selected dzongkhag (used for data retrieval).
 *
 * @returns {void}
 *
 * Example:
 * selectOption("All Dzongkhags", null);
 * selectOption("Bumthang", "bumthang-dzongkhag-id");
 */
function selectOption(option, dzongkhagID) {
    // Update the label of the second dropdown
    document.getElementById("selectDzongkhag").innerHTML = option;
    if (option.toLowerCase() === "all dzongkhags") {
        $("#gewoglist").hide();

        gewog_features.clearLayers();
        buildChart('paddy_gain', 'Paddy change since base year', 'Bumthang Dzongkhag 2016: 10.96 acres', 'column', 2017, 'acres', 'Range: 2016 to 2022', [{
            name: 'Base 2008, Transition to democracy', data: full_data["paddy_gain"].map(function (data) {
                return [data.year, data.val];
            })
        }, {
            name: 'Base 2020, COVID Outbreak', data: full_data["paddy_loss"].map(function (data) {
                return [data.year, data.val];
            })
        }], ['rgb(90,254,44)', 'rgb(0,93,14)']);

        buildChart('rice_area', 'Paddy Area', 'something different', 'line', '', 'acres', '', [{
            name: 'Paddy Area', data: full_data["rice_area"].map(function (data) {
                return [data.x, data.val];
            })
        }], ['rgb(0,93,14)']);
        /* This is incorrect, not sure what is going wrong, but need to debug please */

        buildChart('rice_yield', 'Paddy Yield vs Predicted', '', 'line', 2017, 'Kg/acres', '', [{
            name: 'Yield', data: full_data["yield"].map(function (data) {
                return [data.x, data.yield];
            })
        }, {
            name: 'Predicted', data: full_data["yield"].map(function (data) {
                return [data.x, data.predicted];
            })
        }], ['rgb(90,254,44)', 'rgb(0,93,14)'], true);

        buildChart('ndvi-spark', 'NDVI', '', 'line', '', 'NDVI', '', [{
            name: 'NDVI', data: full_data["ndvi"].map(function (data) {
                return [data.x, data.val];
            }), unit: 'NDVI'
        }], ['rgb(0,93,14)']);

        map.fitBounds(dzongkhagLayer.getBounds());
        all_active = true;
        setPieYear(2016);
    } else {
        $.ajax({
            url: '/get-dzongkhag-data/' + dzongkhagID, // Adjust the URL as per your Django API endpoint
            method: 'GET', success: function (dzongkhag_data) {
                buildChart('paddy_gain', 'Paddy change since base year', 'something different', 'column', 2017, 'acres', 'Range: 2016 to 2022', [{
                    name: 'Base 2008, Transition to democracy', data: dzongkhag_data["paddy_gain"].map(function (data) {
                        return [data.year, data.val];
                    })
                }, {
                    name: 'Base 2020, COVID Outbreak', data: dzongkhag_data["paddy_loss"].map(function (data) {
                        return [data.year, data.val];
                    })
                }], ['rgb(90,254,44)', 'rgb(0,93,14)']);

                buildChart('rice_area', 'Paddy Area', 'something different', 'line', '', 'acres', '', [{
                    name: 'Rice Area', data: dzongkhag_data["rice_area"].map(function (data) {
                        return [data.x, data.val];
                    })
                }], ['rgb(0,93,14)']);

                global_dzongkhag_data = dzongkhag_data;

                buildChart('rice_yield', 'Paddy Yield vs Predicted', '', 'line', 2017, 'Kg/acres', '', [{
                    name: 'Yield', data: dzongkhag_data["yield"].map(function (data) {
                        return [data.x, data.yield];
                    })
                }, {
                    name: 'Predicted', data: dzongkhag_data["yield"].map(function (data) {
                        return [data.x, data.predicted];
                    })
                }], ['rgb(90,254,44)', 'rgb(0,93,14)'], true);

                all_active = false;
                setPieYear(2018);
                const ndvi_data = {
                    name: 'NDVI', data: dzongkhag_data["ndvi"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                buildChart('ndvi-spark', 'NDVI', '', 'line', '', 'NDVI', '', [ndvi_data], ['rgb(0,93,14)']);

                const precip_data = {
                    name: 'Precipitation', data: dzongkhag_data["precipitation"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                buildChart('precipitation-spark', 'Monthly Precipitation', '', 'line', '', 'mm', '', [precip_data], ['rgb(0,93,14)']);

                // adding yield
                const sm_data = {
                    name: 'Soil Moisture', data: dzongkhag_data["soil_moisture"].map(function (data) {
                        return [data.x, data.val];
                    }), unit: 'mm'
                };

                buildChart('soil-moisture-spark', 'Soil Moisture', '', 'line', '', 'mm', '', [sm_data], ['rgb(0,93,14)']);

                // adding temperature-spark
                const temp_min = {
                    name: 'Temperature Min', data: dzongkhag_data["temperature"].map(function (data) {
                        return [data.x, data.min];
                    }), unit: '&deg;C'
                };

                const temp_max = {
                    name: 'Temperature Max', data: dzongkhag_data["temperature"].map(function (data) {
                        return [data.x, data.max];
                    }), unit: '&deg;C'
                };

                // uncomment this line when temp data for Dzongkhags is loaded
                buildChart('temperature-spark', 'Temperature', '', 'line', '', '&deg;C', '', [temp_min, temp_max], ['#8AAFFF', '#FF0200']);
                updateSliderRange();
                // Clear all graphs and load with the new data
            }, error: function (error) {
                // Handle errors here
                console.error('Error getting new data:', error);
            }
        });

        loadGewogs(option, dzongkhagID);
        document.getElementById("selectGewog").innerHTML = "All Gewogs";
        $("#gewoglist").show();
        let feature = getFeatureByDzongkhagID(dzongkhagID);

        // Fit map bounds to the feature's geometry
        if (feature) {
            map.fitBounds(feature.getBounds());
        }
    }
    $("#dzongkhagFilter").val('');
    filterOptions('dzongkhagOptions', 'dzongkhagFilter');
    updateSliderRange();
}

/**
 * Retrieves a feature from the dzongkhag layer based on the specified dzongkhag ID.
 *
 * This function iterates through all features in the `dzongkhagLayer` and
 * returns the feature that matches the given dzongkhag ID. If no feature
 * is found with the specified ID, it returns `null`.
 *
 * @param {string} dzongkhagID - The ID of the dzongkhag to search for.
 * @returns {L.Layer|null} The matching feature layer if found, otherwise `null`.
 *
 * Example:
 * const feature = getFeatureByDzongkhagID("some-dzongkhag-id");
 */
function getFeatureByDzongkhagID(dzongkhagID) {
    // Iterate through the GeoJSON layer's features to find the one with the matching dzongkhag ID
    let feature = null;
    dzongkhagLayer.eachLayer(function (layer) {
        if (layer.feature.properties.id === dzongkhagID) {
            feature = layer;
        }
    });
    return feature;
}

/**
 * Sets up the country selection menu for the user interface.
 *
 * This function initializes the dropdown menu for country selection. It checks
 * the number of countries available in the `boundary` object and updates the
 * UI accordingly:
 * - If there is only one country, it sets the button text to that country's name,
 *   removes dropdown functionality, and loads the corresponding dzongkhags.
 * - If there are multiple countries, it populates the dropdown with a list of
 *   countries sorted in alphabetical order, allowing users to select a country
 *   to load its dzongkhags.
 *
 * @returns {void}
 *
 * Example:
 * setupMenu();
 */
function setupMenu() {
    // Get the button element
    let selectedCountryBtn = document.getElementById("selectedCountry");
    // Get the ul element
    let countryList = document.getElementById("countryList");

    // Check the number of countries
    let countryCount = Object.keys(boundary["Countries"]).length;
    const selectedCountry = $("#selectedCountry");
    // If there's only one country, set the button text to that country's name
    if (countryCount === 1) {
        let countryName = Object.keys(boundary["Countries"])[0];
        selectedCountryBtn.textContent = countryName;
        selectedCountry.removeClass("dropdown-toggle");
        selectedCountry.removeAttr("data-bs-toggle");
        loadDzongkhags(countryName);
        selectedCountryBtn.addEventListener("click", function () {
            selectOption("All Dzongkhags");
        });
    } else {
        // If there are multiple countries, set the button text to "Select Country"
        selectedCountryBtn.textContent = "Select Country";

        // Add a list of countries sorted in alphabetical order
        let countries = Object.keys(boundary["Countries"]).sort();
        countries.forEach(function (country) {
            let li = document.createElement("li");
            let a = document.createElement("a");
            a.setAttribute("href", "#");
            a.setAttribute("class", "dropdown-item");
            a.textContent = country;
            // Add click event listener to load dzongkhags for the selected country
            a.addEventListener("click", function () {
                loadDzongkhags(country);
            });
            li.appendChild(a);
            countryList.appendChild(li);
        });
        selectedCountry.addClass("dropdown-toggle");
        selectedCountry.attr("data-bs-toggle", "dropdown");
        $(countryList).removeClass("display");
    }
}

/**
 * Adds the Paddy WMS layer to the map.
 *
 * This function checks if the Paddy layer already exists on the map.
 * If it does, the layer is removed to ensure that the latest version can be added
 * without duplicates. Additional logic to add the layer should be implemented
 * after this function call if needed.
 *
 * @returns {void}
 *
 * Example:
 * add_paddy_wms();
 */
function add_paddy_wms() {
    if (paddy_layer) {
        map.removeLayer(paddy_layer);
    }
}

/**
 * Toggles the visibility of a specified layer on the map.
 *
 * This function checks if a layer is currently added to the map.
 * If it is, the layer is removed, and the corresponding date control is disabled.
 * If it is not, the layer is added to the map, and the date control is enabled.
 *
 * @param {string} which - The unique identifier of the layer to toggle.
 *
 * Example:
 * toggleLayer('layer1');
 */
function toggleLayer(which) {
    // Get date from the button and set b4 adding, else the layer and date will be out of sync
    const date_control = $("#" + which + "_date");
    if (map.hasLayer(overlayMaps[which])) {
        map.removeLayer(overlayMaps[which]);

        date_control.addClass("disabled");
        date_control.prop("disabled", true);
    } else {
        map.addLayer(overlayMaps[which]);
        date_control.removeClass("disabled");
        date_control.prop("disabled", false);
    }
}

/**
 * Creates a WMS layer and adds it to the overlayMaps object.
 *
 * This function takes an item object containing properties for a WMS layer,
 * constructs the layer's configuration, and initializes it using the Leaflet `L.tileLayer.wms` method.
 * If the layer is set to be displayed by default, it will also toggle the layer on the map.
 *
 * @param {Object} item - An object containing the properties for the layer.
 * @param {string} item.id - The unique identifier for the layer.
 * @param {string} item.url - The base URL for the WMS service.
 * @param {string} item.layers - A comma-separated string of the layer names to request from the WMS service.
 * @param {string} item.colorrange - The color scale range for the layer.
 * @param {string} item.overrange - The color to use for values above the maximum range.
 * @param {string} item.belowrange - The color to use for values below the minimum range.
 * @param {string} item.styles - The styles to apply to the layer.
 * @param {string} item.default_year - The default year for the time parameter.
 * @param {boolean} item.default_on - Indicates if the layer should be displayed by default (as a string).
 * @param {string} [item.pane] - Optional. The pane to which the layer will be added.
 * @param {string} [item.time] - Optional. The specific time to be set for the layer.
 *
 * Example:
 * const layerItem = {
 *     id: 'layer1',
 *     url: 'http://example.com/wms',
 *     layers: 'my_layer',
 *     colorrange: '0,100',
 *     overrange: '#FF0000',
 *     belowrange: '#0000FF',
 *     styles: 'default',
 *     default_year: '2024',
 *     default_on: 'True'
 * };
 * createLayer(layerItem);
 */
function createLayer(item) {
    const layer_obj = {
        layers: item.layers,
        format: "image/png",
        transparent: true,
        colorscalerange: item.colorrange,
        abovemaxcolor: item.overrange,
        belowmincolor: item.belowrange,
        numcolorbands: 100,
        styles: item.styles,
        tileSize: 256,
        version: "1.3.0",
        time: item.default_year + "-01-01T00:00:00.000Z"
    };
    if (item.pane) {
        layer_obj.pane = item.pane;
    }
    if (item.time) {
        layer_obj.time = item.time;
    }

    overlayMaps[item.id] = L.tileLayer.wms(item.url + "&crs=EPSG%3A3857", layer_obj);
    if (item.default_on === "True") {
        toggleLayer(item.id);
    }
}

/**
 * Removes all checked layers from the map by simulating a click on their corresponding checkboxes.
 *
 * This function iterates through all elements with the class "rst__rowTitle"
 * and checks if the associated checkbox input is checked. If it is, the function simulates a click
 * on that checkbox, effectively removing the layer from the map.
 *
 * This is useful for quickly clearing multiple layers without having to click each checkbox individually.
 *
 * Logic:
 * - The function retrieves all elements with the class "rst__rowTitle".
 * - It loops through these elements and checks for the presence of a checkbox input.
 * - If the checkbox is checked, a click event is triggered on it to remove the corresponding layer from the map.
 *
 * Example:
 * If there are multiple layers displayed on the map, calling this function will remove
 * all layers that are currently checked by clicking their respective checkboxes.
 */
function removeAllLayers() {
    // Get all elements with class "rst__rowTitle"
    let elements = document.getElementsByClassName("rst__rowTitle");

    // Iterate over each element
    for (let i = 0; i < elements.length; i++) {
        let input = elements[i].querySelector('input[type="checkbox"]');

        // Check if the input is checked
        if (input.checked) {
            $(input).click();
        }
    }
}

/**
 * Updates the legend image for the specified side of the comparison based on the selected layer.
 *
 * This function modifies the source of the legend images displayed in the user interface
 * when comparing different agricultural layers (e.g., rice, maize, crop land).
 * The appropriate image is selected based on the current layer being compared and which side (left or right) is active.
 *
 * Parameters:
 * - `layer` (string): The identifier of the layer being compared. It is expected to start with a prefix
 *                     indicating the type of crop (e.g., "rice_", "maize_", "crop_land_").
 * - `side` (string): A string indicating which side of the comparison the update is for.
 *                    This should be either "left" or "right".
 *
 * Logic:
 * - The function determines the appropriate legend image filename based on the provided layer prefix.
 * - It then updates the target legend image source URL based on the specified side.
 * - If the layers being compared on both sides are identical, the right legend image is updated
 *   to reflect a comparison state.
 *
 * Example:
 * If the `layer` is "rice_" and the `side` is "left", the legend image source will be updated to
 * point to "static_url/images/paddy.png". If both sides compare the same layer, the right legend
 * will include "_compare" in its filename.
 *
 * @param {string} layer - The layer identifier to determine the corresponding legend image.
 * @param {string} side - The side ("left" or "right") for which to update the legend image.
 */
function updateChangeLegend(layer, side) {
    const target = document.getElementById(side + "_legend_image");
    const right_legend = document.getElementById("right_legend_image");
    let layer_name = "paddy_compare.png";

    switch (layer) {
        case "rice_":
            layer_name = "paddy";
            break;
        case "maize_":
            layer_name = "maize";
            break;
        case "crop_land_":
            layer_name = "crop_land";
            break;
    }

    if (side === "left") {
        if ($("#left_compare_layer").val() === $("#right_compare_layer").val()) {
            let r_src = right_legend.src.split('/').pop();
            if (r_src.indexOf("_compare") === -1) {
                let src_split = r_src.split(".");
                right_legend.src = static_url + "images/" + src_split[0] + "_compare." + src_split[1];
            }
        } else {
            right_legend.src = right_legend.src.replace("_compare", '');
        }
    } else if (side === "right") {

        if ($("#left_compare_layer").val() === $("#right_compare_layer").val()) {
            layer_name = layer_name + "_compare";
        }
    }

    target.src = static_url + "images/" + layer_name + ".png";
}

/**
 * Updates the time parameter for a specified map layer based on user input.
 *
 * This function is used to update the time-related parameter of a WMS (Web Map Service) layer in the map.
 * It extracts the date from a form element (typically a dropdown or date picker) and modifies the time parameter
 * of the WMS layer associated with the selected layer ID.
 *
 * Usage:
 * - The function is triggered when a user selects a new date for a map layer.
 * - It checks if the layer is a WMS layer (an instance of `L.TileLayer.WMS`) and updates its time parameter.
 *
 * Parameters:
 * - `which` (HTMLElement): The input element (usually a date selector) that contains the new date value.
 *
 * Logic:
 * - The function extracts the layer ID by removing the `_date` suffix from the element's `id` attribute.
 * - It checks if the corresponding layer in the `overlayMaps` object is a WMS layer.
 * - If the date includes a hyphen (`-`), it assumes the input is in "MM-YYYY" format and constructs the appropriate time string.
 * - If the date does not contain a hyphen, it assumes the input is in "YYYY" format and constructs a default time string with January as the month.
 * - The WMS layer's `time` parameter is updated accordingly using `setParams()`.
 *
 * Example:
 * If the user selects "2023" from the date input for a layer, the time parameter will be updated to "2023-01-01T00:00:00.000Z".
 *
 * @param {HTMLElement} which - The date input element that triggers the update.
 */
function updateLayer(which) {
    const id = which.id.replace("_date", "");
    let layer = overlayMaps[id];
    // Check if the layer is a WMS layer
    if (layer instanceof L.TileLayer.WMS) {
        // Update the time parameter
        if (which.value.indexOf("-") > 0) {
            const date_values = which.value.split("-");
            layer.setParams({time: date_values[1] + "-" + date_values[0] + "-01T00:00:00.000Z"});
        } else {
            layer.setParams({time: which.value + "-01-01T00:00:00.000Z"});
        }
    }
}

/**
 * Initializes the sortable functionality for the map layer list.
 *
 * This function enables drag-and-drop sorting of map layers using the jQuery UI `sortable()` method.
 * It allows users to reorder layers by dragging them, with animations and visual feedback during the drag operation.
 * When the order is changed, the function triggers an update to the layer z-index using the `adjust_layer_index()` function.
 *
 * The sortable configuration includes options such as custom classes for dragging and placeholder elements,
 * as well as animation settings for smooth movement during dragging.
 *
 * Usage:
 * - This function is applied to an ordered list (`ol.layers`) containing the map layers.
 * - It handles sorting events such as `change` (when an element is being dragged) and `update`
 *   (when the order is finalized) to adjust the layer z-index accordingly.
 *
 * Sortable options:
 * - `group`: Defines the group name for sortable behavior.
 * - `handle`: Specifies the class for the element used as the drag handle.
 * - `revert`: Enables smooth animation when the dragged item is dropped.
 * - `pullPlaceholder`: Ensures the placeholder behaves correctly when dragging.
 * - `ghostClass`, `chosenClass`, `dragClass`: Class names used for the placeholder, chosen, and dragged items, respectively.
 * - `animation`: Duration of the drag animation in milliseconds.
 * - `easing`: Defines the easing function for smooth drag animation.
 * - `change`: Callback that adjusts layer index while dragging.
 * - `update`: Callback that finalizes the layer order and z-index after dragging is completed.
 * - `filter`: Elements that should not trigger the sortable behavior.
 * - `tolerance`: Defines how to calculate the pointer position during dragging.
 */
function sortableLayerSetup() {
    $("ol.layers").sortable({
        group: "simple_with_animation",
        handle: ".rst__moveHandle",
        revert: true,
        pullPlaceholder: true,
        ghostClass: "ui-sortable-placeholder",  // Class name for the drop placeholder
        chosenClass: "sortable-chosen",  // Class name for the chosen item
        dragClass: "sortable-drag",  // Class name for the dragging item
        animation: 150,
        easing: "cubic-bezier(1, 0, 0, 1)",
        change: function (event, ui) {
            adjust_layer_index(ui);
        },
        update: function () {
            adjust_layer_index();
        },
        filter: ".slider",
        tolerance: "pointer",
    });
}

/**
 * Adjusts the z-index of map layers based on the order of the layer list in the UI.
 *
 * This function modifies the order and z-index of map layers displayed in the UI when the user drags and repositions
 * layers. It works by adjusting the HTML list of layers (`ol.layers`) and then updating the `overlayMaps` object
 * to reflect the new z-index values, ensuring layers are rendered in the correct stacking order on the map.
 *
 * @param {Object} [ui] - The jQuery UI object representing the dragged layer element. It contains information
 * about the position and ID of the layer being dragged, allowing the function to re-insert the layer at the
 * correct position in the list.
 *
 * Usage:
 * 1. When a layer is dragged (`ui` is provided), the function temporarily removes the dragged element and re-inserts
 *    it at the correct index in the HTML list.
 * 2. The function then retrieves all layers from the list (`li` elements), reverses the order, and updates the
 *    z-index of each layer in the `overlayMaps` object. The z-index ensures proper visual stacking of the layers.
 *
 * Steps:
 * 1. If a layer is being dragged, remove it from the list and reinsert it at the correct position.
 * 2. Reverse the list of layers and update their z-index on the map.
 */
function adjust_layer_index(ui) {

    let count = 10;
    const ol_layers = $("ol.layers");

    if (ui) {
        const current_index = ui.placeholder.index();
        const dragging_id = ui.helper[0].id;

        // Remove the dragging element temporarily
        const dragging_element = ol_layers.find(`#${dragging_id}`).detach();

        // Insert the dragging element at the correct position
        if (current_index === ol_layers.children().length) {
            // Insert after the last element
            ol_layers.append(dragging_element);
        } else {
            ol_layers.children().eq(current_index).before(dragging_element);
        }
    }
    const li_elements = ol_layers.find("li").toArray().reverse();
    // Re-index the overlayMaps
    li_elements.forEach(function (element) {
        const id = $(element)[0].id.replace("_node", "");
        if (overlayMaps[id]) {
            overlayMaps[id].setZIndex(count);
            count++;
        } else {
            const ensId = id + "ens";
            $("[id^=" + ensId + "]").each(function () {
                overlayMaps[$(this)[0].id].setZIndex(count);
                count++;
            });
        }
    });
}

/**
 * Sets the opacity of a map layer.
 *
 * This function adjusts the opacity of a specific map layer identified by `layer_id`.
 * The opacity value is given as a percentage, and this function converts it to a
 * decimal (between 0 and 1) to be used by the map's layer opacity setting.
 *
 * @param {string} layer_id - The ID of the map layer whose opacity is to be set.
 * @param {number} value - The opacity value as a percentage (0 to 100).
 *
 * Usage:
 * The function converts the percentage `value` to a decimal by dividing by 100, and
 * applies the resulting opacity to the map layer using `setOpacity()`.
 */
function set_layer_opacity(layer_id, value) {
    overlayMaps[layer_id].setOpacity(value / 100);
}

/**
 * Removes all comparison layers from the `overlayMaps` object.
 *
 * This function filters out any layers in `overlayMaps` that have "compare" in their keys.
 * It creates a new `overlayMaps` object by excluding any layers that are related to the
 * comparison process (those with keys containing "compare").
 *
 * Steps:
 * 1. Filter the keys of `overlayMaps` to exclude any key that includes "compare".
 * 2. Rebuild the `overlayMaps` object with only the keys that don't contain "compare".
 * 3. Assign the new object back to `overlayMaps`, effectively removing the comparison layers.
 */
function removeCompareLayers() {
    overlayMaps = Object.keys(overlayMaps).filter(objKey => !objKey.includes("compare")).reduce((newObj, key) => {
        newObj[key] = overlayMaps[key];
        return newObj;
    }, {});
}

/**
 * Clears the comparison layers and variables from the map.
 *
 * This function checks whether each of the comparison layers (`compare_left_dom`, `compare_left_pass`,
 * `compare_right_dom`, and `compare_right_pass`) exist and are currently added to the map.
 * If a layer exists, it is removed from the map. Once all layers are removed, the variables are
 * reset to `null` and the `removeCompareLayers` function is called to finalize the cleanup.
 *
 * Steps:
 * 1. Check and remove each comparison layer from the map if it exists.
 * 2. Set all comparison variables to `null` to reset the state.
 * 3. Call `removeCompareLayers()` to ensure any remaining layers are removed.
 */
function clear_compare_variables() {
    if (compare_left_dom && map.hasLayer(compare_left_dom)) {
        map.removeLayer(compare_left_dom);
    }
    if (compare_left_pass && map.hasLayer(compare_left_pass)) {
        map.removeLayer(compare_left_pass);
    }
    if (compare_right_dom && map.hasLayer(compare_right_dom)) {
        map.removeLayer(compare_right_dom);
    }
    if (compare_right_pass && map.hasLayer(compare_right_pass)) {
        map.removeLayer(compare_right_pass);
    }
    compare_left_dom = null;
    compare_left_pass = null;
    compare_right_dom = null;
    compare_right_pass = null;
    removeCompareLayers();
}


/**
 * Performs the layer comparison between two selected map layers based on the user's input.
 *
 * This function removes any existing comparison control, retrieves the selected layers and their
 * associated times for both the left and right comparison panes, and creates new layers for each side.
 * It then uses Leaflet's `sideBySide` control to visualize the comparison between the two layers.
 *
 * The function also handles cases where the same layer is selected on both sides,
 * applying a "_compare" contrast style to differentiate between them.
 *
 * Steps:
 * 1. Remove any existing comparison control.
 * 2. Fetch layer IDs and comparison dates from the form inputs.
 * 3. Create and configure left and right map layers for comparison.
 * 4. Add the layers to the map with a side-by-side comparison control.
 * 5. Adjust slider settings and map behavior for comparison interaction.
 */
function performComparison() {
    remove_comparison();

    const left_base_id = $("#left_compare_layer").val();
    const right_base_id = $("#right_compare_layer").val();

    let contrast = "";
    if (left_base_id === right_base_id) {
        contrast = "_compare";
    }

    const left_time = $("#left_compare_date").val();
    const right_time = $("#right_compare_date").val();
    const left_string = JSON.stringify(getLayer(left_base_id));
    let hold_left_dom = JSON.parse(left_string);

    hold_left_dom.id = left_base_id + "compare_left_dom";
    hold_left_dom.pane = "left";
    hold_left_dom.time = left_time + "-01-01T00:00:00.000Z";
    hold_left_dom.default_on = "True";

    let hold_right_pass = JSON.parse(left_string);

    hold_right_pass.id = left_base_id + "compare_right_pass";
    hold_right_pass.pane = "right";
    hold_right_pass.time = left_time + "-01-01T00:00:00.000Z";
    hold_right_pass.default_on = "True";

    const right_string = JSON.stringify(getLayer(right_base_id));

    let hold_right_dom = JSON.parse(right_string);
    hold_right_dom.pane = "right";
    hold_right_dom.time = right_time + "-01-01T00:00:00.000Z";
    hold_right_dom.styles = hold_right_dom.styles + contrast;

    hold_right_dom.id = right_base_id + "compare_right_dom";
    hold_right_dom.default_on = "True";

    let hold_left_pass = JSON.parse(right_string);

    hold_left_pass.id = right_base_id + "compare_left_pass";
    hold_left_pass.time = right_time + "-01-01T00:00:00.000Z";

    hold_left_pass.styles = hold_left_pass.styles + contrast;
    hold_left_pass.pane = "left";
    hold_left_pass.default_on = "True";

    createLayer(hold_left_dom);
    createLayer(hold_right_pass);
    createLayer(hold_right_dom);

    compare_left_dom = overlayMaps[left_base_id + "compare_left_dom"];
    compare_left_pass = overlayMaps[right_base_id + "compare_left_pass"];
    compare_right_dom = overlayMaps[right_base_id + "compare_right_dom"];
    compare_right_pass = overlayMaps[left_base_id + "compare_right_pass"];
    compare_control = L.control.sideBySide([compare_left_dom], [compare_right_dom, compare_right_pass]).addTo(map);
    document.getElementsByClassName('leaflet-sbs-range')[0].setAttribute('min', '-0.01');
    document.getElementsByClassName('leaflet-sbs-range')[0].setAttribute('max', '1.01');
    document.getElementsByClassName('leaflet-sbs-range')[0].setAttribute('onmouseover', 'map.dragging.disable()');
    document.getElementsByClassName('leaflet-sbs-range')[0].setAttribute('onmouseout', 'map.dragging.enable()');

    compareControlAdded = true;
}

/**
 * Removes the comparison control from the map if it has been added.
 *
 * This function checks whether the comparison control has been added to the map.
 * If it exists, it clears the comparison variables, removes the comparison control,
 * and updates the state to reflect that the comparison control is no longer active.
 */
function remove_comparison() {
    if (compareControlAdded) {
        clear_compare_variables();
        map.removeControl(compare_control);
        compareControlAdded = false;
    }
}

/**
 * Toggles the visibility of the compare tool and comparison instructions.
 *
 * This function toggles the visibility of the HTML elements with IDs `#compare_tool`
 * and `#compare_instructions` using jQuery's `.toggle()` function.
 * It shows the hidden element and hides the visible one.
 */
function toggle_instructions() {
    $("#compare_tool, #compare_instructions").toggle();
}

/**
 * Initiates the comparison process.
 *
 * This function triggers the comparison operation by calling `performComparison()`.
 * It is typically bound to an event handler when the user selects a comparison option.
 */
function select_compare() {
    performComparison();
}
