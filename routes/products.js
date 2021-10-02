const express = require('express');
const router = express.Router();
const Product = require('../models').Product;
const passport = require('passport');
require('../config/passport')(passport);
const Helper = require('../utils/helper');
const helper = new Helper();

// Create a new Product
router.post('/', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_add').then((rolePerm) => {
        if (!req.body.prod_name || !req.body.prod_description || !req.body.prod_image || !req.body.prod_price) {
            res.status(400).send({
                msg: 'Please pass Product name, description, image or price.'
            })
        } else {
            Product
                .create({
                    prod_name: req.body.prod_name,
                    prod_description: req.body.prod_description,
                    prod_image: req.body.prod_image,
                    prod_price: req.body.prod_price
                })
                .then((product) => res.status(201).send(product))
                .catch((error) => {
                    console.log(error);
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
});

// Get List of Products
router.get('/', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_get_all').then((rolePerm) => {
        Product
            .findAll()
            .then((products) => res.status(200).send(products))
            .catch((error) => {
                res.status(400).send(error);
            });
    }).catch((error) => {
        res.status(403).send(error);
    });
});

// Get Product by ID
router.get('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_get').then((rolePerm) => {
        Product
            .findByPk(req.params.id)
            .then((product) => res.status(200).send(product))
            .catch((error) => {
                res.status(400).send(error);
            });
    }).catch((error) => {
        res.status(403).send(error);
    });
});

// Update a Product
router.put('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_update').then((rolePerm) => {
        if (!req.body.prod_name || !req.body.prod_description || !req.body.prod_image || !req.body.prod_price) {
            res.status(400).send({
                msg: 'Please pass Product name, description, image or price.'
            })
        } else {
            Product
                .findByPk(req.params.id)
                .then((product) => {
                    Product.update({
                        prod_name: req.body.prod_name || user.prod_name,
                        prod_description: req.body.prod_description || user.prod_description,
                        prod_image: req.body.prod_image || user.prod_image,
                        prod_price: req.body.prod_price || user.prod_price
                    }, {
                        where: {
                            id: req.params.id
                        }
                    }).then(_ => {
                        res.status(200).send({
                            'message': 'Product updated'
                        });
                    }).catch(err => res.status(400).send(err));
                })
                .catch((error) => {
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
});

// Delete a Product
router.delete('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_delete').then((rolePerm) => {
        if (!req.params.id) {
            res.status(400).send({
                msg: 'Please pass product ID.'
            })
        } else {
            Product
                .findByPk(req.params.id)
                .then((product) => {
                    if (product) {
                        Product.destroy({
                            where: {
                                id: req.params.id
                            }
                        }).then(_ => {
                            res.status(200).send({
                                'message': 'Product deleted'
                            });
                        }).catch(err => res.status(400).send(err));
                    } else {
                        res.status(404).send({
                            'message': 'Product not found'
                        });
                    }
                })
                .catch((error) => {
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
});

module.exports = router;