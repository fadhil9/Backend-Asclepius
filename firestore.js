const Firestore = require("@google-cloud/firestore");

const db = new Firestore({
  projectId: "submissionmlgc-muhamadfadhil",
  keyFilename: "submissionmlgc-muhamadfadhil-3351ceec9f1b.json",
});

async function saveHasil(result) {
  try {
    //buat document id result yang ngarah ke collections prediction
    const docRef = db.collection("predictions").doc(result.id);

    //save document
    await docRef.set(result);
  } catch (error) {
    console.error("Gagal menambahkan dokumen:", error.message);
  }
}

async function getHasil() {
  const result = [];
  const dataHasil = await db.collection("predictions").get();

  if (dataHasil.empty) {
    return result;
  }

  dataHasil.forEach((doc) => {
    const data = doc.data();
    result.push({
      id: doc.id,
      history: {
        result: data.result,
        createdAt: data.createdAt,
        suggestion: data.suggestion,
        id: doc.id,
      },
    });
  });

  return result;
}

module.exports = { saveHasil, getHasil };
