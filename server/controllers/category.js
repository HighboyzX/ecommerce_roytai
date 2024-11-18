const Prisma = require('../config/prisma');

class Category {
    constructor(id, name) {
        this.name = name;
        this.id = id
    }

    validateInput() {
        if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
            return 'Category name is required and must be a non-empty string!';
        }
        return null;
    }

    validateId() {
        if (!this.id || isNaN(Number(this.id))) {
            throw new Error('Invalid or missing category ID');
        }
    }

    async create() {
        try {
            const validationError = this.validateInput();
            if (validationError) {
                throw new Error(validationError);
            }

            // Check if category already exists
            const existingCategory = await Prisma.category.findUnique({
                where: { name: this.name.trim() },
            });

            if (existingCategory) {
                throw new Error('Category already exists!');
            }

            // Create new category
            await Prisma.category.create({
                data: { name: this.name.trim() },
            });
        } catch (err) {
            console.error('Error creating category:', err);
            throw err;
        }
    }

    async fetchAll() {
        try {
            return await Prisma.category.findMany();
        } catch (err) {
            console.error('Error fetching category:', err);
            throw err;
        }

    }

    async delete() {
        try {
            this.validateId();

            // Check if category exists before deleting
            const category = await Prisma.category.findUnique({
                where: { id: Number(this.id) },
            });

            if (!category) {
                throw new Error('Category not found');
            }

            // Delete the category
            await Prisma.category.delete({
                where: { id: Number(this.id) },
            });
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    }
}

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        const _category = new Category(null, name);

        await _category.create();

        res.status(201).json({ message: 'Create catefory success' });
    } catch (err) {
        console.error('Error creating category:', err.message);

        // Handle specific errors
        if (err.message === 'Category name is required and must be a non-empty string!') {
            return res.status(400).json({ message: err.message });
        }
        if (err.message === 'Category already exists!') {
            return res.status(409).json({ message: err.message });
        }

        // Handle general server error
        res.status(500).json({ message: 'Server error' });
    }
}

exports.fetch = async (req, res) => {
    try {
        const _category = new Category();
        const categoryList = await _category.fetchAll();

        if (categoryList.length === 0) {
            return res.status(404).json({ message: 'No categories found!' });
        }

        res.status(200).json({ data: categoryList });
    } catch (err) {
        console.error('Error in fetch handler:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.del = async (req, res) => {
    try {
        const { id } = req.params;
        const _category = new Category(id);

        await _category.delete();

        res.status(200).json({ message: `Category with ID ${id} deleted successfully` });
    } catch (err) {
        console.error('Error in delete handler:', err.message);

        if (err.message === 'Invalid or missing category ID') {
            return res.status(400).json({ message: err.message });
        }
        if (err.message === 'Category not found') {
            return res.status(404).json({ message: err.message });
        }

        res.status(500).json({ message: 'Server error' });
    }
}