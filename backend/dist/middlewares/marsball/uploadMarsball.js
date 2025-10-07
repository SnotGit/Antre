"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = exports.uploadMarsball = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
//======= CONFIGURATION DOSSIERS =======
const UPLOAD_DIR = 'uploads/marsball';
const FULL_DIR = path_1.default.join(UPLOAD_DIR, 'full');
const THUMBNAIL_DIR = path_1.default.join(UPLOAD_DIR, 'thumbnails');
// Créer les dossiers s'ils n'existent pas
[FULL_DIR, THUMBNAIL_DIR].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
//======= CONFIGURATION MULTER =======
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.'));
    }
};
exports.uploadMarsball = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 // 500KB max
    }
});
//======= MIDDLEWARE TRAITEMENT IMAGE =======
const processImage = async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || !files['image'] || files['image'].length === 0) {
            return next();
        }
        const file = files['image'][0];
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        // Générer l'image complète
        await (0, sharp_1.default)(file.buffer)
            .jpeg({ quality: 90 })
            .toFile(path_1.default.join(FULL_DIR, filename));
        // Générer le thumbnail (crop du header - 100px hauteur)
        await (0, sharp_1.default)(file.buffer)
            .resize({
            height: 100,
            fit: 'cover',
            position: 'top'
        })
            .jpeg({ quality: 85 })
            .toFile(path_1.default.join(THUMBNAIL_DIR, filename));
        // Ajouter le nom du fichier à la requête
        file.filename = filename;
        next();
    }
    catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
    }
};
exports.processImage = processImage;
