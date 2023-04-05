'use strict';
var Site = require('dw/system/Site');
var sitePrefs = Site.current.preferences.custom;

exports.SHG_CONSTANTS = {
    SHG_ENABLED: sitePrefs.shoppingGivesEnabled,
    SHG_ACCESS_KEY_ID: sitePrefs.shoppingGivesS3AccessKey,
    SHG_SECRET_KEY: sitePrefs.shoppingGivesS3SecretKey,
    SHG_BUCKET: sitePrefs.shoppingGivesS3Bucket,
    SHG_REGION: sitePrefs.shoppingGivesS3Region,
    SHG_ORDER_EXPORT_STATUS_TO_EXPORT: sitePrefs.shoppingGivesOrderExportStatusToExport,
    SHG_STORE_ID: sitePrefs.shoppingGivesStoreId,
    SHG_LAST_ORDER_SYNC: sitePrefs.shoppingGivesLastOrderSync,
    SHG_LAST_PRODUCT_SYNC: sitePrefs.shoppingGivesLastProductSync,
    SHG_ASSOCIATED_GROUP_ID: sitePrefs.shoppingGivesProductAssociatedGroupsID,
    SHG_TAGS_ID: sitePrefs.shoppingGivesProductTagsID,
    SHG_ASSOCIATED_GROUP: 'Associated Group',
    SHG_TAGS: 'tags',
    SHG_FILE_FORMAT: '.json',
    SHG_AWS_STORAGE_HEADER: 'REDUCED_REDUNDANCY',
    SHG_SERVICE_S3: 's3',
    SHG_ALGORITHM: 'AWS4-HMAC-SHA256'
};

exports.SHG_SERVICE = {
    S3BUCKET: 'shoppinggives.s3'
};

exports.SGFeedType = {
    ORDER_FEED: 'ORDER_FEED',
    PRODUCT_FEED: 'PRODUCT_FEED'
};

