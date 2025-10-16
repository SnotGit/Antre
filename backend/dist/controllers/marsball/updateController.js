"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItem = exports.updateCategory = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= UPDATE CATEGORY =======
const updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id, 10);
        const { title } = req.body;
        if (isNaN(categoryId)) {
            (0, helpers_1.sendBadRequest)(res, 'ID invalide');
            return;
        }
        if (!title || title.trim().length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Le titre est requis');
            return;
        }
        const categoryExists = await prisma.marsballCategory.findUnique({
            where: { id: categoryId }
        });
        if (!categoryExists) {
            (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
            return;
        }
        const category = await prisma.marsballCategory.update({
            where: { id: categoryId },
            data: { title: title.trim() }
        });
        const categoryResponse = {
            id: category.id,
            title: category.title,
            parentId: category.parentId,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString()
        };
        res.json({ category: categoryResponse });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la modification de la catégorie');
    }
};
exports.updateCategory = updateCategory;
//======= UPDATE ITEM =======
const updateItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id, 10);
        const { title } = req.body;
        if (isNaN(itemId)) {
            (0, helpers_1.sendBadRequest)(res, 'ID invalide');
            return;
        }
        if (!title || title.trim().length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Le titre est requis');
            return;
        }
        const itemExists = await prisma.marsballItem.findUnique({
            where: { id: itemId }
        });
        if (!itemExists) {
            (0, helpers_1.sendNotFound)(res, 'Item non trouvé');
            return;
        }
        const item = await prisma.marsballItem.update({
            where: { id: itemId },
            data: { title: title.trim() }
        });
        const itemResponse = {
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            categoryId: item.categoryId,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString()
        };
        res.json({ item: itemResponse });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la modification de l\'item');
    }
};
exports.updateItem = updateItem;
