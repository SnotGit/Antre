"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = exports.createCategory = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= CREATE CATEGORY =======
const createCategory = async (req, res) => {
    try {
        const { title, parentId } = req.body;
        if (!title || title.trim().length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Le titre est requis');
            return;
        }
        if (parentId !== null && parentId !== undefined) {
            const parentExists = await prisma.marsballCategory.findUnique({
                where: { id: parseInt(parentId, 10) }
            });
            if (!parentExists) {
                (0, helpers_1.sendNotFound)(res, 'Catégorie parente non trouvée');
                return;
            }
        }
        const category = await prisma.marsballCategory.create({
            data: {
                title: title.trim(),
                parentId: parentId ? parseInt(parentId, 10) : null
            }
        });
        const categoryResponse = {
            id: category.id,
            title: category.title,
            parentId: category.parentId,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString()
        };
        res.status(201).json({ category: categoryResponse });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création de la catégorie');
    }
};
exports.createCategory = createCategory;
//======= CREATE ITEM =======
const createItem = async (req, res) => {
    try {
        const { title, categoryId, description } = req.body;
        if (!title || title.trim().length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Le titre est requis');
            return;
        }
        if (!categoryId) {
            (0, helpers_1.sendBadRequest)(res, 'La catégorie est requise');
            return;
        }
        if (!req.file) {
            (0, helpers_1.sendBadRequest)(res, 'L\'image est requise');
            return;
        }
        const categoryExists = await prisma.marsballCategory.findUnique({
            where: { id: parseInt(categoryId, 10) }
        });
        if (!categoryExists) {
            (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
            return;
        }
        const imageUrl = `/uploads/marsball/${req.file.filename}`;
        const item = await prisma.marsballItem.create({
            data: {
                title: title.trim(),
                imageUrl,
                description: description ? description.trim() : null,
                categoryId: parseInt(categoryId, 10)
            }
        });
        const itemResponse = {
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            thumbnailUrl: item.thumbnailUrl || undefined,
            description: item.description || undefined,
            categoryId: item.categoryId,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString()
        };
        res.status(201).json({ item: itemResponse });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création de l\'item');
    }
};
exports.createItem = createItem;
