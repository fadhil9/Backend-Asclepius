const tfjs = require("@tensorflow/tfjs-node");
const fs = require("fs");

function loadModel() {
  const modelUrl =
    "https://storage.googleapis.com/bucketmodelfadhil/submissions-model/model.json";
  return tfjs.loadGraphModel(modelUrl);
}

async function predict(model, imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);

    const tensor = tfjs.node
      .decodeJpeg(imageBuffer)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    const prediction = await model.predict(tensor).data();

    const result = prediction[0] > 0.5 ? "Cancer" : "Non-cancer";

    return {
      prediction: result,
      confidence: prediction[0], // Nilai probabilitas asli
    };
  } catch (error) {
    console.error("Error saat melakukan prediksi:", error.message);
    throw new Error("Gagal memproses prediksi.");
  }
}

module.exports = { loadModel, predict };
