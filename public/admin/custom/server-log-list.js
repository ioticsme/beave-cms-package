try {
    ;('use strict')

    // Class definition
    var BEAVERDatatablesServerSide = (function () {
        // Shared variables
        var table
        var dt

        // Private functions
        var initDatatable = function () {
            dt = $('#server_logs_datatable').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [],
                orderable: false,
                lengthMenu: [10, 25, 50, 75, 100, 250],
                pageLength: 25,
                ajax: {
                    url: `/admin/logs/server/json`,
                    data: function (d) {
                        const urlParams = new URLSearchParams(
                            window.location.search
                        )
                        d.type = urlParams.get('type') || 'error'
                    },
                },
                columns: [
                    { data: 'timestamp', className: 'min-w-150px' },
                    { data: 'message', className: 'min-w-300px' },
                    {
                        data: null,
                        className: 'text-end min-w-100px',
                        orderable: false,
                    },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            if (!data) return ''
                            if (typeof formatDateWithTimezone === 'function') {
                                return formatDateWithTimezone(new Date(data))
                            }
                            return new Date(data).toLocaleString()
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            return `<code>${data || ''}</code>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            const rawStack = row.stack || row.message || ''
                            const stackStr = String(rawStack)
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#039;')
                            return `<button class="btn btn-sm btn-light-primary" data-bs-toggle="modal" data-value="${stackStr}" data-bs-target="#view_value_modal">View</button>`
                        },
                    },
                ],
            })

            table = dt.$

            dt.on('draw', function (e) {
                if (typeof BEAVERMenu !== 'undefined') {
                    BEAVERMenu.createInstances()
                }
            })
        }

        // Search Datatable
        var handleSearchDatatable = function () {
            const filterSearch = document.querySelector(
                '[data-BEAVER-server-log-filter="search"]'
            )
            if (filterSearch) {
                filterSearch.addEventListener('keyup', function (e) {
                    dt.search(e.target.value).draw()
                })
            }
        }

        // Public methods
        return {
            init: function () {
                initDatatable()
                handleSearchDatatable()
            },
        }
    })()

    // On document ready
    if (typeof BEAVERUtil !== 'undefined' && BEAVERUtil.onDOMContentLoaded) {
        BEAVERUtil.onDOMContentLoaded(function () {
            BEAVERDatatablesServerSide.init()
        })
    } else {
        $(document).ready(function () {
            BEAVERDatatablesServerSide.init()
        })
    }
} catch (error) {
    console.log('ERR', error)
}
