var processingStatus = {
    unprocessed: 0,
    inProgress: 1,
    processed: 2,
};

var validationStatus = {
    unknown: 0,
    valid: 1,
    invalid :2

};

var ActivationStatus = {
    inactive: 0,
    active: 1,
    };

exports.processingStatus = processingStatus;
exports.validationStatus = validationStatus;
exports.ActivationStatus = ActivationStatus;