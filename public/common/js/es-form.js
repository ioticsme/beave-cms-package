document.addEventListener('DOMContentLoaded', function () {
    toastr.options = {
        closeButton: true,
        newestOnTop: false,
        progressBar: true,
        positionClass: 'toastr-bottom-right',
        preventDuplicates: false,
        onclick: null,
        showDuration: '300',
        hideDuration: '1000',
        timeOut: '5000',
        extendedTimeOut: '1000',
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut',
    }
    document.querySelectorAll('.es-form').forEach(function (eachForm) {
        var formId = eachForm.getAttribute('id')
        if (!formId) {
            var newId = 'io_' + Math.random().toString(36).substring(2, 7)
            eachForm.id = newId
        }
    })

    function showErrors(result, formId) {
        console.log(result)
        // if (result._original) {
        //     console.log('from joi')
        // } else {
        //     console.log('from mongo')
        // }
        if (result.details) {
            // If response is from Joi validation
            toastr.error('Validation Error..!')
            if (result._original) {
                // Looping through each validation error response
                for (const index in result.details) {
                    // console.log(result.details[index].path)
                    let field_key = result.details[index].path[0]
                    let field_error_message_id = result.details[index].path[0]
                    const path_length = result.details[index].path.length
                    if (path_length > 1) {
                        result.details[index].path.forEach((key, index) => {
                            if (index != 0) {
                                field_key = `${field_key}[${key}]`
                                field_error_message_id = `${field_error_message_id}_${key}`
                            }
                        })
                    }

                    // console.log(field_key)
                    console.log(field_error_message_id)

                    if (
                        document.querySelector(
                            `#${formId} [name="${field_key}"]`
                        )
                    ) {
                        document
                            .querySelector(`#${formId} [name="${field_key}"`)
                            .classList.add('is-invalid')
                    }

                    if (
                        document.querySelector(
                            `#${formId} [id="field-error-${field_error_message_id}"]`
                        )
                    ) {
                        document
                            .querySelector(
                                `#${formId} [id="field-error-${field_error_message_id}"]`
                            )
                            .classList.add('d-inline')
                        document
                            .querySelector(
                                `#${formId} [id="field-error-${field_error_message_id}"]`
                            )
                            .classList.remove('d-none')
                        document.querySelector(
                            `#${formId} [id="field-error-${field_error_message_id}"]`
                        ).innerHTML = result.details[index].message
                    }
                }
            }
            // if response from mongoose validation
            else {
                for (const index in result.details) {
                    // console.log(result.details[index].properties.path)
                    const errorFieldPath =
                        result.details[index]?.properties?.path?.split('.')
                    let field_key = errorFieldPath?.[0]
                    let field_error_message_id = errorFieldPath?.[0]
                    if (errorFieldPath?.length > 1) {
                        errorFieldPath.forEach((key, index) => {
                            if (index != 0) {
                                field_key = `${field_key}[${key}]`
                                field_error_message_id = `${field_error_message_id}_${key}`
                            }
                        })
                    }

                    // console.log(field_key)
                    // console.log(field_error_message_id)

                    if (
                        document.querySelector(
                            `#${formId} [name="${field_key}"]`
                        )
                    ) {
                        document
                            .querySelector(`#${formId} [name="${field_key}"`)
                            .classList.add('is-invalid')
                    }

                    if (
                        document.querySelector(
                            `#${formId} [id="field-error-${field_error_message_id}"]`
                        )
                    ) {
                        document
                            .querySelector(
                                `#${formId} [id="field-error-${field_error_message_id}"]`
                            )
                            .classList.add('d-inline')
                        document
                            .querySelector(
                                `#${formId} [id="field-error-${field_error_message_id}"]`
                            )
                            .classList.remove('d-none')
                        document.querySelector(
                            `#${formId} [id="field-error-${field_error_message_id}"]`
                        ).innerHTML = result.details[index].properties.message
                    }
                }
            }

            // Check Page has tab nav
            const hasNavTabs = document.querySelectorAll('.nav-tabs')
            if (hasNavTabs) {
                document
                    .querySelectorAll('.tab-pane')
                    .forEach(function (tabPane) {
                        // console.log(tabPane.getAttribute('id'))
                        const invalidSpanLen = tabPane.querySelectorAll(
                            '.invalid-feedback.d-inline'
                        ).length
                        // console.log(invalidSpanLen)
                        if (invalidSpanLen) {
                            const tabElm = document.querySelector(
                                `a[href="#${tabPane.getAttribute('id')}"]`
                            )
                            if (tabElm.querySelector('.tab-invalid-icon')) {
                                tabElm
                                    .querySelector('.tab-invalid-icon')
                                    .classList.remove('d-none')
                            }
                        }
                    })
            }
        }
    }

    async function formSave(
        form,
        url,
        pageRefresh,
        callback,
        disableResetForm = false
    ) {
        form.querySelectorAll('.invalid-feedback').forEach(function (
            invalidFieldMessage
        ) {
            // console.log(invalidFieldMessage)
            invalidFieldMessage.innerHtml = ''
            invalidFieldMessage.classList.remove('d-inline')
            invalidFieldMessage.classList.add('d-none')
        })
        form.querySelectorAll('.is-invalid').forEach(function (invalidField) {
            invalidField.classList.remove('is-invalid')
        })
        form.querySelectorAll('.tab-invalid-icon').forEach(function (
            invalidTabIcon
        ) {
            invalidTabIcon.classList.add('d-none')
        })

        if (form.querySelector('#slug_field')) {
            form.querySelector('#slug_field').disabled = false
        }

        // Converting the form data to JSON for validation purpose
        let sendData = FormDataJson.toJson(
            document.querySelector(`#${form.getAttribute('id')}`)
        )

        let formData = new FormData()
        let images = {}
        let options = {}

        document
            .querySelectorAll(`#${form.getAttribute('id')} input[type=file]`)
            .forEach((e, i) => {
                // If file is empty creating the field with field name and lang
                if (e?.name && !e?.files.length) {
                    let name = e.name.split('.')[0]
                    let lang = e.name.split('.')[1]
                    if (lang) {
                        formData.append(`${name}[${lang}]`, '')
                        images[name] = { ...images[name] }
                    } else {
                        formData.append(`${name}`, '')
                        images[name] = { ...images[name] }
                    }
                }
                // If file is present then appending the file to form data
                if (e?.files.length) {
                    let name = e.name.split('.')[0]
                    let lang = e.name.split('.')[1]
                    if (lang) {
                        // Appending the image
                        formData.append(`${name}.${lang}`, e.files[0])
                        // Appending the image field for validation purpose
                        formData.append(
                            `${name}[${lang}]`,
                            e.files[0] ? e.files[0].name : 'image_name'
                        )
                        images[name] = { ...images[name], [lang]: e.files[0] }
                    } else {
                        // Appending the image
                        formData.append(`${name}`, e.files[0])
                        // Appending the image field for validation purpose
                        formData.append(
                            `${name}`,
                            e.files[0] ? e.files[0].name : 'image_name'
                        )
                        images[name] = { ...images, [lang]: e.files[0] }
                    }
                }
            })
        // console.log(sendData)
        // console.log(images)
        if (Object.keys(images)?.length > 0) {
            // Creating form data with json
            for (let key in sendData) {
                if (typeof sendData[key] == 'object') {
                    for (let nestedKey in sendData[key]) {
                        if (typeof sendData[key][nestedKey] == 'object') {
                            for (let nestedNestedKey in sendData[key][
                                nestedKey
                            ]) {
                                formData.append(
                                    `${key}[${nestedKey}][${nestedNestedKey}]`,
                                    sendData[key][nestedKey][nestedNestedKey]
                                )
                            }
                        } else {
                            formData.append(
                                `${key}[${nestedKey}]`,
                                sendData[key][nestedKey]
                            )
                        }
                    }
                } else {
                    formData.append(key, sendData[key])
                }
            }
            // Fetch options
            options = {
                method: 'POST',
                body: formData,
            }
        } else {
            // Fetch options
            options = {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendData),
            }
        }
        fetch(url, options)
            .then(async (res) => {
                var resStatus = res.status
                var data = await res.json()
                if (resStatus >= 200 && resStatus < 300) {
                    if (!disableResetForm) {
                        document.getElementById(form.getAttribute('id')).reset()
                    }
                    // Swal.fire({
                    //     text: data?.message || 'success',
                    //     icon: 'success',
                    //     buttonsStyling: !1,
                    //     confirmButtonText: 'Ok, got it!',
                    //     customClass: { confirmButton: 'btn btn-primary' },
                    // }).then(function (t) {
                    //     if (t.isConfirmed) {
                    //         var i = form.getAttribute('data-redirect-url')
                    //         i && (location.href = i)
                    //     }
                    // })
                    // console.log(callback)
                    if (data.redirect_to) {
                        window.location.href = data.redirect_to
                    } else {
                        if (callback) {
                            // console.log('callback called')
                            window.location.href = callback
                        } else if (pageRefresh) {
                            location.reload()
                        } else {
                            toastr.success(data?.message || 'Success')
                        }
                    }
                } else if (resStatus == 422) {
                    showErrors(data, form.getAttribute('id'))
                } else if (resStatus == 401) {
                    console.log(data?.error || 'Invalid credentials')
                    toastr.error(data?.error || 'Invalid credentials')
                } else {
                    console.log(data?.error || 'Something went wrong')
                    toastr.error(data?.error || 'Something went wrong')
                }
                if (form.querySelector('#slug_field')) {
                    form.querySelector('#slug_field').disabled = true
                }
                form.querySelector('.form-submit-btn').disabled = false
                form.querySelector('.form-submit-btn .label').classList.remove(
                    'd-none'
                )
                form.querySelector('.form-submit-btn .preloader').classList.add(
                    'd-none'
                )
            })
            .catch((err) => {
                if (form.querySelector('#slug_field')) {
                    form.querySelector('#slug_field').disabled = true
                }
                form.querySelector('.form-submit-btn').disabled = false
                form.querySelector('.form-submit-btn .label').classList.remove(
                    'd-none'
                )
                form.querySelector('.form-submit-btn .preloader').classList.add(
                    'd-none'
                )
                toastr.error('Something went wrong')
                console.log(err)
            })
    }

    document.querySelectorAll('.es-form').forEach(function (sourceForm) {
        sourceForm.addEventListener('submit', function (e) {
            // console.log(sourceForm.getAttribute('id'))
            e.preventDefault()
            sourceForm.querySelector('.form-submit-btn').disabled = true
            sourceForm
                .querySelector('.form-submit-btn .label')
                .classList.add('d-none')
            sourceForm
                .querySelector('.form-submit-btn .preloader')
                .classList.remove('d-none')
            var form = document.querySelector(
                '#' + sourceForm.getAttribute('id')
            )
            var url = form.action
            var disableResetForm =
                form.getAttribute('data-disable-reset') || false
            var pageRefresh = form.getAttribute('data-success-refresh') || false
            var callback = form.getAttribute('data-redirect-url')
                ? form.getAttribute('data-redirect-url')
                : false
            // console.log({ form, url, pageRefresh, callback, resetForm })
            formSave(form, url, pageRefresh, callback, disableResetForm)
        })
    })
})
