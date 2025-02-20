"use strict";

// Class definition
var BEAVEChartsWidget38 = function () {
    var chart = {
        self: null,
        rendered: false
    };

    // Private methods
    var initChart = function() {
        var element = document.getElementById("beave_charts_widget_38_chart");

        if (!element) {
            return;
        }
        
        var height = parseInt(BEAVEUtil.css(element, 'height'));
        var labelColor = BEAVEUtil.getCssVariableValue('--bs-gray-900');
        var borderColor = BEAVEUtil.getCssVariableValue('--bs-border-dashed-color');    

        var options = {
            series: [{
                name: 'LOI Issued',
                data: [54, 42, 75, 110, 23, 87, 50]
            }],
            chart: {
                fontFamily: 'inherit',
                type: 'bar',
                height: height,
                toolbar: {
                    show: false
                }              
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: ['28%'],
                    borderRadius: 5,                     
                    dataLabels: {
                        position: "top" // top, center, bottom
                    },
                    startingShape: 'flat'
                },
            },
            legend: {
                show: false
            },
            dataLabels: {
                enabled: true, 
                offsetY: -28,                                             
                style: {
                    fontSize: '13px',
                    colors: [labelColor]
                },
                    formatter: function(val) {
                        return val;// + "H";
                    }                           
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: ['E2E', 'IMC', 'SSMC', 'SSBD', 'ICCD', 'PAN', 'SBN'],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false
                },
                labels: {
                    style: {
                        colors: BEAVEUtil.getCssVariableValue('--bs-gray-500'),
                        fontSize: '13px'
                    }                  
                },
                crosshairs: {
                    fill: {         
                        gradient: {         
                            opacityFrom: 0,
                            opacityTo: 0
                        }
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: BEAVEUtil.getCssVariableValue('--bs-gray-500'),
                        fontSize: '13px'
                    },
                    formatter: function(val) {
                        return val + "M";
                    } 
                }
            },
            fill: {
                opacity: 1
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
                        return  + val + 'M' 
                    }
                } 
            },
            colors: [BEAVEUtil.getCssVariableValue('--bs-primary'), BEAVEUtil.getCssVariableValue('--bs-primary-light')],
            grid: {
                borderColor: borderColor,
                strokeDashArray: 4,
                yaxis: {
                    lines: {
                        show: true
                    }
                }
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
    module.exports = BEAVEChartsWidget38;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEChartsWidget38.init();
});


 