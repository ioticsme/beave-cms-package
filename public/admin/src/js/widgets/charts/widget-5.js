"use strict";

// Class definition
var BEAVEChartsWidget5 = function () {
    var chart = {
        self: null,
        rendered: false
    };

    // Private methods
    var initChart = function(chart) {
        var element = document.getElementById("beave_charts_widget_5"); 

        if (!element) {
            return;
        }
        
        var borderColor = BEAVEUtil.getCssVariableValue('--bs-border-dashed-color');
        
        var options = {
            series: [{
                data: [15, 12, 10, 8, 7, 4, 3],
                show: false                                                                              
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                }                             
            },                    
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: true,
                    distributed: true,
                    barHeight: 23                   
                }
            },
            dataLabels: {
                enabled: false                               
            },             
            legend: {
                show: false
            },                               
            colors: ['#3E97FF', '#F1416C', '#50CD89', '#FFC700', '#7239EA', '#50CDCD', '#3F4254'],                                                                      
            xaxis: {
                categories: ['Phones', 'Laptops', 'Headsets', 'Games', 'Keyboardsy', 'Monitors', 'Speakers'],
                labels: {
                    formatter: function (val) {
                      return val + "K"
                    },
                    style: {
                        colors: BEAVEUtil.getCssVariableValue('--bs-gray-400'),
                        fontSize: '14px',
                        fontWeight: '600',
                        align: 'left'                                              
                    }                  
                },
                axisBorder: {
					show: false
				}                         
            },
            yaxis: {
                labels: {                   
                    style: {
                        colors: BEAVEUtil.getCssVariableValue('--bs-gray-800'),
                        fontSize: '14px',
                        fontWeight: '600'                                                                 
                    },
                    offsetY: 2,
                    align: 'left' 
                }              
            },
            grid: {                
                borderColor: borderColor,                
                xaxis: {
                    lines: {
                        show: true
                    }
                },   
                yaxis: {
                    lines: {
                        show: false  
                    }
                },
                strokeDashArray: 4              
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
            initChart(chart);

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
    module.exports = BEAVEChartsWidget5;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEChartsWidget5.init();
});


 