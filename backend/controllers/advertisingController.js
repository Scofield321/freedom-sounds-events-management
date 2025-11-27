const pool = require("../config/db");
const supabase = require("../config/supabase");

// -----------------------------
// Create a new advertising campaign
// -----------------------------
const createAdvertising = async (req, res, next) => {
  try {
    const { title, description, type, start_date, end_date } = req.body;
    const files = req.files; // multer array

    if (!title) return res.status(400).json({ msg: "Title required" });
    if (!files || !files.length)
      return res.status(400).json({ msg: "No images uploaded" });

    const imageUrls = [];

    for (const file of files) {
      if (!file.mimetype.startsWith("image/")) continue; // skip non-images
      const fileName = `advertising/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("advertising")
        .upload(fileName, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("advertising")
        .getPublicUrl(fileName);
      if (data?.publicURL) imageUrls.push(data.publicURL);
    }

    const cleanUrls = imageUrls.filter(Boolean);

    const result = await pool.query(
      `INSERT INTO advertising (title, description, type, start_date, end_date, images)
       VALUES ($1,$2,$3,$4,$5,ARRAY_REMOVE($6::text[], NULL))
       RETURNING *`,
      [
        title,
        description || "",
        type || "",
        start_date || null,
        end_date || null,
        cleanUrls,
      ]
    );

    res.status(201).json({ success: true, advertising: result.rows[0] });
  } catch (err) {
    console.error("Create advertising error:", err);
    next(err);
  }
};

// -----------------------------
// Get all advertising campaigns
// -----------------------------
const getAdvertising = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM advertising ORDER BY created_at DESC`
    );
    res.json({ success: true, advertising: result.rows });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get advertising by ID
// -----------------------------
const getAdvertisingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM advertising WHERE id=$1`, [
      id,
    ]);

    if (!result.rows.length)
      return res.status(404).json({ msg: "Advertising not found" });

    res.json({ success: true, advertising: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Update advertising campaign
// -----------------------------
const updateAdvertising = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, start_date, end_date } = req.body;
    const files = req.files;

    const adRes = await pool.query(`SELECT * FROM advertising WHERE id=$1`, [
      id,
    ]);
    if (!adRes.rows.length)
      return res.status(404).json({ msg: "Advertising not found" });

    let images = adRes.rows[0].images || [];

    if (files && files.length) {
      for (const file of files) {
        if (!file.mimetype.startsWith("image/")) continue;
        const fileName = `advertising/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from("advertising")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("advertising")
          .getPublicUrl(fileName);
        if (data?.publicURL) images.push(data.publicURL);
      }
    }

    const cleanUrls = images.filter(Boolean);

    const result = await pool.query(
      `UPDATE advertising SET
         title=$1,
         description=$2,
         type=$3,
         start_date=$4,
         end_date=$5,
         images=ARRAY_REMOVE($6::text[], NULL),
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        title || adRes.rows[0].title,
        description || adRes.rows[0].description,
        type || adRes.rows[0].type,
        start_date || adRes.rows[0].start_date,
        end_date || adRes.rows[0].end_date,
        cleanUrls,
        id,
      ]
    );

    res.json({ success: true, advertising: result.rows[0] });
  } catch (err) {
    console.error("Update advertising error:", err);
    next(err);
  }
};

// -----------------------------
// Delete advertising campaign
// -----------------------------
const deleteAdvertising = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adRes = await pool.query(`SELECT * FROM advertising WHERE id=$1`, [
      id,
    ]);
    if (!adRes.rows.length)
      return res.status(404).json({ msg: "Advertising not found" });

    await pool.query(`DELETE FROM advertising WHERE id=$1`, [id]);
    res.json({ success: true, msg: "Advertising deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAdvertising,
  getAdvertising,
  getAdvertisingById,
  updateAdvertising,
  deleteAdvertising,
};
