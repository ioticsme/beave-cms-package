const editor = grapesjs.init({
    // Indicate where to init the editor. You can also pass an HTMLElement
    container: '#gjs',
    // Get the content for the canvas directly from the element
    // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
    fromElement: true,
    // Size of the editor
    height: '94vh',
    width: 'auto',
    // Disable the storage manager for the moment
    storageManager: false,
    // Avoid any default panel
    plugins: ['grapesjs-preset-newsletter'],
    pluginsOpts: {
        'grapesjs-preset-newsletter': {
            // options
        },
    },
})

// Create a new panel with a "Save" button
editor.Panels.addButton('options', {
    id: 'save-btn',
    className: 'fa fa-floppy-o',
    command: 'save-template',
    attributes: {
        title: 'Save',
    },
})

// Create a new panel with a "Code Editor" button
editor.Panels.addButton('options', {
    id: 'edit-btn',
    className: 'fa fa-file-code-o',
    command: 'edit-code',
    attributes: {
        title: 'Edit Code',
    },
})

axios
    .get(`/admin/cms/${content_type_slug}/editor/load-data/${pageId}?lang=${lang}`)
    .then(function (response) {
        // console.log(response.data)
        // Store the HTML and CSS in the storage manager
        editor.setComponents(response.data.html)
        editor.setStyle(response.data.css)

        console.log('Document loaded successfully.')
    })
    .catch(function (error) {
        console.error('Failed to load document: ' + error)
    })

// Define the save command
editor.Commands.add('save-template', {
    run: function (editor, sender) {
        // Get the HTML and CSS content from the editor

        var payloads = {
            id: pageId, // Setting from editor html file
            lang: lang, // Setting from editor html file
            html: editor.getHtml(),
            css: editor.getCss(),
        }

        // Send the data to your server to save to your database
        $.post(
            `/admin/cms/${content_type_slug}/editor/save`,
            payloads,
            function (data) {
                console.log(data)
            }
        )
    },
})
// Define the save command
// Add a modal to edit code
editor.Commands.add('edit-code', {
    run: function (editor, sender) {
        sender && sender.set('active', false)

        // Get the current HTML and CSS content from the GrapesJS editor
        const html = editor.getHtml()
        let css = editor.getCss()

        // Format the CSS using js-beautify before setting it in the editor
        css = css_beautify(css, {
            indent_size: 4, // Set the indent size (4 spaces)
            indent_with_tabs: false, // Set to true if you want tabs instead of spaces
        })

        // Create a new modal instance and set the title
        const modal = editor.Modal
        modal.setTitle('Edit Code')

        // Create a container for the modal content
        const container = document.createElement('div')
        container.style.display = 'flex'
        container.style.flexDirection = 'column'
        container.style.gap = '10px'
        container.style.height = '80vh'

        // Create HTML and CSS editor elements (textareas)
        const htmlEditor = document.createElement('textarea')
        const cssEditor = document.createElement('textarea')
        container.appendChild(htmlEditor)
        container.appendChild(cssEditor)

        modal.setContent(container)
        modal.open()

        // Initialize CodeMirror for the HTML editor
        const htmlCm = CodeMirror.fromTextArea(htmlEditor, {
            value: html,
            lineNumbers: true,
            mode: 'xml',
            htmlMode: true,
            theme: 'material',
            lineWrapping: true,
            styleActiveLine: true,
            matchBrackets: true,
            indentWithTabs: true,
            indentUnit: 4,
            smartIndent: true,
            extraKeys: {
                Tab: (cm) => cm.execCommand('indentMore'),
                'Shift-Tab': (cm) => cm.execCommand('indentLess'),
            },
        })

        htmlCm.setValue(html)
        htmlCm.getWrapperElement().style.fontFamily =
            'Consolas, "Fira Code", monospace'
        htmlCm.getWrapperElement().style.height = '300px'
        htmlCm.getWrapperElement().style.background = '#1e1e1e'
        htmlCm.getWrapperElement().style.color = '#d4d4d4'

        // Initialize CodeMirror for the CSS editor, with formatted CSS
        const cssCm = CodeMirror.fromTextArea(cssEditor, {
            value: css, // Set the formatted CSS
            lineNumbers: true,
            mode: 'css',
            theme: 'material',
            lineWrapping: true,
            styleActiveLine: true,
            matchBrackets: true,
            indentWithTabs: true,
            indentUnit: 4,
            smartIndent: true,
            extraKeys: {
                Tab: (cm) => cm.execCommand('indentMore'),
                'Shift-Tab': (cm) => cm.execCommand('indentLess'),
            },
        })

        cssCm.setValue(css)
        cssCm.getWrapperElement().style.fontFamily =
            'Consolas, "Fira Code", monospace'
        cssCm.getWrapperElement().style.height = '300px'
        cssCm.getWrapperElement().style.background = '#1e1e1e'
        cssCm.getWrapperElement().style.color = '#d4d4d4'

        // Create a save button for the modal
        const saveBtn = document.createElement('button')
        saveBtn.innerHTML = 'Update'
        saveBtn.style.padding = '10px 20px'
        saveBtn.style.backgroundColor = '#007acc'
        saveBtn.style.color = 'white'
        saveBtn.style.border = 'none'
        saveBtn.style.borderRadius = '5px'
        saveBtn.style.cursor = 'pointer'

        saveBtn.onclick = () => {
            editor.setComponents(htmlCm.getValue())
            editor.setStyle(cssCm.getValue())
            modal.close()
        }

        modal.getContentEl().appendChild(saveBtn)
    },
})
