"use strict";

// Class definition
var BEAVECardsWidget6 = function () {
    // Private methods
    var initChart = function() {
        var element = document.getElementById("beave_card_widget_6_chart");

        if (!element) {
            return;
        }

        var height = parseInt(BEAVEUtil.css(element, 'height'));
        var labelColor = BEAVEUtil.getCssVariableValue('--bs-gray-500');
        var borderColor = BEAVEUtil.getCssVariableValue('--bs-border-dashed-color');
        var baseColor = BEAVEUtil.getCssVariableValue('--bs-primary');
        var secondaryColor = BEAVEUtil.getCssVariableValue('--bs-gray-300');

        var options = {
            series: [{
                name: 'Sales',
                data: [30, 60, 53, 45, 60, 75, 53]
            }, ],
            chart: {
                fontFamily: 'inherit',
                type: 'bar',
                height: height,
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: ['55%'],
                    borderRadius: 6
                }
            },
            legend: {
                show: false,
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 9,
                colors: ['transparent']
            },
            xaxis: {                
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                    tickPlacement: 'between'
                },
                labels: {
                    show: false,
                    style: {
                        colors: labelColor,
                        fontSize: '12px'
                    }
                },
                crosshairs: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    show: false,
                    style: {
                        colors: labelColor,
                        fontSize: '12px'
                    }
                }
            },
            fill: {
                type: 'solid'
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
                x: {
                    formatter: function (val) {
                        return 'Feb: ' + val;
                    }
                },
                y: {
                    formatter: function (val) {
                        return val + "%" 
                    }
                }
            },
            colors: [baseColor, secondaryColor],
            grid: {
                padding: {
                    left: 10,
                    right: 10
                },
                borderColor: borderColor,
                strokeDashArray: 4,
                yaxis: {
                    lines: {
                        show: true
                    }
                }             
            }
        }; 

        var chart = new ApexCharts(element, options);
        
        // Set timeout to properly get the parent elements width
        setTimeout(function() {
            chart.render();   
        }, 300);     
    }

    // Public methods
    return {
        init: function () {
            initChart();
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVECardsWidget6;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVECardsWidget6.init();
});
   
        
        
        
           