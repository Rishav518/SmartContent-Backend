const dotenv = require('dotenv');
dotenv.config();
const {categories, subcategories} = require('./categories');
module.exports = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  scheduleEnabled: process.env.SCHEDULE_ENABLED,
  scheduleInterval: process.env.SCHEDULE_INTERVAL,
  defaultCategories: categories,
  defaultSubcategories: subcategories,
};