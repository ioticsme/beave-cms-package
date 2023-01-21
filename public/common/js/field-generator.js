let jData = [
    // {
    //     section: 'General',
    //     fields: [
    //         {
    //             id: 'timestamp',
    //             type: 'text',
    //             label: 'First name',
    //             name: 'f_name',
    //             position: 0,
    //             localization: true,
    //             validation: {
    //                 required: true,
    //                 private: false,
    //                 max_length: 30,
    //                 min_length: 5,
    //             },
    //         },
    //         {
    //             id: 'timestamp',
    //             type: 'email',
    //             label: 'First Email',
    //             name: 'email',
    //             position: 0,
    //             localization: true,
    //             validation: {
    //                 required: true,
    //                 private: true,
    //                 max_length: 30,
    //                 min_length: 5,
    //             },
    //         },
    //         {
    //             id: 'timestamp',
    //             type: 'select',
    //             label: 'Gender',
    //             name: 'gender',
    //             position: 0,
    //             localization: true,
    //             validation: {
    //                 required: true,
    //                 private: false,
    //             },
    //             options: [
    //                 { label: 'Male', value: 'm' },
    //                 { label: 'Female', value: 'f' },
    //             ],
    //         },
    //     ],
    // },
]

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
    _.forEach(jData, function (group) {
        const currGroup = `<tr><td colspn="3">
        <h3>${group.section}
        <a class="btn btn-light btn-xs" data-bs-toggle="modal" data-bs-target="#field_form_modal" data-section="${group.section}"><i class="fa-solid fa-plus"></i></a>
        <a class="btn btn-light-danger btn-lg"><i class="fa-solid fa-trash-can"></i></a>
        </h3>
        </td></tr>`
        htmlData = `${htmlData} ${currGroup}`
        _.forEach(group.fields, function (field) {
            const currField = `<tr>
            <td>${field.label}</td>
            <td>${field.type}</td>
            <td>
                <a class="btn btn-light-success btn-xs"><i class="fa-solid fa-pencil"></i></a>
                <a class="btn btn-light-danger btn-xs"><i class="fa-solid fa-trash-can"></i></a>
            </td>
        </tr>`
            htmlData = `${htmlData} ${currField}`
        })
    })
    document.querySelector(
        `.form-field-holder`
    ).innerHTML = `${htmlData} </tbody></table></div>`
}

document
    .getElementById('field-section-form')
    .addEventListener('submit', function (e) {
        e.preventDefault()
        const section_name = document.querySelector(
            `#field-section-form #section_name`
        ).value
        if (section_name.length < 2) {
            alert('Need atleast 2 charecters')
            return false
        }
        const section_repeater = document.querySelector(
            `#field-section-form #section_repeater`
        ).checked
        const sectionExist = _.find(jData, function (d) {
            return _.toLower(d.section)  == section_name.toLowerCase()
        })
        if (sectionExist) {
            alert('Section Name Already Exist')
            return false
        }
        jData.push({
            section: section_name,
            repeater: section_repeater ? true : false,
            fields: [],
        })
        console.log(jData)
        generateField()
        document.getElementById('field-section-form').reset()
    })

$('#field_form_modal').on('show.bs.modal', function (e) {
    var section = $(e.relatedTarget).attr('data-section')
    $('#field_form_modal .section_name_field').val(section)
    // console.log(section)
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
        // const section_name = document.querySelector(`#field-form #field_name`).value
        // console.log(section_name)
        // jData.push({
        //     section: section_name,
        // })
        // console.log(jData)
        // generateField()
    })
})

document.querySelectorAll('.field-form').forEach((fieldForm) => {
    fieldForm.addEventListener('submit', function (e) {
        e.preventDefault()
        // const section_name = document.querySelector(`#field-form #field_name`).value
        const selected_section = e.target.section_name_field.value
        // console.log(selected_section)
        const slected_field_type = e.target.field_type.value
        // console.log(slected_field_type)
        const selected_field_name = e.target.field_name.value
        // console.log(selected_field_name)
        const newField = {
            id: 'timestamp',
            type: slected_field_type,
            label: selected_field_name,
            name: selected_field_name,
            position: 1,
            localization: true,
            validation: {
                required: true,
                private: false,
                max_length: 30,
                min_length: 5,
            },
        }
        // console.log(jData)
        const fieldSection = _.find(jData, { section: selected_section })
        _.set(fieldSection, 'fields', fieldSection.fields.concat([newField]))
        // console.log(jData)
        // jData.push({
        // section: section_name,
        // })
        // console.log(jData)
        generateField()
        fieldForm.reset()
    })
})

generateField()
