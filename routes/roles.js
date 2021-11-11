const express = require('express');
const router = express.Router();
const User = require('../models').User;
const Role = require('../models').Role;
const Permission = require('../models').Permission;
const RolePermission = require('../models').RolePermission;
const passport = require('passport');
require('../config/passport')(passport);
const Helper = require('../utils/helper');
const helper = new Helper();

// Create a new Role
router.post('/', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_add').then((rolePerm) => {
        if (!req.body.role_name || !req.body.role_description) {
            res.status(400).send({
                msg: 'Please pass Role name or description.'
            })
        } else {
            Role
                .create({
                    role_name: req.body.role_name,
                    role_description: req.body.role_description
                })
                .then((role) => res.status(201).send(role))
                .catch((error) => {
                    res.status(400).send({
                        success: false,
                        msg: error
                    });
                });
        }
    }).catch((error) => {
        res.status(403).send({
            success: false,
            msg: error
        });
    });
});

// Get List of Roles
router.get('/', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_get_all').then((rolePerm) => {
        console.log(rolePerm);
        Role
            .findAll({
                include: [{
                        model: Permission,
                        as: 'permissions',
                    },
                    {
                        model: User,
                        as: 'users',
                    }
                ]
            })
            .then((roles) => res.status(200).send(roles))
            .catch((error) => {
                res.status(400).send({
                    success: false,
                    msg: error
                });
            });
    }).catch((error) => {
        res.status(403).send({
            success: false,
            msg: error
        });
    });
});

// Get Role by ID
router.get('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_get').then((rolePerm) => {

    }).catch((error) => {
        res.status(403).send(error);
    });
    Role
        .findByPk(
            req.params.id, {
                include: {
                    model: Permission,
                    as: 'permissions',
                }
            }
        )
        .then((roles) => res.status(200).send(roles))
        .catch((error) => {
            res.status(400).send({
                success: false,
                msg: error
            });
        });
});

// Update a Role
router.put('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_update').then((rolePerm) => {
        if (!req.params.id || !req.body.role_name || !req.body.role_description) {
            res.status(400).send({
                msg: 'Please pass Role ID, name or description.'
            })
        } else {
            Role
                .findByPk(req.params.id)
                .then((role) => {
                    Role.update({
                        role_name: req.body.role_name || role.role_name,
                        role_description: req.body.role_description || role.role_description
                    }, {
                        where: {
                            id: req.params.id
                        }
                    }).then(_ => {
                        res.status(200).send({
                            'message': 'Role updated'
                        });
                    }).catch(err => res.status(400).send({
                        success: false,
                        msg: err
                    }));
                })
                .catch((error) => {
                    res.status(400).send({
                        success: false,
                        msg: error
                    });
                });
        }
    }).catch((error) => {
        res.status(403).send({
            success: false,
            msg: error
        });
    });
});

// Delete a Role
router.delete('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_delete').then((rolePerm) => {
        if (!req.params.id) {
            res.status(400).send({
                msg: 'Please pass role ID.'
            })
        } else {
            Role
                .findByPk(req.params.id)
                .then((role) => {
                    if (role) {
                        Role.destroy({
                            where: {
                                id: req.params.id
                            }
                        }).then(_ => {
                            res.status(200).send({
                                'message': 'Role deleted'
                            });
                        }).catch(err => res.status(400).send(err));
                    } else {
                        res.status(404).send({
                            'message': 'Role not found'
                        });
                    }
                })
                .catch((error) => {
                    res.status(400).send({
                        success: false,
                        msg: error
                    });
                });
        }
    }).catch((error) => {
        res.status(403).send({
            success: false,
            msg: error
        });
    });
});

// Add Permissions to Role
router.post('/permissions/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'role_add').then((rolePerm) => {
        if (!req.body.permissions) {
            res.status(400).send({
                msg: 'Please pass permissions.'
            })
        } else {
            Role
                .findByPk(req.params.id)
                .then((role) => {
                    RolePermission.destroy({
                        where: {
                            role_id: role.id
                        }
                    }).then(_ => {
                        JSON.parse(req.body.permissions).forEach(function (item, index) {
                            Permission
                                .findByPk(item)
                                .then(async (perm) => {
                                    await role.addPermissions(perm, {
                                        through: {
                                            selfGranted: false
                                        }
                                    });
                                })
                                .catch((error) => {
                                    res.status(400).send({
                                        success: false,
                                        msg: error
                                    });
                                });
                        });
                        res.status(200).send({
                            'message': 'Permissions added'
                        });
                    }).catch(err => res.status(400).send({
                        success: false,
                        msg: err
                    }));
                })
                .catch((error) => {
                    res.status(400).send({
                        success: false,
                        msg: error
                    });
                });
        }
    }).catch((error) => {
        res.status(403).send({
            success: false,
            msg: error
        });
    });
});

module.exports = router;