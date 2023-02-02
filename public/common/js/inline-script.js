var mediaModal = document.getElementById('kt_modal_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('media-holder').innerHTML = 'Loading...'
    axios
        .get('/admin/cms/media/json')
        .then(function (response) {
            // Handle the successful response
            var mediaList = `<div class="row">`
            console.log(response.data)
            response.data.forEach((element) => {
                mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2">
                    <img data-mediaUrl="${element.url}" data-mediaId="${element._id}" src="${element.url}" />
                </div>`
            })
            mediaList = `${mediaList}</div>`
            document.getElementById('media-holder').innerHTML = mediaList

            document
                .querySelector('#media-holder')
                .addEventListener('click', function (event) {
                    var mediaId = event.target.getAttribute('data-mediaId')
                    if (mediaId) {
                        $(mediaModal).modal('hide')
                        // Do something when a list item is clicked, such as displaying its text content
                        document.querySelector(
                            `#${e.relatedTarget.getAttribute('data-field')}`
                        ).value = mediaId
                        const imgHolderParent = document.querySelector(
                            `#${e.relatedTarget.getAttribute(
                                'data-field'
                            )}_preview`
                        )
                        console.log(imgHolderParent)
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
        })
        .catch(function (error) {
            // Handle the error
            console.error(error)
        })
})

document.querySelectorAll('.image-preview-remove-btn').forEach((removeBtn) => {
    removeBtn.addEventListener('click', function (e) {
        e.preventDefault()
        e.target.classList.add('d-none')
        e.target.previousElementSibling.innerHTML = ' '
    })
})
