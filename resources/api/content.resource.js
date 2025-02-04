const Resource = require('resources.js')
// const BannerResource = require('./banner.resource')
// const GalleryResource = require('./gallery.resources')
const ContentFieldResource = require('./contentField.resource')
const FormResource = require('./form.resource')
const { default: collect } = require('collect.js')
// const UserAddressResource = require('./userAddress.resource');

class ContentResource extends Resource {
    toArray() {
        return {
            _id: this._id,
            slug: this.slug,
            type: this.type_slug,
            // type_id: this.type_id,
            author: {
                _id: this.author._id,
                name: this.author.name,
                email: this.author.email,
            },
            position: this.position,
            // template_name: this.template_name,
            status: this.status,
            scheduled: this.scheduled_at ? {
                start: this.scheduled_at.start,
                end: this.scheduled_at.end,
            } : undefined,
            // brand: this.brand,
            country: {
                _id: this.country._id,
                name: this.country.name,
                code: this.country.code,
                currency: this.country.currency,
                timezone: this.country.timezone,
            },
            content: this.content,
            // forms: this.form,
            forms: FormResource.collection(this.form),
            // content: collect(this.fields)
            //     .groupBy('group_name')
            //     .map((group) => {
            //         return ContentFieldResource.collection(group).reduce(
            //             (acc, curr) => {
            //                 return { ...acc, ...curr }
            //             }
            //         )
            //     }),
            // content_test: collect(this.fields)
            //     .groupBy('group_name')
            //     .map((group) => {
            //         return ContentFieldResource.collection(group).reduce(
            //             (acc, curr) => {
            //                 return { ...acc, ...curr }
            //             }
            //         )
            //     }),
            // group_content: this.group_content,
            attached_content: this.attached_content,
            meta: this.meta,
            // banner: this.banner ? new BannerResource(this.banner).exec() : undefined,
            // gallery: this.gallery ? new GalleryResource(this.gallery).exec() : undefined,
            // meta: this.meta,
        }
    }
}

module.exports = ContentResource
