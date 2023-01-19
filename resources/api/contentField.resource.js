const Resource = require('resources.js')

class ContentFieldResource extends Resource {
    toArray() {
        return {
            // field: this.field,
            // value: this.related_model.length ? this.related_model : this.value,
            [this.field]: this.related_model?.length
                ? AttachedMediaResource.collection(this.related_model)
                : this.value,
            // related_model: this.related_model.length ? this.related_model : undefined,
        }
    }
}

class AttachedMediaResource extends Resource {
    toArray() {
        return {
            url: this.url,
            info: this.response,
        }
    }
}

module.exports = ContentFieldResource
