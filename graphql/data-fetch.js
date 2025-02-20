const Content = require('../model/Content')

// Function to fetch data from MongoDB
const getContentListFromDB = async (filter = {}) => {
    try {
        const contents = await Content.find(filter).populate({
            path: 'author',
            select: '-password', // Exclude password field
        }) // Fetch content based on filter
        return contents
    } catch (error) {
        throw new Error('Error fetching data from database: ' + error.message)
    }
}

const getContentSingleFromDB = async (id) => {
    try {
        const content = await Content.findOne({
            _id: id,
        }) // Fetch all contents from the database
        return content
    } catch (error) {
        throw new Error('Error fetching data from database: ' + error.message)
    }
}

module.exports = { getContentListFromDB, getContentSingleFromDB }
