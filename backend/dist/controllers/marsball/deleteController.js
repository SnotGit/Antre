"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchDeleteItems = exports.batchDeleteCategories = exports.deleteItem = exports.deleteCategory = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= DELETE CATEGORY =======
const deleteCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id, 10);
        if (isNaN(categoryId)) {
            (0, helpers_1.sendBadRequest)(res, 'ID invalide');
            return;
        }
        const categoryExists = await prisma.marsballCategory.findUnique({
            where: { id: categoryId }
        });
        if (!categoryExists) {
            (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
            return;
        }
        await prisma.marsballCategory.delete({
            where: { id: categoryId }
        });
        res.json({ message: 'Catégorie supprimée avec succès' });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression de la catégorie');
    }
};
exports.deleteCategory = deleteCategory;
//======= DELETE ITEM =======
const deleteItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (isNaN(itemId)) {
            (0, helpers_1.sendBadRequest)(res, 'ID invalide');
            return;
        }
        const itemExists = await prisma.marsballItem.findUnique({
            where: { id: itemId }
        });
        if (!itemExists) {
            (0, helpers_1.sendNotFound)(res, 'Item non trouvé');
            return;
        }
        await prisma.marsballItem.delete({
            where: { id: itemId }
        });
        res.json({ message: 'Item supprimé avec succès' });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression de l\'item');
    }
};
exports.deleteItem = deleteItem;
//======= BATCH DELETE CATEGORIES =======
const batchDeleteCategories = async (req, res) => {
    try {
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Liste d\'IDs invalide');
            return;
        }
        const validIds = categoryIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
        if (validIds.length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Aucun ID valide');
            return;
        }
        await prisma.marsballCategory.deleteMany({
            where: {
                id: { in: validIds }
            }
        });
        res.json({ message: `${validIds.length} catégorie(s) supprimée(s) avec succès` });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression des catégories');
    }
};
exports.batchDeleteCategories = batchDeleteCategories;
//======= BATCH DELETE ITEMS =======
const batchDeleteItems = async (req, res) => {
    try {
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Liste d\'IDs invalide');
            return;
        }
        const validIds = itemIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
        if (validIds.length === 0) {
            (0, helpers_1.sendBadRequest)(res, 'Aucun ID valide');
            return;
        }
        await prisma.marsballItem.deleteMany({
            where: {
                id: { in: validIds }
            }
        });
        res.json({ message: `${validIds.length} item(s) supprimé(s) avec succès` });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression des items');
    }
};
exports.batchDeleteItems = batchDeleteItems;
