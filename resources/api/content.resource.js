const Resource = require('resources.js')
// const BannerResource = require('./banner.resource')
// const GalleryResource = require('./gallery.resources')
const ContentFieldResource = require('./contentField.resource')
const { default: collect } = require('collect.js')
// const UserAddressResource = require('./userAddress.resource');

class ContentResource extends Resource {
    toArray() {
        return {
            _id: this._id,
            slug: this.slug,
            type: this.type_slug,
            // type_id: this.type_id,
            author: this.author,
            position: this.position,
            // template_name: this.template_name,
            // published: this.published,
            brand: this.brand,
            country: this.country,
            content: ContentFieldResource.collection(this.fields).reduce(
                (acc, curr) => {
                    return { ...acc, ...curr }
                }
            ),
            // content_test: collect(this.fields).groupBy('group_name'),
            // group_content: this.group_content,
            attached_content: this.attached_content,
            // banner: this.banner ? new BannerResource(this.banner).exec() : undefined,
            // gallery: this.gallery ? new GalleryResource(this.gallery).exec() : undefined,
            // meta: this.meta,
        }
    }
}

module.exports = ContentResource
