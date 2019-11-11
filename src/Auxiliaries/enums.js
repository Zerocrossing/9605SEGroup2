var processingStatus = {
    unprocessed: 0,
    inProgress: 1,
    processed: 2,
};

var validationStatus = {
    unknown: 0,
    valid: 1,
    //invalid files will be removed from database

};

exports.processingStatus = processingStatus;
exports.validationStatus = validationStatus;