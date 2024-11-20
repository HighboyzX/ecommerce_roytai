const { query } = require('express');
const Prisma = require('../config/prisma');

class Product {
    constructor(id, categoryId, title, description, price, quantity, images) {
        this.id = Number(id);
        this.categoryId = categoryId;
        this.title = title;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.images = images;
    }

    validateInput() {
        if (!this.categoryId || typeof this.categoryId !== 'number') {
            return 'Category ID is required and must be a number!';
        }
        if (!this.title || typeof this.title !== 'string' || this.title.trim() === '') {
            return 'Title is required and must be a non-empty string!';
        }
        if (this.price === undefined || this.price === null) {
            this.price = 0;
        } else if (typeof this.price !== 'number' || this.price < 0) {
            return 'Price must be a positive number or zero!';
        }
        if (this.quantity === undefined || this.quantity === null) {
            this.quantity = 0;
        } else if (typeof this.quantity !== 'number' || !Number.isInteger(this.quantity) || this.quantity < 0) {
            return 'Quantity must be a non-negative integer!';
        }
        if (this.images && !Array.isArray(this.images)) {
            return 'Images must be an array!';
        }
        return null;
    }

    validateId() {
        if (!this.id || typeof this.id !== 'number') {
            throw new Error('Invalid or missing ID');
        }
    }

    async validateProductExists() {
        try {
            const product = await Prisma.product.findUnique({
                where: { id: this.id },
            });

            if (!product) {
                throw new Error(`Product with ID ${this.id} not found`);
            }

            return product;
        } catch (err) {
            throw err;
        }
    }


    async create() {
        try {
            const validationError = this.validateInput();
            if (validationError) {
                throw new Error(validationError);
            }

            // Map images to the correct format
            const imagesData = this.images ? this.images.map((image) => ({
                asset_id: image.asset_id,
                public_id: image.public_id,
                url: image.url,
                secure_url: image.secure_url,
            })) : [];


            // Create new product
            await Prisma.product.create({
                data: {
                    categoryId: this.categoryId,
                    title: this.title.trim(),
                    description: this.description ? this.description.trim() : null,
                    price: this.price,
                    quantity: this.quantity,
                    images: {
                        create: imagesData
                    }
                }
            });
        } catch (err) {
            throw err;
        }
    }

    async delete() {
        try {
            this.validateId();
            await this.validateProductExists();

            await Prisma.product.delete({
                where: { id: this.id }
            });
        } catch (err) {
            throw err;
        }
    }

    async update() {
        try {
            const validationError = this.validateInput();
            if (validationError) {
                throw new Error(validationError);
            }

            this.validateId();
            await this.validateProductExists();
            await this.deleteImages();

            // Map images to the correct format
            const imagesData = this.images ? this.images.map((image) => ({
                asset_id: image.asset_id,
                public_id: image.public_id,
                url: image.url,
                secure_url: image.secure_url,
            })) : [];

            await Prisma.product.update({
                data: {
                    categoryId: this.categoryId,
                    title: this.title.trim(),
                    description: this.description ? this.description.trim() : null,
                    price: this.price,
                    quantity: this.quantity,
                    images: {
                        create: imagesData
                    }
                },
                where: { id: this.id }
            });
        } catch (err) {
            throw err;
        }
    }

    async deleteImages() {
        try {

            await Prisma.image.deleteMany({
                where: { productId: this.id }
            })
        } catch (err) {
            throw err;
        }
    }

    async fetchLimit(limit) {
        try {
            return await Prisma.product.findMany({
                take: parseInt(limit),
                include: {
                    category: true,
                    images: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            throw err;
        }
    }

    async fetchOne() {
        try {
            this.validateId();
            await this.validateProductExists();

            return await Prisma.product.findFirst({
                include: {
                    category: true,
                    images: true
                },
                where: { id: this.id }
            });
        } catch (err) {
            throw err;
        }
    }

    async fetchSort(sort, order, limit) {
        try {
            return await Prisma.product.findMany({
                take: parseInt(limit),
                include: {
                    category: true,
                    images: true
                },
                orderBy: { [sort]: order }
            });
        } catch (err) {
            throw err;
        }
    }

    async filterBy(key, value) {
        try {
            let opts = {
                where: {},
                include: {
                    category: true,
                    images: true
                }
            };

            switch (key) {
                case 'title':
                    opts.where = {
                        title: {
                            contains: value
                        }
                    };
                    break;
                case 'category':
                    opts.where = {
                        categoryId: {
                            in: value.map((categoryId) => Number(categoryId))
                        }
                    };
                    break;
                case 'price':
                    opts.where = {
                        price: {
                            gte: value[0],
                            lte: value[1]
                        }
                    };
                    break;
                default: throw new Error('Invalid filter key');
            }

            return await Prisma.product.findMany(opts);
        } catch (err) {
            throw err;
        }
    }
}

exports.create = async (req, res) => {
    try {
        const { categoryId, title, description, price, quantity, images } = req.body;
        const _Product = new Product(null, categoryId, title, description, price, quantity, images);

        await _Product.create();

        res.status(201).json({ message: 'Create product success' });
    } catch (err) {
        console.error('Error creating product:', err.message);

        // Handle validation error
        if (err.message.includes('is required')) {
            return res.status(400).json({ message: err.message });
        }

        // Handle general server error
        res.status(500).json({ message: 'Server error' });
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId, title, description, price, quantity, images } = req.body;
        const _Product = new Product(id, categoryId, title, description, price, quantity, images);

        await _Product.update();

        res.status(201).json({ message: 'Update product success' });
    } catch (err) {
        console.error('Error updating product:', err.message);

        // Handle validation error
        if (err.message.includes('is required')) {
            return res.status(400).json({ message: err.message });
        }

        // Handle general server error
        res.status(500).json({ message: 'Server error' });
    }
}

exports.del = async (req, res) => {
    try {
        const { id } = req.params;
        const _Product = new Product(id);

        await _Product.delete();

        res.status(201).json({ message: 'Delete product success' });
    } catch (err) {
        console.error('Error deleting product:', err.message);

        // Handle general server error
        res.status(500).json({ message: 'Server error' });
    }
}

exports.fetchLimit = async (req, res) => {
    try {
        const { limit } = req.params;
        const _Product = new Product();

        const products = await _Product.fetchLimit(limit);

        res.status(201).json({ data: products });
    } catch (err) {
        console.error('Error fetching limit product:', err.message);

        // Handle general server error
        res.status(500).json({ message: 'Server error' });
    }
}

exports.fetchOne = async (req, res) => {
    try {
        const { id } = req.params;
        const _Product = new Product(id);

        const product = await _Product.fetchOne();

        res.status(201).json({ data: product });
    } catch (err) {
        console.error('Error fetch one product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.fetchSort = async (req, res) => {
    try {
        const { sort, order, limit } = req.body;
        const _Product = new Product();

        const products = await _Product.fetchSort(sort, order, limit);

        res.status(201).json({ data: products });
    } catch (err) {
        console.error('Error fetching sort product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }

}
exports.fetchFilter = async (req, res) => {
    try {
        const { title, category, price } = req.body;
        const _Product = new Product();
        let products = [];

        if (title) {
            products = await _Product.filterBy('title', title);
        }

        if (category) {
            products = await _Product.filterBy('category', category);
        }

        if (price) {
            products = await _Product.filterBy('price', price);
        }

        res.status(201).json({ data: products });
    } catch (err) {
        console.error('Error fetch filter product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
}