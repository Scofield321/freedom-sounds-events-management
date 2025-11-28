const pool = require("../config/db");
const supabase = require("../config/supabase");

// -----------------------------
// Create a new product
// -----------------------------
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const files = req.files; // multer array

    if (!name || !price)
      return res.status(400).json({ msg: "Name and price required" });

    if (!files || !files.length)
      return res.status(400).json({ msg: "No product images uploaded" });

    const imageUrls = [];

    for (const file of files) {
      const fileName = `products/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(fileName);

      if (data?.publicURL) imageUrls.push(data.publicURL);
    }

    // Ensure we only save valid URLs
    const cleanUrls = imageUrls.filter(Boolean);

    // Insert into products
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, stock, images)
       VALUES ($1, $2, $3, $4, $5, ARRAY_REMOVE($6::text[], NULL))
       RETURNING *`,
      [name, description || "", price, category || "", stock || 0, cleanUrls]
    );

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error("Create product error:", err);
    next(err);
  }
};

// -----------------------------
// Log a page visit
// -----------------------------
const logVisitPage = async (page, userIp) => {
  try {
    await pool.query(`INSERT INTO visits (page, user_ip) VALUES ($1, $2)`, [
      page,
      userIp,
    ]);
  } catch (err) {
    console.error("Failed to log page visit:", err);
  }
};

// -----------------------------
// Get all products
// -----------------------------
const getProducts = async (req, res, next) => {
  try {
    const { category } = req.query; // optional: if you filter by category
    const result = await pool.query(
      `SELECT * FROM products ORDER BY created_at DESC`
    );

    // Log visit
    const page = category ? `category:${category}` : "homepage";
    logVisitPage(page, req.ip);

    res.json({ success: true, products: result.rows });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Log a product visit
// -----------------------------
const logVisit = async (productId, userIp) => {
  try {
    await pool.query(
      `INSERT INTO visits (product_id, user_ip) VALUES ($1, $2)`,
      [productId, userIp]
    );
  } catch (err) {
    console.error("Failed to log visit:", err);
  }
};

// -----------------------------
// Get product by ID
// -----------------------------
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM products WHERE id=$1`, [id]);
    if (!result.rows.length)
      return res.status(404).json({ msg: "Product not found" });

    // Log visit for analytics
    logVisit(id, req.ip);
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Update product
// -----------------------------
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;
    const files = req.files;

    // Fetch existing product
    const productRes = await pool.query(`SELECT * FROM products WHERE id=$1`, [
      id,
    ]);
    if (!productRes.rows.length)
      return res.status(404).json({ msg: "Product not found" });

    let images = productRes.rows[0].images || [];

    // Upload new files if any
    if (files && files.length) {
      for (const file of files) {
        const fileName = `products/${Date.now()}-${file.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        if (data?.publicURL) images.push(data.publicURL);
      }
    }

    // Ensure we only save valid URLs
    const cleanUrls = images.filter(Boolean);

    // Update product in DB
    const result = await pool.query(
      `UPDATE products SET
         name=$1,
         description=$2,
         price=$3,
         category=$4,
         stock=$5,
         images=ARRAY_REMOVE($6::text[], NULL),
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        name !== undefined ? name : productRes.rows[0].name,
        description !== undefined
          ? description
          : productRes.rows[0].description,
        price !== undefined ? price : productRes.rows[0].price,
        category !== undefined ? category : productRes.rows[0].category,
        stock !== undefined ? stock : productRes.rows[0].stock,
        cleanUrls,
        id,
      ]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error("Update product error:", err);
    next(err);
  }
};

// -----------------------------
// Delete product
// -----------------------------
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productRes = await pool.query(`SELECT * FROM products WHERE id=$1`, [
      id,
    ]);
    if (!productRes.rows.length)
      return res.status(404).json({ msg: "Product not found" });

    await pool.query(`DELETE FROM products WHERE id=$1`, [id]);
    res.json({ success: true, msg: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get products by category
// -----------------------------
const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      `SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC`,
      [category]
    );

    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error("Get products by category error:", err);
    next(err);
  }
};

// -----------------------------
// Log a product search
// -----------------------------
const logSearch = async (query, userIp) => {
  try {
    if (!query || query.length < 3) return; // ignore tiny queries

    // Find products that match this query
    const productMatch = await pool.query(
      `SELECT name FROM products WHERE LOWER(name) LIKE '%' || LOWER($1) || '%'`,
      [query]
    );

    if (productMatch.rows.length === 0) return; // no matching product

    // For each matched product, increment its search count
    for (const { name } of productMatch.rows) {
      const check = await pool.query(
        `SELECT * FROM product_searches WHERE LOWER(product_name) = LOWER($1)`,
        [name]
      );

      if (check.rows.length > 0) {
        await pool.query(
          `
          UPDATE product_searches
          SET search_count = search_count + 1,
              searched_at = NOW(),
              user_ip = $2
          WHERE LOWER(product_name) = LOWER($1)
          `,
          [name, userIp]
        );
      } else {
        await pool.query(
          `INSERT INTO product_searches (product_name, user_ip) VALUES ($1, $2)`,
          [name, userIp]
        );
      }
    }
  } catch (err) {
    console.error("Failed to log search:", err);
  }
};

// -----------------------------
// Search products
// -----------------------------
const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    // console.log("SEARCH HIT:", q, req.ip);
    if (!q) return res.status(400).json({ msg: "Search query required" });

    logSearch(q, req.ip);

    const result = await pool.query(
      `SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1)`,
      [`%${q}%`]
    );

    res.json({ success: true, products: result.rows });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get analytics for admin
// -----------------------------
const getAnalytics = async (req, res, next) => {
  try {
    // -----------------------------
    // Top visited products
    // -----------------------------
    const topVisited = await pool.query(
      `SELECT p.name, COUNT(v.id) AS visits
       FROM visits v
       JOIN products p ON v.product_id = p.id
       WHERE v.visited_at >= NOW() - INTERVAL '1 month'
       GROUP BY p.name
       ORDER BY visits DESC
       LIMIT 10`
    );

    // -----------------------------
    // Top searched products (using SUM of search_count)
    // -----------------------------
    const topSearched = await pool.query(
      `SELECT p.name, COALESCE(SUM(ps.search_count), 0) AS searches
       FROM product_searches ps
       JOIN products p
         ON LOWER(ps.product_name) = LOWER(p.name)
       WHERE ps.searched_at >= NOW() - INTERVAL '1 month'
       GROUP BY p.name
       ORDER BY searches DESC
       LIMIT 10`
    );

    // -----------------------------
    // Total unique visitors
    // -----------------------------
    const totalVisitors = await pool.query(
      `SELECT COUNT(DISTINCT user_ip) AS total_visitors
       FROM visits
       WHERE visited_at >= NOW() - INTERVAL '1 month'`
    );

    // -----------------------------
    // Send response
    // -----------------------------
    res.json({
      success: true,
      topVisited: topVisited.rows,
      topSearched: topSearched.rows,
      totalVisitors: totalVisitors.rows[0].total_visitors,
    });
  } catch (err) {
    console.error("Failed to get analytics:", err);
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getAnalytics,
};
