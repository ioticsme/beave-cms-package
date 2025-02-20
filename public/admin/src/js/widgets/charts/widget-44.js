"use strict";

// Class definition
var BEAVEChartsWidget44 = function () {
    var chart = {
        self: null,
        rendered: false
    };

    // Private methods
    var initChart = function() {
        var element = document.getElementById("beave_charts_widget_44");

        if (!element) {
            return;
        }

        var color = element.getAttribute('data-beave-chart-color');
        var height = parseInt(BEAVEUtil.css(element, 'height'));
        var labelColor = BEAVEUtil.getCssVariableValue('--bs-gray-800');
        var strokeColor = BEAVEUtil.getCssVariableValue('--bs-border-dashed-color');
        var baseColor = BEAVEUtil.getCssVariableValue('--bs-' + color);
        var lightColor = BEAVEUtil.getCssVariableValue('--bs-' + color + '-light');

        var options = {
            series: [{
                name: 'Overview',
                data: [20, 37, 22, 45, 20, 50, 25, 57, 40]
            }],
            chart: {
                fontFamily: 'inherit',
                type: 'area',
                height: height,
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                },
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {},
            legend: {
                show: false
            },
            dataLabels: {
                enabled: false
            },
            fill: {
                type: 'solid',
                opacity: 1
            },
            stroke: {
                curve: 'smooth',
                show: true,
                width: 3,
                colors: [baseColor]
            },
            xaxis: {
                categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false
                },
                labels: {
                    show: false,
                    style: {
                        colors: labelColor,
                        fontSize: '12px'
                    }
                },
                crosshairs: {
                    show: false,
                    position: 'front',
                    stroke: {
                        color: strokeColor,
                        width: 1,
                        dashArray: 3
                    }
                },
                tooltip: {
                    enabled: true,
                    formatter: undefined,
                    offsetY: 0,
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                min: 0,
                max: 60,
                labels: {
                    show: false,
                    style: {
                        colors: labelColor,
                        fontSize: '12px'
                    }
                }
            },
            states: {
                normal: {
                    filter: {
                        type: 'none',
                        value: 0
                    }
                },
                hover: {
                    filter: {
                        type: 'none',
                        value: 0
                    }
                },
                active: {
                    allowMultipleDataPointsSelection: false,
                    filter: {
                        type: 'none',
                        value: 0
                    }
                }
            },
            tooltip: {
                style: {
                    fontSize: '12px'
                },
                y: {
                    formatter: function (val) {
                        return val
                    }
                }
            },
            colors: [lightColor],
            markers: {
                colors: lightColor,
                strokeColor: baseColor,
                strokeWidth: 3
            }
        }; 

        chart.self = new ApexCharts(element, options);

        // Set timeout to properly get the parent elements width
        setTimeout(function() {
            chart.self.render();
            chart.rendered = true;
        }, 200); 
    }

    // Public methods
    return {
        init: function () {
            initChart();

            // Update chart on theme mode change
            BEAVEThemeMode.on("beave.thememode.change", function() {                
                if (chart.rendered) {
                    chart.self.destroy();
                }

                initChart();
            });
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVEChartsWidget44;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEChartsWidget44.init();
});
