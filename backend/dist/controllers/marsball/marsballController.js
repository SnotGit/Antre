"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = exports.createList = exports.createCategory = exports.getItemDetail = exports.getListWithItems = exports.getCategoryWithLists = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET ALL CATEGORIES (PUBLIC) =======
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.marsballCategory.findMany({
            orderBy: { createdAt: 'asc' }
        });
        res.json(categories);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des catégories');
    }
};
exports.getCategories = getCategories;
//======= GET CATEGORY WITH LISTS (PUBLIC) =======
const getCategoryWithLists = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        if (isNaN(categoryId)) {
            return (0, helpers_1.sendError)(res, 'ID de catégorie invalide', 400);
        }
        const category = await prisma.marsballCategory.findUnique({
            where: { id: categoryId },
            include: {
                lists: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!category) {
            return (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
        }
        res.json(category);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de la catégorie');
    }
};
exports.getCategoryWithLists = getCategoryWithLists;
//======= GET LIST WITH ITEMS (PUBLIC) =======
const getListWithItems = async (req, res) => {
    try {
        const listId = parseInt(req.params.id);
        if (isNaN(listId)) {
            return (0, helpers_1.sendError)(res, 'ID de liste invalide', 400);
        }
        const list = await prisma.marsballList.findUnique({
            where: { id: listId },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        thumbnailUrl: true,
                        createdAt: true
                    }
                },
                category: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!list) {
            return (0, helpers_1.sendNotFound)(res, 'Liste non trouvée');
        }
        res.json(list);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de la liste');
    }
};
exports.getListWithItems = getListWithItems;
//======= GET ITEM DETAIL (PUBLIC) =======
const getItemDetail = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        if (isNaN(itemId)) {
            return (0, helpers_1.sendError)(res, 'ID d\'item invalide', 400);
        }
        const item = await prisma.marsballItem.findUnique({
            where: { id: itemId },
            include: {
                list: {
                    select: {
                        id: true,
                        title: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });
        if (!item) {
            return (0, helpers_1.sendNotFound)(res, 'Item non trouvé');
        }
        res.json(item);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de l\'item');
    }
};
exports.getItemDetail = getItemDetail;
//======= CREATE CATEGORY (ADMIN) =======
const createCategory = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return (0, helpers_1.sendError)(res, 'Titre de catégorie requis', 400);
        }
        const category = await prisma.marsballCategory.create({
            data: { title: title.trim() }
        });
        res.status(201).json(category);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création de la catégorie');
    }
};
exports.createCategory = createCategory;
//======= CREATE LIST (ADMIN) =======
const createList = async (req, res) => {
    try {
        const { title, categoryId } = req.body;
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return (0, helpers_1.sendError)(res, 'Titre de liste requis', 400);
        }
        if (!categoryId || typeof categoryId !== 'number') {
            return (0, helpers_1.sendError)(res, 'ID de catégorie requis', 400);
        }
        // Vérifier que la catégorie existe
        const category = await prisma.marsballCategory.findUnique({
            where: { id: categoryId }
        });
        if (!category) {
            return (0, helpers_1.sendNotFound)(res, 'Catégorie non trouvée');
        }
        const list = await prisma.marsballList.create({
            data: {
                title: title.trim(),
                categoryId
            }
        });
        res.status(201).json(list);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création de la liste');
    }
};
exports.createList = createList;
//======= CREATE ITEM (ADMIN) =======
const createItem = async (req, res) => {
    try {
        const { title, listId } = req.body;
        const files = req.files;
        // Validation
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return (0, helpers_1.sendError)(res, 'Titre d\'item requis', 400);
        }
        if (!listId || typeof listId !== 'number') {
            return (0, helpers_1.sendError)(res, 'ID de liste requis', 400);
        }
        if (!files || !files['image'] || files['image'].length === 0) {
            return (0, helpers_1.sendError)(res, 'Image requise', 400);
        }
        // Vérifier que la liste existe
        const list = await prisma.marsballList.findUnique({
            where: { id: listId }
        });
        if (!list) {
            return (0, helpers_1.sendNotFound)(res, 'Liste non trouvée');
        }
        // Les chemins des images sont générés par le middleware multer + sharp
        const imageUrl = `/uploads/marsball/full/${files['image'][0].filename}`;
        const thumbnailUrl = `/uploads/marsball/thumbnails/${files['image'][0].filename}`;
        const item = await prisma.marsballItem.create({
            data: {
                title: title.trim(),
                imageUrl,
                thumbnailUrl,
                listId
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création de l\'item');
    }
};
exports.createItem = createItem;
