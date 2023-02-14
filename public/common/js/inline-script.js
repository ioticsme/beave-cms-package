var mediaModal = document.getElementById('kt_modal_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('media-holder').innerHTML = 'Loading...'
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
        var attachButtonId = mediaModal.querySelector('#field_id').value
        // console.log(attachButtonId)
        if (mediaUrl) {
            $(mediaModal).modal('hide')
            // Do something when a list item is clicked, such as displaying its text content
            // console.log(attachButtonId)
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.media_url_field').value =
                mediaUrl
            const imgHolderParent = document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector(`.media_preview`)
            // console.log(imgHolderParent)
            imgHolderParent.querySelector(
                `.preview-holder`
            ).innerHTML = `<img width="150px" src="${event.target.getAttribute(
                'data-mediaUrl'
            )}" />`
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
        e.target.parentElement.parentElement.querySelector(
            'input[type="hidden"]'
        ).value = ''
        e.target.previousElementSibling.innerHTML = ' '
    }
})
