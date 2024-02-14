document.querySelectorAll('.content_wysiwyg').forEach(function (e) {
    ClassicEditor.create(document.querySelector(`#${e.getAttribute('id')}`), {
        simpleUpload: {
            uploadUrl: '/admin/cms/media/ck-editor/upload',
        },
    })
        .then((editor) => {
            // Adjust the width of the wysiwyg element
            editor.ui.element.classList.add(
                'w-100',
                'w-sm-400px',
                'w-md-500px',
                'w-xl-700px',
                'no-tailwindcss-base'
            )

            let latestImageElement
            editor.plugins.get('FileRepository').createUploadAdapter =
                function (loader) {
                    return {
                        upload: async () => {
                            const file = await loader.file
                            const formData = new FormData()
                            formData.append('image', file)

                            const response = await fetch(
                                '/admin/cms/media/ck-editor/upload',
                                {
                                    method: 'POST',
                                    body: formData,
                                }
                            )

                            const data = await response.json()
                            // Set data-id attribute for the latest uploaded image
                            const uniqueId = generateUniqueId()
                            if (latestImageElement) {
                                editor.model.change((writer) => {
                                    writer.setAttributes(
                                        { 'data-id': uniqueId },
                                        latestImageElement
                                    )
                                })
                            }
                            setImageUrl(uniqueId, data.urls?.default)
                            return {
                                default: data.urls?.default,
                            }
                        },
                    }
                }

            // Function to set the image URL in CKEditor based on a unique identifier
            function setImageUrl(uniqueId, imageUrl) {
                const imageElements = Array.from(
                    editor.model.document.getRoot().getChildren()
                ).filter((child) => child.name === 'image')

                const targetImage = imageElements.find(
                    (imageElement) =>
                        imageElement.getAttribute('data-id') === uniqueId
                )

                if (targetImage) {
                    editor.model.change((writer) => {
                        writer.setAttribute('src', imageUrl, targetImage)
                    })
                }
            }

            // Add data-id attribute to each image element
            editor.model.change((writer) => {
                const imageElements = Array.from(
                    editor.model.document.getRoot().getChildren()
                ).filter((child) => child.name === 'imageBlock')
                imageElements.forEach((imageElement, index) => {
                    writer.setAttribute(
                        'data-id',
                        generateUniqueId(),
                        imageElement
                    )
                })
            })

            // Function to generate a unique ID
            function generateUniqueId() {
                return Math.random().toString(36).substr(2, 9)
            }

            // Event listener for when an image is inserted
            editor.model.document.on('change:data', () => {
                const imageElements = Array.from(
                    editor.model.document.getRoot().getChildren()
                ).filter((child) => child.name === 'imageBlock')

                if (imageElements.length > 0) {
                    latestImageElement = imageElements[imageElements.length - 1]
                }
            })
        })
        .catch((error) => {
            console.log(error)
        })
})

function initDatePicker() {
    document.querySelectorAll('.kt_daterangepicker input').forEach((picker) => {
        const options = {
            altFormat: 'd F, Y',
            enableTime: picker.getAttribute('data-hastime') || false,
        }
        options.dateFormat =
            picker.getAttribute('data-hastime') == true ? 'Y-m-d H:i' : 'Y-m-d'
        if (picker.getAttribute('data-daterange') == true) {
            options.mode = picker.getAttribute('data-daterange')
                ? 'range'
                : 'single'
        }
        picker.flatpickr(options)
    })
}

initDatePicker()

// Function for creating new custom field section
var childIndex = 0
function cloneChild(event) {
    childIndex++
    let targetElement = event.target
    let parentId = targetElement.getAttribute('target-id')
    let parentLang = targetElement.getAttribute('target-lang')
    let langPrefix = targetElement.getAttribute('target-lang-prefix')

    let divToClone = document.querySelector(
        `.form-repeater-group-${parentLang}-${langPrefix}`
    )
    let newDiv = divToClone.cloneNode(true)
    newDiv.classList.remove('d-none')
    let newElement = document.getElementById(`${parentId}`).appendChild(newDiv)

    //setting ID for newly created card
    newElement.setAttribute(
        'id',
        `form_repeater_child_${parentLang}-${childIndex * 10000}`
    )

    // Remove values of inputs from newly created div
    document
        .querySelectorAll(
            `#form_repeater_child_${parentLang}-${
                childIndex * 10000
            } .beave-cms-form-field`
        )
        .forEach(function (element) {
            element.value = null
            element.removeAttribute('disabled')
        })

    // Setup media component of newly created div
    if (
        document
            .querySelector(`#${newElement.getAttribute('id')}`)
            .querySelector('.media-uploader-modal-btn')
    ) {
        document
            .querySelector(`#${newElement.getAttribute('id')}`)
            .querySelectorAll('.media-uploader-field')
            .forEach((mediaField) => {
                newMediaButtonId = `beave-media-field-${Math.floor(
                    Math.random() * 1000000000
                )}`
                mediaField
                    .querySelector('.media-uploader-modal-btn')
                    .setAttribute('id', newMediaButtonId)
                mediaField.querySelector(
                    '.media_preview .preview-holder'
                ).innerHTML = ''
                mediaField
                    .querySelector('.media_preview .image-preview-remove-btn')
                    .classList.add('d-none')
            })
    }

    document
        .querySelector(`#${newElement.getAttribute('id')}`)
        .querySelectorAll('input, textarea')
        .forEach((input) => {
            input.value = ''
        })
    document
        .querySelector(`#${newElement.getAttribute('id')}`)
        .querySelectorAll('.invalid-feedback')
        .forEach((errorField) => {
            errorField.classList.remove('d-inline')
            errorField.classList.add('d-none')
            errorField.innerHTML = ''
        })

    initDatePicker()
}

function deleteChild(event) {
    let targetElement = event.target
    let parentDiv = targetElement.parentElement.parentElement.parentElement
    let childDiv = targetElement.parentElement.parentElement
    let parentId = parentDiv.getAttribute('id')
    let childId = childDiv.getAttribute('id')
    if (Number(childId?.split('-')?.[1]) > 1) {
        const parentElement = document.getElementById(parentId)
        const childElement = document.getElementById(childId)
        parentElement.removeChild(childElement)
    }
}
