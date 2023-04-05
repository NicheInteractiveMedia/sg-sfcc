'use strict';
var File = require('dw/io/File');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');

function uploadFile(arg) {
    try {
        var shoppingGivesHelper = require('*/cartridge/scripts/helpers/shoppingGivesHelper');
        var awsService = require('*/cartridge/scripts/services/s3FileUploadService').getAWSService(arg);
        var fileDirectory = File.IMPEX + File.SEPARATOR + arg.srcFolder + arg.remotePath;
        var files = shoppingGivesHelper.getFiles(fileDirectory);
        var filesToSend = !empty(files) ? files.toArray() : [];

        Logger.info('Upload-' + arg.remotePath.replace('/', '') + ' File/s Found: ' + filesToSend.length);

        filesToSend.forEach(file => {
            Logger.info('Upload-' + arg.remotePath.replace('/', '') + ' - Processing : {0}', file.getName());
            var response = awsService.call(file);
            if (!empty(response) && response.ok) {
                if (arg.get('deleteFile')) {
                    file.remove();
                    Logger.info('File uploaded successfully and removed - ' + file.path + '');
                } else if (!empty(arg.get('archivePath'))) {
                    new File([File.IMPEX, arg.get('archivePath')].join(File.SEPARATOR)).mkdirs();
                    var fileToMoveTo = new File([File.IMPEX, arg.get('archivePath'), file.name].join(File.SEPARATOR));
                    file.renameTo(fileToMoveTo);
                    Logger.info('File uploaded successfully and archived - ' + fileToMoveTo.getName() + '');
                }
            }
        });
    } catch (ex) {
        Logger.error('(' + ex.fileName + ') -> Error occured while uploading and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
}

module.exports = {
    uploadFile: uploadFile
};
