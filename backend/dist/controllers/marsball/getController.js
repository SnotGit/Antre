"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryWithChildren = exports.getRootCategories = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET ROOT CATEGORIES =======
const getRootCategories = async (req, res) => {
    try {
        const categories = await prisma.marsballCategory.findMany({
            where: { parentId: null },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                title: true,
                parentId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        const categoriesList = categories.map(cat => ({
            id: cat.id,
            title: cat.title,
            parentId: cat.parentId,
            createdAt: cat.createdAt.toISOString(),
            updatedAt: cat.updatedAt.toISOString()
        }));
        res.json({ categories: categoriesList });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des catégories racines');
    }
};
exports.getRootCategories = getRootCategories;
//======= GET CATEGORY WITH CHILDREN =======
const getCategoryWithChildren = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id, 10);
        if (isNaN(categoryId)) {
            (0, helpers_1.sendBadRequest)(res, 'ID invalide');
            return;
        }
        const category = await prisma.marsballCategory.findUnique({
            where: { id: categoryId },
            include: {
                children: {
                    orderBy: { createdAt: 'asc' }
                },
                items: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!category) {
            (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
            return;
        }
        const response = {
            category: {
                id: category.id,
                title: category.title,
                parentId: category.parentId,
                createdAt: category.createdAt.toISOString(),
                updatedAt: category.updatedAt.toISOString()
            },
            children: category.children.map(child => ({
                id: child.id,
                title: child.title,
                parentId: child.parentId,
                createdAt: child.createdAt.toISOString(),
                updatedAt: child.updatedAt.toISOString()
            })),
            items: category.items.map(item => ({
                id: item.id,
                title: item.title,
                imageUrl: item.imageUrl,
                categoryId: item.categoryId,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString()
            }))
        };
        res.json(response);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de la catégorie');
    }
};
exports.getCategoryWithChildren = getCategoryWithChildren;
