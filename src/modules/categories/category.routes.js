import { Router } from 'express';
import { ServiceCategory } from './category.model.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const categories = await ServiceCategory.find().sort({ sortOrder: 1 });
    res.json({
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
