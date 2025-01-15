const Resource = require('resources.js')
// const UserAddressResource = require('./userAddress.resource');

class FieldResource extends Resource {
    toArray() {
        return {
            _id: this.id,
            field_label: this.field_label,
            field_name: this.field_name,
            field_type: this.field_type,
            field_default_val: this.field_default_val,
            field_values: this.field_values,
            position: this.position,
        }
    }
}
class FormResource extends Resource {
    toArray() {
        return {
            _id: this.id,
            type: this.type,
            form_name: this.form_name,
            description: this.description,
            cta_label: this.cta_label,
            form_load_mode: this.form_load_mode,
            tnc: this.tnc,
            fields: FieldResource.collection(this.fields),
        }
    }
}

module.exports = FormResource
