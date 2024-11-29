const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { saveHasil, getHasil } = require("./firestore");
const { loadModel, predict } = require("./inference");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

// Konfigurasi multer untuk menyimpan file di folder `uploads`
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder penyimpanan
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueSuffix);
  },
});

// Konfigurasi Multer
const upload = multer({
  storage,
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File harus berupa gambar"));
    }
    cb(null, true);
  },
});

app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      res.status(400).json({
        status: "fail",
        message: "File gambar tidak ditemukan",
      });
    } else {
      // prediction
      console.log("loading load model...");
      const model = await loadModel();
      console.log("model loaded!");
      const imagePath = "./" + file.path;

      console.log("loading prediction");
      const predictions = await predict(model, imagePath);
      console.log("prediction succes");

      const prediction = predictions.prediction;
      //response
      const result = {
        id: uuidv4(),
        result: prediction,
        suggestion:
          prediction == "Cancer"
            ? "Segera periksa ke dokter!"
            : "Penyakit kanker tidak terdeteksi.",
        createdAt: new Date().toISOString(),
      };

      //menyimpan response api ke firestore
      await saveHasil(result);

      res.status(201).json({
        status: "success",
        message: "Model is predicted successfully",
        data: result,
      });
    }
  } catch (error) {
    if (error.message === "File harus berupa gambar") {
      res.status(400).json({
        status: "fail",
        message: error.message,
      });
    }
    res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
      error: error.message,
    });
  }
});

//get data histories dari firestore
app.get("/predict/histories", async (req, res) => {
  try {
    const dataHasil = await getHasil();
    res.status(200).json({
      status: "success",
      data: dataHasil,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
    }

    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  next(err);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
