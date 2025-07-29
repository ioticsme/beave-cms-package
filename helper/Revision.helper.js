const { logError } = require('./Logger.helper')

const incrementVersion = (version = '') => {
    if (!version.length) return ''

    const parts = version.split('.').map(Number)
    if (parts[2] < 9) {
        parts[2] += 1 // Increment the patch number
    } else if (parts[1] < 9) {
        parts[1] += 1 // Increment the minor number
        parts[2] = 0 // Reset the patch number
    } else {
        parts[0] += 1 // Increment the major number
        parts[1] = 0 // Reset the minor number
        parts[2] = 0 // Reset the patch number
    }
    return parts.join('.')
}

const getRevisionObject = (content = {}, authUser = {}) => {
    try {
        let latestRevision = content.revisions?.[content.revisions.length - 1]
        let contentToStore = {
            ...content?._doc,
            revisions: [],
        }

        let newRevision = {
            content: contentToStore,
            editor: authUser.admin_id,
            revision_number: incrementVersion(
                latestRevision?.revision_number || '0.0.1'
            ),
        }

        // Add new revision and maintain only the last 6 revisions
        let updatedRevisions = [...(content.revisions || []), newRevision]
        if (updatedRevisions.length > 6) {
            updatedRevisions = updatedRevisions.slice(-6)
        }

        return updatedRevisions || []
    } catch (error) {
        logError(error)
        return {}
    }
}

module.exports = {
    incrementVersion,
    getRevisionObject,
}
