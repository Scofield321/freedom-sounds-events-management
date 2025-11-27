const pool = require("../config/db");
const supabase = require("../config/supabase");

// -----------------------------
// Create a new service/event
// -----------------------------
const createService = async (req, res, next) => {
  try {
    const { title, description, price, category, contact_phone } = req.body;
    const files = req.files; // multer array

    if (!title) return res.status(400).json({ msg: "Title required" });
    if (!files || !files.length)
      return res.status(400).json({ msg: "No images uploaded" });

    const imageUrls = [];

    for (const file of files) {
      if (!file.mimetype.startsWith("image/")) continue; // skip non-images
      const fileName = `services/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("services")
        .upload(fileName, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("services").getPublicUrl(fileName);

      if (data?.publicURL) imageUrls.push(data.publicURL);
    }

    const cleanUrls = imageUrls.filter(Boolean);

    const result = await pool.query(
      `INSERT INTO services (title, description, price, category, contact_phone, images)
       VALUES ($1,$2,$3,$4,$5,ARRAY_REMOVE($6::text[], NULL))
       RETURNING *`,
      [
        title,
        description || "",
        price || null,
        category || "",
        contact_phone || "",
        cleanUrls,
      ]
    );

    res.status(201).json({ success: true, service: result.rows[0] });
  } catch (err) {
    console.error("Create service error:", err);
    next(err);
  }
};

// -----------------------------
// Get all services/events
// -----------------------------
const getServices = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM services ORDER BY created_at DESC`
    );
    res.json({ success: true, services: result.rows });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get service/event by ID
// -----------------------------
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM services WHERE id=$1`, [id]);

    if (!result.rows.length)
      return res.status(404).json({ msg: "Service not found" });

    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Update service/event
// -----------------------------
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, contact_phone } = req.body;
    const files = req.files;

    const svcRes = await pool.query(`SELECT * FROM services WHERE id=$1`, [id]);
    if (!svcRes.rows.length)
      return res.status(404).json({ msg: "Service not found" });

    let images = svcRes.rows[0].images || [];

    if (files && files.length) {
      for (const file of files) {
        if (!file.mimetype.startsWith("image/")) continue;
        const fileName = `services/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from("services")
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("services")
          .getPublicUrl(fileName);
        if (data?.publicURL) images.push(data.publicURL);
      }
    }

    const cleanUrls = images.filter(Boolean);

    const result = await pool.query(
      `UPDATE services SET
         title=$1,
         description=$2,
         price=$3,
         category=$4,
         contact_phone=$5,
         images=ARRAY_REMOVE($6::text[], NULL),
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        title || svcRes.rows[0].title,
        description || svcRes.rows[0].description,
        price || svcRes.rows[0].price,
        category || svcRes.rows[0].category,
        contact_phone || svcRes.rows[0].contact_phone,
        cleanUrls,
        id,
      ]
    );

    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    console.error("Update service error:", err);
    next(err);
  }
};

// -----------------------------
// Delete service/event
// -----------------------------
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const svcRes = await pool.query(`SELECT * FROM services WHERE id=$1`, [id]);
    if (!svcRes.rows.length)
      return res.status(404).json({ msg: "Service not found" });

    await pool.query(`DELETE FROM services WHERE id=$1`, [id]);
    res.json({ success: true, msg: "Service deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
};
