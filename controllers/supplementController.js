console.log('Loaded supplementController');
// const openaiService = require('../services/openaiService');
// console.log('Loaded openaiService:', openaiService);

const getSupplementInfo = (req, res) => {
  res.json({ message: 'Supplement info is working!' });
};

module.exports = { getSupplementInfo };