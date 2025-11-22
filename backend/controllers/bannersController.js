const pool = require("../config/db");
const supabase = require("../config/supabase");

// ---------------------------------------------------
// Create Banner
// ---------------------------------------------------
const createBanner = async (req, res, next) => {
  try {
    const { title, description, link, is_active, display_order } = req.body;
    const files = req.files;

    if (!files || !files.length)
      return res.status(400).json({ msg: "No banner images uploaded" });

    const imageUrls = [];

    for (const file of files) {
      const fileName = `banners/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("banners").getPublicUrl(fileName);

      if (data?.publicURL) imageUrls.push(data.publicURL);
    }

    const cleanUrls = imageUrls.filter(Boolean);

    const result = await pool.query(
      `INSERT INTO banners (title, description, link, is_active, display_order, images)
       VALUES ($1, $2, $3, $4, $5, ARRAY_REMOVE($6::text[], NULL))
       RETURNING *`,
      [
        title || "",
        description || "",
        link || "",
        is_active ?? true,
        display_order || 1,
        cleanUrls,
      ]
    );

    res.status(201).json({ success: true, banner: result.rows[0] });
  } catch (err) {
    console.error("Create banner error:", err);
    next(err);
  }
};

// ---------------------------------------------------
// Get All Banners
// ---------------------------------------------------
const getBanners = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM banners ORDER BY display_order ASC, created_at DESC`
    );
    res.json({ success: true, banners: result.rows });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------
// Get Banner By ID
// ---------------------------------------------------
const getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM banners WHERE id=$1`, [id]);

    if (!result.rows.length)
      return res.status(404).json({ msg: "Banner not found" });

    res.json({ success: true, banner: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------
// Update Banner
// ---------------------------------------------------
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, link, is_active, display_order } = req.body;
    const files = req.files;

    const bannerRes = await pool.query(`SELECT * FROM banners WHERE id=$1`, [
      id,
    ]);

    if (!bannerRes.rows.length)
      return res.status(404).json({ msg: "Banner not found" });

    let images = bannerRes.rows[0].images || [];

    if (files && files.length) {
      for (const file of files) {
        const fileName = `banners/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("banners")
          .getPublicUrl(fileName);

        if (data?.publicURL) images.push(data.publicURL);
      }
    }

    const cleanUrls = images.filter(Boolean);

    const result = await pool.query(
      `UPDATE banners SET
         title=$1,
         description=$2,
         link=$3,
         is_active=$4,
         display_order=$5,
         images=ARRAY_REMOVE($6::text[], NULL),
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        title || bannerRes.rows[0].title,
        description || bannerRes.rows[0].description,
        link || bannerRes.rows[0].link,
        is_active ?? bannerRes.rows[0].is_active,
        display_order || bannerRes.rows[0].display_order,
        cleanUrls,
        id,
      ]
    );

    res.json({ success: true, banner: result.rows[0] });
  } catch (err) {
    console.error("Update banner error:", err);
    next(err);
  }
};

// ---------------------------------------------------
// Delete Banner
// ---------------------------------------------------
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bannerRes = await pool.query(`SELECT * FROM banners WHERE id=$1`, [
      id,
    ]);

    if (!bannerRes.rows.length)
      return res.status(404).json({ msg: "Banner not found" });

    await pool.query(`DELETE FROM banners WHERE id=$1`, [id]);

    res.json({ success: true, msg: "Banner deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
