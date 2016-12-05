var router = require('express').Router();
var usersService = require('./users.service');
var usersValidator = require('./users.validator');
var errorsMessages = require('../../utils/constants/errors-messages');
var bcrypt = require('bcrypt');

router.get('/', function(req, res, next) {
    usersService.getAll(function(err, rows) {
        if (err) {
            return next(err);
        }

        res.status(200).send(rows);
    });
});

router.get('/:id', function(req, res, next) {
    usersService.getById(req.params.id, function(err, rows) {
        if (err) {
            return next(err);
        }

        res.status(200).send(rows);
    });
});

router.post('/', function(req, res, next) {
    var validationErrors = usersValidator.getValidationErrosDuringRegistration(req);

    if (validationErrors) {
        res.status(400).send(validationErrors);
        return;
    }

    usersService.getByUsername(req.body.username, function(err, rows) {
        if (err) {
            return next(err);
        }

        if (rows.length !== 0) {
            res.status(400).send([{msg: errorsMessages.validationErrors.users.BUSY_USERNAME}]);
            return;
        }

        var newUser = {
            username: req.body.username
        };

        bcrypt.hash(req.body.password, 10, function (err, hash) {
            if (err) {
                next(err);
            }

            newUser.password = hash;

            usersService.add(newUser, function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send({newUserId: result.insertId});
            });
        });
    });
});

router.put('/', function(req, res, next) {
    var validationErrors = usersValidator.getValidationErrorsDuringUpdating(req);

    if (validationErrors) {
        res.status(400).send(validationErrors);
        return;
    }

    usersService.getById(req.body.id, function(err, rows) {
        if (err) {
            return next(err);
        }

        if (rows.length === 0) {
            return next(new Error());
        }

        bcrypt.compare(req.body.oldPassword, rows[0].password, function(err, result) {
            if (!result) {
                res.status(400).send([{msg: errorsMessages.validationErrors.users.INVALID_OLD_PASSWORD}]);
                return;
            }

            usersService.getByUsername(req.body.newUsername, function(err, rows) {
                if (err) {
                    return next(err);
                }

                if (rows.length !== 0 && req.body.newUsername !== req.body.oldUsername) {
                    res.status(400).send([{msg: errorsMessages.validationErrors.users.BUSY_USERNAME}]);
                    return;
                }

                var updatedUser = {
                    username: req.body.newUsername,
                    password: req.body.newPassword
                };

                usersService.update(updatedUser, req.body.id, function(err) {
                    if (err) {
                        return next(err);
                    }

                    res.sendStatus(200);
                });
            });
        });
    });
});

router.delete('/:id', function(req, res, next) {
    usersService.deleteById(req.params.id, function(err) {
        if (err) {
            return next(err);
        }

        res.sendStatus(200);
    });
});

module.exports = router;