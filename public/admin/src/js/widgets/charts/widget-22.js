'use strict'

// Class definition
var BEAVERChartsWidget22 = (function () {
    // Private methods
    var initChart = function (tabSelector, chartSelector, data, initByDefault) {
        var element = document.querySelector(chartSelector)

        if (!element) {
            return
        }

        var height = parseInt(BEAVERUtil.css(element, 'height'))

        var options = {
            series: data,
            chart: {
                fontFamily: 'inherit',
                type: 'donut',
                width: 250,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '50%',
                        labels: {
                            value: {
                                fontSize: '10px',
                            },
                        },
                    },
                },
            },
            colors: [
                BEAVERUtil.getCssVariableValue('--bs-info'),
                BEAVERUtil.getCssVariableValue('--bs-success'),
                BEAVERUtil.getCssVariableValue('--bs-primary'),
                BEAVERUtil.getCssVariableValue('--bs-danger'),
            ],
            stroke: {
                width: 0,
            },
            labels: ['Sales', 'Sales', 'Sales', 'Sales'],
            legend: {
                show: false,
            },
            fill: {
                type: 'false',
            },
        }

        var chart = new ApexCharts(element, options)

        var init = false

        var tab = document.querySelector(tabSelector)

        if (initByDefault === true) {
            chart.render()
            init = true
        }

        tab.addEventListener('shown.bs.tab', function (event) {
            if (init == false) {
                chart.render()
                init = true
            }
        })
    }

    // Public methods
    return {
        init: function () {
            initChart(
                '#beave_chart_widgets_22_tab_1',
                '#beave_chart_widgets_22_chart_1',
                [20, 100, 15, 25],
                true
            )
            initChart(
                '#beave_chart_widgets_22_tab_2',
                '#beave_chart_widgets_22_chart_2',
                [70, 13, 11, 2],
                false
            )
        },
    }
})()

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVERChartsWidget22
}

// On document ready
BEAVERUtil.onDOMContentLoaded(function () {
    BEAVERChartsWidget22.init()
})
