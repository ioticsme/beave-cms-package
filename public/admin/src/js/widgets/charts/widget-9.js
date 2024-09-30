"use strict";

// Class definition
var BEAVEChartsWidget9 = function () {
    var chart = {
        self: null,
        rendered: false
    };

    // Private methods
    var initChart = function() {
        var element = document.getElementById("beave_charts_widget_9");

        if (!element) {
            return;
        }

        var height = parseInt(BEAVEUtil.css(element, 'height'));
        var labelColor = BEAVEUtil.getCssVariableValue('--bs-gray-400');
        var borderColor = BEAVEUtil.getCssVariableValue('--bs-border-dashed-color');    

        var baseColor = BEAVEUtil.getCssVariableValue('--bs-gray-200');
        var secondaryColor = BEAVEUtil.getCssVariableValue('--bs-primary');


        var options = {
            series: [{
                name: 'Order',
                data: [21, 21, 26, 26, 31, 31, 27]
            }, {
                name: 'Revenue',
                data: [12, 16, 16, 21, 21, 18, 18]
            }],
            chart: {
                fontFamily: 'inherit',
                type: 'area',
                height: height,
                toolbar: {
                    show: false
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
                colors: [baseColor]
            },
            xaxis: {
                categories: ['', '06 Sep', '13 Sep', '20 Sep', '27 Sep', '30 Sep', ''],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false
                },
                labels: {
                    style: {
                        colors: labelColor,
                        fontSize: '12px'
                    }
                },
                crosshairs: {
                    position: 'front',
                    stroke: {
                        color: labelColor,
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
                labels: {
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
                        return "$" + val + " thousands"
                    }
                }
            },
            crosshairs: {
                show: true,
                position: 'front',
                stroke: {
                    color: BEAVEUtil.getCssVariableValue('--bs-border-dashed-color'),
                    width: 1,
                    dashArray: 0,
                },
            },
            colors: [baseColor, secondaryColor],
            grid: {
                borderColor: borderColor,
                strokeDashArray: 4,
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            markers: {
                colors: [baseColor, secondaryColor],
                strokeColor: [BEAVEUtil.getCssVariableValue('--bs-primary'), BEAVEUtil.getCssVariableValue('--bs-gray-300')],
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

                initChart(chart);
            });
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVEChartsWidget9;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEChartsWidget9.init();
});


 