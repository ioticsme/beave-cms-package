var mediaModal = document.getElementById('kt_modal_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('media-holder').innerHTML = 'Loading...'
    document.querySelector('#media-modal-selected-media-url').value = ''
    document.querySelector('#media-modal-selected-media-title').value = ''
    document.querySelector('#media-modal-selected-media-alt').value = ''
    axios
        .get('/admin/cms/media/json')
        .then(function (response) {
            // Handle the successful response
            var mediaList = `<div class="row">`
            // console.log(response.data)
            response.data.forEach((element) => {
                mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2">
                    <img data-mediaUrl="${element.url}" src="${element.url}" />
                </div>`
            })
            mediaList = `${mediaList}</div>`
            e.target.querySelector('#field_id').value =
                e.relatedTarget.getAttribute('id')
            // console.log(e.relatedTarget.getAttribute('id'))
            document.getElementById('media-holder').innerHTML = mediaList
        })
        .catch(function (error) {
            // Handle the error
            console.error(error)
        })
})

document
    .querySelector('#media-holder')
    .addEventListener('click', function (event) {
        var mediaUrl = event.target.getAttribute('data-mediaUrl')
        // console.log(attachButtonId)
        if (mediaUrl) {
            document.querySelector('#media-modal-selected-media-url').value =
                mediaUrl
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
            const imgHolderParent = document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector(`.media_preview`)
            // console.log(imgHolderParent)
            imgHolderParent.querySelector(
                `.preview-holder`
            ).innerHTML = `<img width="150px" src="${selectedMediaUrl}" />`
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
const menuItemAddModal = document.querySelector('#kt_modal_create_item')
if (menuItemAddModal) {
    menuItemAddModal.addEventListener('show.bs.modal', function (e) {
        const sectionId = e.relatedTarget.getAttribute('data-sectionId')
        document.querySelector('#nav-id').value = sectionId
    })
}
