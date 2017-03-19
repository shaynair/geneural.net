$(document).ready(function() {
    // Get the CSV and create the chart
    $.get('data/data.csv', function(csv) {
        $.getJSON('data/replays.json', function(replays) {
            Highcharts.chart('container', {

                data: {
                    csv: csv
                },

                title: {
                    text: 'Genetic Algorithm (3D Tetris)'
                },

                subtitle: {
                    text: 'Generations vs. Score'
                },

                xAxis: {
                    tickInterval: 1, // one gen.
                    tickWidth: 0,
                    gridLineWidth: 1,
                    labels: {
                        align: 'left',
                        x: 3,
                        y: -3
                    }
                },

                yAxis: [{ // left y axis
                    title: {
                        text: null
                    },
                    labels: {
                        align: 'left',
                        x: 3,
                        y: 16,
                        format: '{value:.,0f}'
                    }
                }],

                legend: {
                    align: 'left',
                    verticalAlign: 'top',
                    y: 20,
                    floating: true,
                    borderWidth: 0
                },

                tooltip: {
                    shared: true,
                    crosshairs: true
                },

                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function(e) {
                                    Tetris.init(replays[this.x - 1].code, false);
                                }
                            }
                        },
                        marker: {
                            lineWidth: 1
                        }
                    }
                },

                series: [{
                    name: 'Turns Lasted'
                }]
            });


            $.get('data/weights.csv', function(weights) {
                Highcharts.chart('container-weights', {

                    data: {
                        csv: weights
                    },

                    title: {
                        text: 'Genetic Algorithm Weights'
                    },

                    subtitle: {
                        text: 'Generations vs. Weights'
                    },

                    xAxis: {
                        tickInterval: 1, // one gen.
                        tickWidth: 0,
                        gridLineWidth: 1,
                        labels: {
                            align: 'left',
                            x: 3,
                            y: -3
                        }
                    },

                    yAxis: [{ // left y axis
                        title: {
                            text: null
                        },
                        labels: {
                            align: 'left',
                            x: 3,
                            y: 16,
                            format: '{value:.,0f}'
                        }
                    }],

                    legend: {
                        align: 'left',
                        verticalAlign: 'top',
                        y: 20,
                        floating: true,
                        borderWidth: 0
                    },

                    tooltip: {
                        shared: true,
                        crosshairs: true
                    },

                    plotOptions: {
                        series: {
                            cursor: 'pointer',
                            point: {
                                events: {
                                    click: function(e) {
                                        Tetris.init(replays[this.x - 1].code, false);
                                    }
                                }
                            },
                            marker: {
                                lineWidth: 1
                            }
                        }
                    },

                    series: [{
                        name: 'Holes (weight)'
                    }, {
                        name: 'Average Height (weight)'
                    }, {
                        name: 'Blocks above Holes (weight)'
                    }, {
                        name: 'Gaps (weight)'
                    }]
                });
            });
        });
    }, 'text');

});