const metaFields = [
    {
        name: 'General',
        slug: 'general',
        fields: [
            {
                label: 'Title',
                name: 'title',
                type: 'text',
            },
            {
                label: 'Description',
                name: 'description',
                type: 'textarea',
            },
            {
                label: 'Keywords',
                name: 'keywords',
                type: 'textarea',
            },
            // {
            //     label: 'Viewport',
            //     name: 'viewport',
            //     type: 'text',
            // },
            // {
            //     label: 'Robots',
            //     name: 'robots',
            //     type: 'text',
            // },
            {
                label: 'Canonical',
                name: 'canonical',
                type: 'text',
            },
            // {
            //     label: 'Author',
            //     name: 'author',
            //     type: 'text',
            // },
            // {
            //     label: 'Charset',
            //     name: 'charset',
            //     type: 'text',
            // },
        ],
    },
    {
        name: 'OG',
        slug: 'OG',
        fields: [
            {
                label: 'Title',
                name: 'title',
                type: 'text',
            },
            {
                label: 'Type',
                name: 'type',
                type: 'text',
            },
            {
                label: 'URL',
                name: 'url',
                type: 'text',
            },
            {
                label: 'Image URL',
                name: 'image',
                type: 'text',
            },
            {
                label: 'Description',
                name: 'description',
                type: 'textarea',
            },
        ],
    },
    {
        name: 'Twitter Cards',
        slug: 'tw_cards',
        fields: [
            {
                label: 'Card',
                name: 'card',
                type: 'text',
            },
            {
                label: 'Title',
                name: 'title',
                type: 'text',
            },
            {
                label: 'Description',
                name: 'description',
                type: 'textarea',
            },
            {
                label: 'Image URL',
                name: 'image',
                type: 'text',
            },
        ],
    },
]

module.exports = metaFields
