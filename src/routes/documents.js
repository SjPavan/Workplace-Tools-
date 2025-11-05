import { Router } from 'express';
import multer from 'multer';
import { ingestDocument, getDocument, listDocuments, getNotebook } from '../services/ingestionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const conditionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
};

router.post(
  '/ingest',
  conditionalUpload,
  asyncHandler(async (req, res) => {
    const { sourceType = (req.file ? 'upload' : 'web'), url, metadata } = req.body;
    const result = await ingestDocument({
      sourceType,
      file: req.file,
      url,
      metadata
    });

    res.status(201).json(result);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const documents = await listDocuments();
    res.json({ documents });
  })
);

router.get(
  '/:documentId',
  asyncHandler(async (req, res) => {
    const document = await getDocument(req.params.documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  })
);

router.get(
  '/:documentId/notebook',
  asyncHandler(async (req, res) => {
    const notebook = await getNotebook(req.params.documentId);
    if (!notebook) {
      res.status(404).json({ error: 'Notebook entry not found' });
      return;
    }

    res.json(notebook);
  })
);

export default router;
