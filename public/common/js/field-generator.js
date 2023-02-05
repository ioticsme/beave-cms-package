// let fieldSchemaJson = [
//     // {
//     //     section: 'General',
//     //     fields: [
//     //         {
//     //             id: 'timestamp',
//     //             type: 'select',
//     //             label: 'Gender',
//     //             name: 'gender',
//     //             position: 0,
//     //             localization: true,
//     //             validation: {
//     //                 required: true,
//     //                 private: false,
//     //             },
//     //             options: [
//     //                 { label: 'Male', value: 'm' },
//     //                 { label: 'Female', value: 'f' },
//     //             ],
//     //         },
//     //     ],
//     // },
// ]
var fieldSchemaJson
var bkupDataJson
const generateField = async () => {
    let htmlData = `<div class="table-responsive">
							<table class="table gs-7 gy-7 gx-7">
								<thead>
									<tr class="fw-semibold fs-6 text-gray-800 border-bottom border-gray-200">
										<th>Name</th>
										<th>Type</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>`
    await _.forEach(fieldSchemaJson, function (group) {
        const currGroup = `<tr><td colspn="3">
        <h3 class="mb-1">${group.section}
        ${
            group.repeater_group
                ? '<span class="badge badge-warning">Repeater</span>'
                : ''
        }
        </h3>
        <a class="btn btn-light btn-xs" data-bs-toggle="modal" data-bs-target="#field_form_modal" data-section="${
            group.section
        }"><i class="fa-solid fa-plus"></i></a>
        <a class="btn btn-light-danger btn-lg field-section-dlt-btn" data-section="${
            group.section
        }"><i class="fa-solid fa-trash-can"></i></a>
        </td></tr>`
        htmlData = `${htmlData} ${currGroup}`
        _.forEach(group.fields, function (field) {
            const currField = `<tr>
            <td>${field.label}</td>
            <td>${field.type}</td>
            <td>
                <a class="btn btn-light-success btn-xs"><i class="fa-solid fa-pencil"></i></a>
                <a class="btn btn-light-danger btn-xs field-dlt-btn" data-section="${group.section}" data-field="${field.label}"><i class="fa-solid fa-trash-can"></i></a>
            </td>
        </tr>`
            htmlData = `${htmlData} ${currField}`
        })
    })
    document.querySelector(
        `.form-field-holder`
    ).innerHTML = `${htmlData} </tbody></table></div>`

    // console.log(fieldSchemaJson)

    dataObjectComparison(bkupDataJson, fieldSchemaJson)

    return true
}

const dataObjectComparison = (bkupDataJson, fieldSchemaJson) => {
    if (_.isEqual(bkupDataJson, fieldSchemaJson)) {
        document.getElementById('schema-save-btn').disabled = true
        // console.log(`Match`)
    } else {
        document.getElementById('schema-save-btn').disabled = false
        // console.log(`Not Match`)
    }
}

document
    .getElementById('field-section-form')
    .addEventListener('submit', async function (e) {
        e.preventDefault()
        const section_name = document.querySelector(
            `#field-section-form #section_name`
        ).value
        if (section_name.length < 2) {
            alert('Need atleast 2 charecters')
            return false
        }
        const repeater_group = document.querySelector(
            `#field-section-form #section_repeater`
        ).checked
        const localisation = document.querySelector(
            `#field-section-form #section_localisation`
        ).checked
        const sectionExist = _.find(fieldSchemaJson, function (d) {
            return (
                _.toLower(d.section).trim() == section_name.toLowerCase().trim()
            )
        })
        if (sectionExist) {
            alert('Section Name Already Exist')
            return false
        }
        fieldSchemaJson.push({
            section: section_name.toUpperCase(),
            repeater_group: repeater_group ? true : false,
            localisation: localisation ? true : false,
            fields: [],
        })

        await generateField()
        document.getElementById('field-section-form').reset()
        $('#field_section_form_modal').modal('hide')
        // document.querySelector('#field_section_form_modal').classList.remove('fade')
    })

document
    .querySelector('.form-field-holder')
    .addEventListener('click', (event) => {
        if (event.target.classList.contains('field-section-dlt-btn')) {
            const sectionName = event.target.getAttribute('data-section')
            _.remove(fieldSchemaJson, (item) => item.section == sectionName)
            generateField()
        } else if (event.target.classList.contains('field-dlt-btn')) {
            const sectionName = event.target.getAttribute('data-section')
            const fieldName = event.target.getAttribute('data-field')

            const index = _.findIndex(fieldSchemaJson, { section: sectionName })
            _.remove(
                fieldSchemaJson[index].fields,
                (field) => field.label == fieldName
            )
            _.set(fieldSchemaJson, [index, 'section'], sectionName)
            generateField()
        }
    })

$('#field_form_modal').on('show.bs.modal', function (e) {
    var section = $(e.relatedTarget).attr('data-section')
    $('#field_form_modal .section_name_field').val(section)
    document
        .querySelectorAll('#field_form_modal .modal-field-sections')
        .forEach((field_section) => {
            // console.log(field_section)
            field_section.classList.add('d-none')
        })
    document
        .querySelector('#field_form_modal #field-list-section')
        .classList.remove('d-none')
})

document.querySelectorAll('#field-list-section .btn').forEach((fieldBtn) => {
    fieldBtn.addEventListener('click', function (e) {
        e.preventDefault()
        const seletFieldType = fieldBtn.getAttribute('data-value')
        document.querySelectorAll('.modal-field-sections').forEach((item) => {
            item.classList.add('d-none')
        })
        document
            .querySelector(`#${seletFieldType}-field-section`)
            .classList.remove('d-none')
    })
})

document.querySelectorAll('.field-form').forEach((fieldForm) => {
    fieldForm.addEventListener('submit', function (e) {
        e.preventDefault()
        // return false
        const selected_section = e.target.section_name_field.value.trim()
        const slected_field_type = e.target.field_type.value.trim()
        const selected_field_name = e.target.field_name.value.trim()
        const selected_field_options =
            e.target.field_options?.value?.trim() || ''
        const options = []
        selected_field_options.split(',').map((option) => {
            if (option.length) {
                const label = option.split('|')[0].trim()
                const value = option.split('|')[1].trim()
                if (label.length) {
                    options.push({ label, value })
                }
            }
        })

        const requestedSection = _.find(fieldSchemaJson, (field) => {
            return (
                field.section.toLowerCase() === selected_section.toLowerCase()
            )
        })

        const existingField = _.find(requestedSection.fields, function (field) {
            return (
                field.label.toLowerCase() === selected_field_name.toLowerCase()
            )
        })
        // console.log(existingField)

        if (existingField) {
            alert(`'${selected_field_name}' Already Exist in '${selected_section}' section`)
            return false
        }

        const newField = {
            id: 'timestamp',
            type: slected_field_type,
            label: selected_field_name,
            name: selected_field_name,
            position: 1,
            localization: true,
            options: options,
            validation: {
                required: e.target.validation_required.checked,
                private: false,
                min_length: e.target.validation_min?.value
                    ? parseInt(e.target.validation_min.value)
                    : undefined,
                max_length: e.target.validation_max?.value
                    ? parseInt(e.target.validation_max.value)
                    : undefined,
            },
        }

        // console.log(newField)
        // return false
        // const fieldSection = _.find(fieldSchemaJson, (field) => {
        //     return (
        //         field.section.toLowerCase() === selected_section.toLowerCase()
        //     )
        // })
        _.set(
            requestedSection,
            'fields',
            requestedSection.fields.concat([newField])
        )
        // console.log(fieldSchemaJson)
        generateField()
        fieldForm.reset()
        $('#field_form_modal').modal('hide')
    })
})

document
    .querySelector('#schema-save-btn')
    .addEventListener('click', function () {
        let route = location.pathname
        let parts = route.split('/')
        // console.log(parts); // Output: ["", "users", "123"]
        let content_type_id = parts[parts.length - 1]
        axios
            .post('/admin/config/content-type/save-fields', {
                id: content_type_id,
                fieldSchemaJson,
            })
            .then(async function (res) {
                // location.reload()
                if (res.status === 200) {
                    bkupDataJson = _.cloneDeep(fieldSchemaJson)
                    generateField()
                }
                // console.log(res)
            })
            .catch(function (error) {
                console.log(error)
            })
    })
