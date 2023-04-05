'use strict';

var ArrayList = require('dw/util/ArrayList');
var Calendar = require('dw/util/Calendar');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var ProductMgr = require('dw/catalog/ProductMgr');
var Order = require('dw/order/Order');
var shoppingGivesConstant = require('*/cartridge/scripts/util/shoppingGivesConstant');
var SGFeedType = shoppingGivesConstant.SGFeedType;
var StringUtils = require('dw/util/StringUtils');

function buildProductQuery(isDelta) {
    var productSearch;
    try {
        var catalog = CatalogMgr.getSiteCatalog();
        Logger.info('Starting product search...');
        productSearch = ProductMgr.queryProductsInCatalog(catalog);
        if (isDelta) {
            var allProducts = new ArrayList(productSearch).toArray();
            var lastSyncDate = shoppingGivesConstant.SHG_CONSTANTS.SHG_LAST_PRODUCT_SYNC;
            var filteredProducts = allProducts.filter(function (product) {
                return product.getCreationDate() >= lastSyncDate || product.getLastModified() >= lastSyncDate;
            });
            var productList = new ArrayList(filteredProducts);
            Logger.info('shoppingGivesHelper-buildProductQuery -> Total Products Found: {0}', productList.getLength());
            productSearch = productList.iterator();
        } else {
            Logger.info('shoppingGivesHelper-buildProductQuery -> Total Products Found: {0}', productSearch.count);
        }
    } catch (ex) {
        Logger.error('(shoppingGivesHelper-buildProductQuery) -> Error occured while bulding the product query and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return productSearch;
}

function buildOrderQuery(isDelta) {
    var query = '';
    var queryParams = [];
    var sortString = 'orderNo ASC';
    try {
        var orderStatus = shoppingGivesConstant.SHG_CONSTANTS.SHG_ORDER_EXPORT_STATUS_TO_EXPORT;
        if (!empty(orderStatus) && orderStatus.length > 0) {
            orderStatus = new ArrayList(orderStatus).toArray();
            orderStatus.forEach(function (status, index) {
                if (empty(query)) {
                    query += '(exportStatus = {' + index + '}';
                } else {
                    query += ' OR exportStatus = {' + index + '}';
                }
                queryParams.push(Order[orderStatus[index]]);
            });
            query += ')';
        }
        if (isDelta) {
            query = query + " AND (creationDate >= {" + queryParams.length + "})";
            queryParams.push(shoppingGivesConstant.SHG_CONSTANTS.SHG_LAST_ORDER_SYNC);
        }
    } catch (ex) {
        Logger.error('(shoppingGivesHelper-buildOrderQuery) -> Error occured while bulding the order query and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return {
        query: query,
        queryParams: queryParams,
        sortString: sortString
    };
}

/**
 * For getting current date for filename
 *
 * @returns {string} current date - current date
 */
function getFormattedDate() {
    var calendar = new Calendar();
    var currentDate = StringUtils.formatCalendar(calendar, "yyyy-MM-dd't'HHmmss");
    return currentDate;
}

/**
 * Computes Shopping gives feedfile name
 *
 * @param {string} feedType - feedType
 * @returns {string} filename - feed file name
 */
function getFeedFileName(feedType) {
    return shoppingGivesConstant.SHG_CONSTANTS.SHG_STORE_ID + '-' + getFormattedDate() + shoppingGivesConstant.SHG_CONSTANTS.SHG_FILE_FORMAT;
}

/**
 * Creates Feed File in a IMPEX directory and returns a FileWriter.
 *
 * @param {string} feedType - feedType
 * @param {string} sourcePath - sourcePath
 * @returns {FileWriter} filewriter - filewriter
 */
function createFeedFile(feedType, sourcePath) {
    var workingPath = File.IMPEX + sourcePath;
    var fileName = getFeedFileName(feedType);
    var fileDirectory = new File(workingPath);
    var file = new File(workingPath + fileName);
    if (!file.exists()) {
        fileDirectory.mkdirs();
        return new File(workingPath + fileName);
    }
    return file;
}

/**
 * Creates Order Feed File in a IMPEX directory.
 *
 * @param {string} sourcePath -- source path
 * @returns {FileWriter} filewriter - filewriter
 */
function createOrderFeedFile(sourcePath) {
    return createFeedFile(SGFeedType.ORDER_FEED, sourcePath);
}
/**
 * Creates Feed File in a IMPEX directory.
 * @param {string} sourcePath - sourcePath
 * @returns {FileWriter} filewriter - filewriter
 */

function createProductFeedFile(sourcePath) {
    return createFeedFile(SGFeedType.PRODUCT_FEED, sourcePath);
}

/**
 * Loads files from a given directory
 * Non recursive.
 * Throws Exception if directory does not exist.
 *
 * @param {string} directoryPath (Absolute) Directory path to load from
 * @returns {Array} Array
 */
function getFiles(directoryPath) {
    var directory = new File(directoryPath);

    // We only want existing directories
    if (!directory.isDirectory()) {
        throw new Error('Source folder does not exist.');
    }

    var files = directory.listFiles(function (file) {
        return file.fullPath.indexOf('archive') === -1;
    });
    return files;
}

module.exports = {
    buildOrderQuery: buildOrderQuery,
    createOrderFeedFile: createOrderFeedFile,
    createProductFeedFile: createProductFeedFile,
    buildProductQuery: buildProductQuery,
    getFiles: getFiles,
    getFormattedDate: getFormattedDate
};
