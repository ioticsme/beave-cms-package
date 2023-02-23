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

axios
    .get(`/admin/cms/html-builder/load-data/${pageId}`)
    .then(function (response) {
      // console.log(response.data)
        // Store the HTML and CSS in the storage manager
        editor.setComponents(response.data.content.html)
        editor.setStyle(response.data.content.css)

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
            html: editor.getHtml(),
            css: editor.getCss(),
        }

        // Send the data to your server to save to your database
        $.post(
            '/admin/cms/html-builder/save-template',
            payloads,
            function (data) {
                console.log(data)
            }
        )
    },
})
