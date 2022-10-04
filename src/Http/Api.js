const { default: Axios } = require('axios');

module.exports = { 
    post: async (url, data = {}, config = {}) => { 
        return Axios.post(url, data, config);
    }
}
