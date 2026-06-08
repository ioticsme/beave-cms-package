/*
    BEGIN::Media Management
*/
const mediaManagementPanel = document.querySelector('#media-management-panel')
const pdfThumbnailURL = `/cms-static/common/media/pdf-thumbnail.png`
if (mediaManagementPanel) {
    Dropzone.autoDiscover = false
    const dropZoneDiv = document.querySelector('#beaver_dropzonejs_example_1')
    const hasPdfUpload = dropZoneDiv.getAttribute('data-upload-pdf') || false
    // Setting the acceptedFiles for the dropzone
    let acceptedFiles = `.jpeg,.jpg,.png,.gif,.webp`
    // if hasPdfUpload is true then .pdf extension will be added to the acceptedFiles
    if (hasPdfUpload == 'true') {
        acceptedFiles += `,.pdf`
    }
    let totalFiles = 0
    let uploadedFiles = 0
    var myDropzone = new Dropzone('#beaver_dropzonejs_example_1', {
        url: '/admin/cms/media/upload', // Set the url for your upload script location
        paramName: 'file', // The name that will be used to transfer the file
        maxFiles: 10,
        maxFilesize: 100, // MB
        addRemoveLinks: true,
        uploadMultiple: true, // Upload all files in a single request
        parallelUploads: 10,
        acceptedFiles,
        autoProcessQueue: false, // Prevent auto-upload until cropping is done
        init: function () {
            this.on('addedfile', function () {
                totalFiles++ // Count total files added
            })

            this.on('success', function () {
                uploadedFiles++ // Count successfully uploaded files
            })

            this.on('removedfile', function () {
                totalFiles-- // Reduce count if a file is removed before upload
            })
        },
        accept: function (file, done) {
            if (!file.type.startsWith('image/')) {
                done()
                if (fileQueue.length === 0 && !isCropping) {
                    setTimeout(() => {
                        myDropzone.processQueue()
                    }, 10)
                }
                return
            }

            if (file.isCropped) {
                // If the file is already cropped, allow upload
                done()
            } else {
                // Add to queue for cropping
                fileQueue.push(file)
                if (!isCropping) {
                    processNextFile() // Start cropping
                }
                done() // Prevent upload until cropped
            }
        },
    })

    // File queue and cropping state
    let fileQueue = []
    let isCropping = false

    // Cropper.js variables
    let cropper, selectedFile

    function processNextFile() {
        if (fileQueue.length === 0) {
            isCropping = false
            myDropzone.processQueue() // Start uploading remaining files
            return
        }

        isCropping = true
        selectedFile = fileQueue.shift() // Get the next file

        const reader = new FileReader()
        reader.onload = function (event) {
            // Hide Dropzone and show Cropper UI inside the same modal
            document.getElementById('dropzoneContainer').style.display = 'none'
            document.getElementById('cropperContainer').style.display = 'block'
            document.getElementById('aspect-ratio-buttons').style.display =
                'block'

            document.getElementById('cropImage').src = event.target.result

            if (cropper) cropper.destroy()
            cropper = new Cropper(document.getElementById('cropImage'), {
                aspectRatio: NaN,
                viewMode: 1,
                dragMode: 'move',
                minCropBoxWidth: 50,
                minCropBoxHeight: 50,
            })
        }
        reader.readAsDataURL(selectedFile)
    }

    // Crop and upload
    document
        .getElementById('cropButton')
        .addEventListener('click', function () {
            cropper.getCroppedCanvas().toBlob((blob) => {
                const croppedFile = new File([blob], selectedFile.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                })

                croppedFile.isCropped = true // ✅ Mark file as cropped

                myDropzone.removeFile(selectedFile) // Remove original file
                myDropzone.addFile(croppedFile) // Add cropped file to Dropzone

                // Show Dropzone UI again
                document.getElementById('dropzoneContainer').style.display =
                    'block'
                document.getElementById('cropperContainer').style.display =
                    'none'
                document.getElementById('aspect-ratio-buttons').style.display =
                    'none'

                // ✅ Process next file in queue
                processNextFile()
            })
        })

    // Cancel cropping and go back to Dropzone
    document
        .getElementById('cancelButton')
        .addEventListener('click', function () {
            // Show Dropzone UI again
            document.getElementById('dropzoneContainer').style.display = 'block'
            document.getElementById('cropperContainer').style.display = 'none'
            document.getElementById('aspect-ratio-buttons').style.display =
                'none' // Hide aspect ratio buttons again

            // Prevent the file from being uploaded
            myDropzone.removeFile(selectedFile)

            // ✅ Process next file in queue (without cropping)
            processNextFile()
        })

    // Listen for aspect ratio button clicks
    document.querySelectorAll('.aspect-ratio-btn').forEach((button) => {
        button.addEventListener('click', function () {
            const ratio = this.getAttribute('data-ratio')

            // Update the aspect ratio of Cropper
            if (cropper) {
                cropper.destroy() // Destroy current instance
            }

            cropper = new Cropper(document.getElementById('cropImage'), {
                aspectRatio: ratio === 'NaN' ? NaN : eval(ratio), // Free cropping or fixed ratio
                viewMode: 1,
                dragMode: 'move',
                minCropBoxWidth: 50,
                minCropBoxHeight: 50,
            })
        })
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
                                data-fileType="${element.file_type || ''}"
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
                // Refresh only when all files are uploaded
                if (uploadedFiles === totalFiles) {
                    location.reload()
                }
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

    let currentFilterType = 'all'
    let currentSearchValue = ''

    function filterMediaItems() {
        const items = document.querySelectorAll('#page-media-holder .media-list-item')
        let visibleCount = 0

        items.forEach(function (item) {
            const divName = (item.getAttribute('data-name') || '').toLowerCase()
            const fileType = item.getAttribute('data-file-type') || 'image'

            // Tab filter check
            let matchesTab = false
            if (currentFilterType === 'all') {
                matchesTab = true
            } else {
                matchesTab = (fileType === currentFilterType)
            }

            // Search query check
            let matchesSearch = true
            if (currentSearchValue) {
                matchesSearch = divName.includes(currentSearchValue)
            }

            if (matchesTab && matchesSearch) {
                item.classList.remove('d-none')
                visibleCount++
            } else {
                item.classList.add('d-none')
            }
        })

        // Handle the "No media available" placeholder if everything is hidden
        let noMediaPlaceholder = document.getElementById('no-filtered-media-placeholder')
        if (visibleCount === 0) {
            if (!noMediaPlaceholder) {
                noMediaPlaceholder = document.createElement('div')
                noMediaPlaceholder.id = 'no-filtered-media-placeholder'
                noMediaPlaceholder.className = 'col-12 text-center my-10'
                noMediaPlaceholder.innerHTML = '<h4>No media files found matching the criteria</h4>'
                document.getElementById('page-media-holder').appendChild(noMediaPlaceholder)
            } else {
                noMediaPlaceholder.classList.remove('d-none')
            }
        } else {
            if (noMediaPlaceholder) {
                noMediaPlaceholder.classList.add('d-none')
            }
        }
    }

    // Media searching in media listing page
    $('#search-image-input').on('keyup', function (e) {
        currentSearchValue = e.target?.value?.toLowerCase() || ''
        filterMediaItems()
    })

    // Media type tab filtering
    $('#media-filter-tabs .nav-link').on('click', function (e) {
        e.preventDefault()
        $('#media-filter-tabs .nav-link').removeClass('active')
        $(this).addClass('active')
        currentFilterType = $(this).attr('data-filter') || 'all'
        filterMediaItems()
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

var mediaModal = document.getElementById('beaver_modal_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('modal-media-holder').innerHTML = 'Loading...'
    document.querySelector('#media-modal-selected-media-url').value = ''
    document.querySelector('#media-modal-selected-media-title').value = ''
    document.querySelector('#media-modal-selected-media-alt').value = ''
    document.querySelector('#media-modal-selected-media-drive').value = ''
    document.querySelector('#media-modal-selected-media-link').value = ''
    document.querySelector('#media-modal-selected-media-link-new-tab').checked =
        false
    document.querySelector('#media-modal-selected-preview-img').innerHTML = ''
    axios
        .get('/admin/cms/media/json')
        .then(function (response) {
            // Handle the successful response
            var mediaList = `<div class="row">`
            response.data.forEach((element) => {
                // console.log('element', element)
                let mediaUrl = `${element.url}?tr=w-150,h-150`
                if (element.file_type == 'pdf') {
                    mediaUrl = pdfThumbnailURL
                }
                mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2 p-2 media-list-item" data-name="${
                    element?.file?.name
                }">
                    <img data-mediaUrl="${element.url}" src="${
                        mediaUrl
                    }" data-mediaFileType="${element.file_type}" data-mediaTitle="${
                        element.meta?.title || ''
                    }" data-altText="${
                        element.meta?.alt_text || ''
                    }" data-fileType="${element.file_type}" data-localDrive="${
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
        var fileType = event.target.getAttribute('data-fileType')
        var mediaTitle = event.target.getAttribute('data-mediaTitle')
        var altText = event.target.getAttribute('data-altText')
        var localDrive = event.target.getAttribute('data-localDrive')
        var linkUrl = event.target.getAttribute('data-link')
        var openLinkInNewTab = event.target.getAttribute(
            'data-openLinkInNewTab'
        )
        if (mediaUrl) {
            let thumbnail = mediaUrl
            if (fileType == 'pdf') {
                thumbnail = pdfThumbnailURL
            }
            document.querySelector(
                '#media-modal-selected-preview-img'
            ).innerHTML = `<img src="${thumbnail}?tr=w-200" />`

            document.querySelector('#media-modal-selected-media-url').value =
                mediaUrl
            document.querySelector('#media-modal-selected-media-title').value =
                mediaTitle
            document.querySelector('#media-modal-selected-media-alt').value =
                altText
            document.querySelector(
                '#media-modal-selected-media-file-type'
            ).value = fileType
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
        var selectedMediaFileType = document.querySelector(
            '#media-modal-selected-media-file-type'
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
                .parentElement.querySelector('.media_file_type_field').value =
                selectedMediaFileType
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
            let thumbnail = selectedMediaUrl
            if (selectedMediaFileType == 'pdf') {
                thumbnail = pdfThumbnailURL
            }
            imgHolderParent.querySelector(`.preview-holder`).innerHTML =
                `<img width="150px" src="${thumbnail}?tr=w-150" />`
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
const menuItemAddModal = document.querySelector('#beaver_modal_create_item')
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
                    '#media-meta-panel input[name="file_type"]'
                ).value = response.data?.file_type || ''
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
