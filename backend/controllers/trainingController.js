const pool = require("../config/db");
const supabase = require("../config/supabase");

// ------------------------------------
// Create a new training course
// ------------------------------------
const createTraining = async (req, res, next) => {
  try {
    const { title, description, price, duration, level, contact_phone } =
      req.body;
    const files = req.files;

    if (!title) return res.status(400).json({ msg: "Title required" });

    const imageUrls = [];

    if (files && files.length) {
      for (const file of files) {
        if (!file.mimetype.startsWith("image/")) continue;

        const fileName = `training/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from("training")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("training")
          .getPublicUrl(fileName);

        if (data?.publicURL) imageUrls.push(data.publicURL);
      }
    }

    const cleanUrls = imageUrls.filter(Boolean);

    const result = await pool.query(
      `INSERT INTO training (title, description, price, duration, level, images)
       VALUES ($1,$2,$3,$4,$5,ARRAY_REMOVE($6::text[], NULL))
       RETURNING *`,
      [
        title,
        description || "",
        price || null,
        duration || "",
        level || "",
        cleanUrls,
      ]
    );

    res.status(201).json({ success: true, training: result.rows[0] });
  } catch (err) {
    console.error("Create training error:", err);
    next(err);
  }
};

// ------------------------------------
// Get all training courses
// ------------------------------------
const getTraining = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM training ORDER BY created_at DESC`
    );
    res.json({ success: true, training: result.rows });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------
// Get single training by ID
// ------------------------------------
const getTrainingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`SELECT * FROM training WHERE id=$1`, [id]);

    if (!result.rows.length)
      return res.status(404).json({ msg: "Training course not found" });

    res.json({ success: true, training: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------
// Update a training course
// ------------------------------------
const updateTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, duration, level, contact_phone } =
      req.body;
    const files = req.files;

    const existing = await pool.query(`SELECT * FROM training WHERE id=$1`, [
      id,
    ]);

    if (!existing.rows.length)
      return res.status(404).json({ msg: "Training not found" });

    let images = existing.rows[0].images || [];

    if (files && files.length) {
      for (const file of files) {
        if (!file.mimetype.startsWith("image/")) continue;

        const fileName = `training/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from("training")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("training")
          .getPublicUrl(fileName);

        if (data?.publicURL) images.push(data.publicURL);
      }
    }

    const cleanUrls = images.filter(Boolean);

    const result = await pool.query(
      `UPDATE training SET
         title=$1,
         description=$2,
         price=$3,
         duration=$4,
         level=$5,
         images=ARRAY_REMOVE($6::text[], NULL),
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        title || existing.rows[0].title,
        description || existing.rows[0].description,
        price || existing.rows[0].price,
        duration || existing.rows[0].duration,
        level || existing.rows[0].level,
        cleanUrls,
        id,
      ]
    );

    res.json({ success: true, training: result.rows[0] });
  } catch (err) {
    console.error("Update training error:", err);
    next(err);
  }
};

// ------------------------------------
// Delete training
// ------------------------------------
const deleteTraining = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await pool.query(`SELECT * FROM training WHERE id=$1`, [id]);
    if (!check.rows.length)
      return res.status(404).json({ msg: "Training not found" });

    await pool.query(`DELETE FROM training WHERE id=$1`, [id]);

    res.json({ success: true, msg: "Training deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTraining,
  getTraining,
  getTrainingById,
  updateTraining,
  deleteTraining,
};
