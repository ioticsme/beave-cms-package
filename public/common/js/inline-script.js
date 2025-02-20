/*
    BEGIN::Media Management
*/
const mediaManagementPanel = document.querySelector('#media-management-panel')
if (mediaManagementPanel) {
    const dropZoneDiv = document.querySelector('#beave_dropzonejs_example_1')
    const hasPdfUpload = dropZoneDiv.getAttribute('data-upload-pdf') || false
    // Setting the acceptedFiles for the dropzone
    let acceptedFiles = `.jpeg,.jpg,.png,.gif,.webp`
    // if hasPdfUpload is true then .pdf extension will be added to the acceptedFiles
    if (hasPdfUpload == 'true') {
        acceptedFiles += `,.pdf`
    }
    var myDropzone = new Dropzone('#beave_dropzonejs_example_1', {
        url: '/admin/cms/media/upload', // Set the url for your upload script location
        paramName: 'file', // The name that will be used to transfer the file
        maxFiles: 10,
        maxFilesize: 10, // MB
        addRemoveLinks: true,
        acceptedFiles,
        accept: function (file, done) {
            if (file.name == 'wow.jpg') {
                done("Naha, you don't.")
            } else {
                done()
            }
        },
    })
    // Listen for upload complete event
    myDropzone.on('complete', function (file) {
        // Check if upload was successful
        if (file.status == 'success') {
            console.log('Upload completed successfully!')
            const pageMediaHolderElm =
                document.querySelector('#page-media-holder')
            if (!pageMediaHolderElm) {
                axios
                    .get('/admin/cms/media/json')
                    .then(function (response) {
                        // Handle the successful response
                        var mediaList = `<div class="row">`
                        // console.log(response.data)
                        response.data.forEach((element) => {
                            mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2 p-2 media-list-item" data-name="${
                                element?.file?.name
                            }">
                                <img data-mediaUrl="${element.url}" src="${
                                element.url
                            }?tr=w-150,h-150" data-mediaTitle="${
                                element.meta?.title || ''
                            }" data-altText="${element.meta?.alt_text || ''}"
                                data-localDrive="${
                                    element.meta?.local_drive || ''
                                }"
                                data-link="${element.link_url || ''}"
                                data-openLinkInNewTab="${
                                    element.open_link_in_new_tab || false
                                }"
                                />
                                </div>`
                        })
                        mediaList = `${mediaList}</div>`
                        // e.target.querySelector('#field_id').value =
                        //     e.relatedTarget.getAttribute('id')
                        // console.log(e.relatedTarget.getAttribute('id'))
                        document.getElementById(
                            'modal-media-holder'
                        ).innerHTML = mediaList
                    })
                    .catch(function (error) {
                        // Handle the error
                        console.error(error)
                    })
            } else {
                console.log('ssss')
                location.reload()
            }
        } else {
            console.log('Upload failed: ' + file.status)
        }
    })

    let images = document.querySelectorAll('.lazy')
    new LazyLoad(images)

    let buttons = document.querySelectorAll('.copy-btn')
    var clipboard = new ClipboardJS(buttons)
    clipboard.on('success', function (e) {
        navigator.clipboard.writeText(e.text)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            },
        })
        Toast.fire({ icon: 'success', title: 'URL Copied to clipboard' })
        e.clearSelection()
    })

    // Media searching in media listing page
    $('#search-image-input').on('keyup', function (e) {
        var value = e.target?.value?.toLowerCase()
        if (value) {
            document
                .querySelectorAll('#page-media-holder .media-list-item')
                .forEach(function (item) {
                    let divName = item.getAttribute('data-name')
                    // if search value is not included in the div name then add d-none to the classlist of div
                    if (!divName.includes(value)) {
                        item.classList.add('d-none')
                    } else {
                        item.classList.remove('d-none')
                    }
                })
        } else {
            document
                .querySelectorAll('#page-media-holder .media-list-item')
                .forEach(function (item) {
                    item.classList.remove('d-none')
                })
        }
    })
}

// Media searching in media attach modal
$('#search-image-input-modal').on('keyup', function (e) {
    var value = e.target?.value?.toLowerCase()
    if (value) {
        document
            .querySelectorAll('#modal-media-holder .media-list-item')
            .forEach(function (item) {
                let divName = item.getAttribute('data-name')
                // console.log("item: " + divName)
                // if search value is not included in the div name then add d-none to the classlist of div
                if (!divName.includes(value)) {
                    item.classList.add('d-none')
                } else {
                    item.classList.remove('d-none')
                }
            })
    } else {
        document
            .querySelectorAll('#modal-media-holder .media-list-item')
            .forEach(function (item) {
                item.classList.remove('d-none')
            })
    }
})

var mediaModal = document.getElementById('beave_modal_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('modal-media-holder').innerHTML = 'Loading...'
    document.querySelector('#media-modal-selected-media-url').value = ''
    document.querySelector('#media-modal-selected-media-title').value = ''
    document.querySelector('#media-modal-selected-media-alt').value = ''
    document.querySelector('#media-modal-selected-media-drive').value = ''
    document.querySelector('#media-modal-selected-media-link').value = ''
    document.querySelector(
        '#media-modal-selected-media-link-new-tab'
    ).checked = false
    document.querySelector('#media-modal-selected-preview-img').innerHTML = ''
    axios
        .get('/admin/cms/media/json')
        .then(function (response) {
            // Handle the successful response
            var mediaList = `<div class="row">`
            // console.log(response.data)
            response.data.forEach((element) => {
                mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2 p-2 media-list-item" data-name="${
                    element?.file?.name
                }">
                    <img data-mediaUrl="${element.url}" src="${
                    element.url
                }?tr=w-150,h-150" data-mediaTitle="${
                    element.meta?.title || ''
                }" data-altText="${
                    element.meta?.alt_text || ''
                }" data-localDrive="${
                    element.meta?.local_drive || ''
                }" data-link="${
                    element.link_url || ''
                }" data-openLinkInNewTab="${
                    element.open_link_in_new_tab || false
                }" />
                </div>`
            })
            mediaList = `${mediaList}</div>`
            e.target.querySelector('#field_id').value =
                e.relatedTarget.getAttribute('id')
            // console.log(e.relatedTarget.getAttribute('id'))
            document.getElementById('modal-media-holder').innerHTML = mediaList
        })
        .catch(function (error) {
            // Handle the error
            console.error(error)
        })
})

document
    .querySelector('#modal-media-holder')
    .addEventListener('click', function (event) {
        var mediaUrl = event.target.getAttribute('data-mediaUrl')
        var mediaTitle = event.target.getAttribute('data-mediaTitle')
        var altText = event.target.getAttribute('data-altText')
        var localDrive = event.target.getAttribute('data-localDrive')
        var linkUrl = event.target.getAttribute('data-link')
        var openLinkInNewTab = event.target.getAttribute(
            'data-openLinkInNewTab'
        )
        if (mediaUrl) {
            document.querySelector(
                '#media-modal-selected-preview-img'
            ).innerHTML = `<img src="${mediaUrl}?tr=w-200" />`

            document.querySelector('#media-modal-selected-media-url').value =
                mediaUrl
            document.querySelector('#media-modal-selected-media-title').value =
                mediaTitle
            document.querySelector('#media-modal-selected-media-alt').value =
                altText
            document.querySelector('#media-modal-selected-media-drive').value =
                localDrive
            document.querySelector('#media-modal-selected-media-link').value =
                linkUrl
            document.querySelector(
                '#media-modal-selected-media-link-new-tab'
            ).checked = openLinkInNewTab

            // Do something when a list item is clicked, such as displaying its text content
            // console.log(attachButtonId)
        }
    })

document
    .querySelector('#media-attach-submit-btn')
    .addEventListener('click', function (event) {
        event.preventDefault()
        // alert('kooi')
        var attachButtonId = mediaModal.querySelector('#field_id').value
        var selectedMediaUrl = document.querySelector(
            '#media-modal-selected-media-url'
        ).value
        var selectedMediaTitle = document.querySelector(
            '#media-modal-selected-media-title'
        ).value
        var selectedMediaAltText = document.querySelector(
            '#media-modal-selected-media-alt'
        ).value
        var selectedMediaLocalDrive = document.querySelector(
            '#media-modal-selected-media-drive'
        ).value
        var selectedMediaLink = document.querySelector(
            '#media-modal-selected-media-link'
        ).value
        var selectedMediaOpenLinkInNewTab = document.querySelector(
            '#media-modal-selected-media-link-new-tab'
        ).checked
        if (selectedMediaUrl) {
            $(mediaModal).modal('hide')
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_url_field').value =
                selectedMediaUrl
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_title_field').value =
                selectedMediaTitle
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_alt_text_field').value =
                selectedMediaAltText
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_local_drive_field').value =
                selectedMediaLocalDrive
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_link_url_field').value =
                selectedMediaLink
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector(
                    '.media_open_link_in_new_tab_field'
                ).value = selectedMediaOpenLinkInNewTab
            const imgHolderParent = document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector(`.media_preview`)
            // console.log(imgHolderParent)
            imgHolderParent.querySelector(
                `.preview-holder`
            ).innerHTML = `<img width="150px" src="${selectedMediaUrl}?tr=w-150" />`
            imgHolderParent
                .querySelector(`.image-preview-remove-btn`)
                .classList.remove('d-none')
        }
    })

//
document.addEventListener('click', function (e) {
    if (e.target.matches('.image-preview-remove-btn')) {
        // console.log("Clicked on an element with class 'class-name'")
        e.preventDefault()
        // console.log(e.target)
        e.target.classList.add('d-none')
        e.target.parentElement.parentElement
            .querySelectorAll('input[type="hidden"]')
            .forEach((element) => {
                element.value = ''
            })
        e.target.previousElementSibling.innerHTML = ' '
    }
})
/*
    END::Media Management
*/

// Date field for scheduled publish
const contentStatusSelectField = document.querySelector(
    '#content-status-select'
)
if (contentStatusSelectField) {
    contentStatusSelectField.addEventListener('change', (event) => {
        console.log(event.target.value)
        if (event.target.value == 'scheduled') {
            document
                .querySelector('#cms-schedule-dt-range')
                .classList.remove('d-none')
        } else {
            document
                .querySelector('#cms-schedule-dt-range')
                .classList.add('d-none')
        }
    })
}

$('#cms_publish_start_dt, #cms_publish_end_dt').daterangepicker(
    {
        autoUpdateInput: false,
        singleDatePicker: true,
        showDropdowns: true,
        minYear: 2023,
        maxYear: parseInt(moment().format('YYYY'), 12),
        locale: {
            format: 'YYYY-MM-DD',
        },
    }
    // function (start, end, label) {
    //     // var years = moment().diff(start, 'years')
    //     alert('You are ' + new Date(start) + ' years old!')
    // }
)
$('.cms_publish_dt_fields').on('apply.daterangepicker', function (ev, picker) {
    // console.log(picker)
    $(this).val(picker.startDate.format('YYYY-MM-DD'))
})

const cmsPublishDateClearBtn = document.querySelector(
    '#cms_publish_dt_clear_btn'
)
if (cmsPublishDateClearBtn) {
    cmsPublishDateClearBtn.addEventListener('click', (e) => {
        e.preventDefault()
        // alert('sss')
        document
            .getElementsByClassName('cms_publish_dt_fields')
            .forEach((field) => {
                field.value = ''
            })
    })
}

// ROUTE: /admin/cms/menu
const menuItemAddModal = document.querySelector('#beave_modal_create_item')
if (menuItemAddModal) {
    menuItemAddModal.addEventListener('show.bs.modal', function (e) {
        const sectionId = e.relatedTarget.getAttribute('data-sectionId')
        document.querySelector('#nav-id').value = sectionId
    })
}

document.querySelectorAll('.media-list-item').forEach((eachMediaItem) => {
    eachMediaItem.addEventListener('click', function (e) {
        const targetId = e.target.parentNode.getAttribute('data-id')
        document.querySelectorAll('.active').forEach(function (e) {
            e.classList.remove('active')
        })
        e.target.parentNode.classList.add('active')

        let pdfThumbnailURL = `/cms-static/admin/assets/media/pdf-thumbnail.png`
        axios
            .get(`/admin/cms/media/view/${targetId}`)
            .then(function (response) {
                if (response?.data?.file_type == 'pdf') {
                    document.querySelector(
                        '#media-meta-panel #img-holder #preview-img'
                    ).src = pdfThumbnailURL || ''
                } else {
                    document.querySelector(
                        '#media-meta-panel #img-holder #preview-img'
                    ).src = response.data.url || ''
                }
                document.querySelector(
                    '#media-meta-panel input[name="id"]'
                ).value = response.data._id || ''
                document.querySelector(
                    '#media-meta-panel input[name="title"]'
                ).value = response.data.meta?.title || ''
                document.querySelector(
                    '#media-meta-panel input[name="alt_text"]'
                ).value = response.data.meta?.alt_text || ''
                document.querySelector(
                    '#media-meta-panel input[name="link"]'
                ).value = response.data?.link_url || ''
                document.querySelector(
                    '#media-meta-panel input[name="link_new_tab"]'
                ).checked = response.data?.open_link_in_new_tab
            })
            .catch(function (err) {
                // Handle the error
                console.error(err)
            })
    })
})

// ===== BEGIN:: First Tab active for cms content editor================
document.addEventListener('DOMContentLoaded', function () {
    // Select the first tab link within the ul
    const firstTabLink = document.querySelector('#cms-editor-tab-nav .nav-link')

    // Check if a tab link exists, and add the 'active' class to it
    if (firstTabLink) {
        firstTabLink.classList.add('active')
    }

    // Select the first tab pane and add the 'show active' classes
    const firstTabPane = document.querySelector(
        firstTabLink?.getAttribute('href')
    )
    if (firstTabPane) {
        firstTabPane?.classList.add('show', 'active')
    }
})
// ===== END:: First Tab active for cms content editor================
