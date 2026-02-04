const { firebaseFirestore } = require('../config/firebaseAdmin');

function climateCollection(userId) {
  return firebaseFirestore.collection('users').doc(userId).collection('climateRecords');
}

async function create(recordInput) {
  const recordRef = climateCollection(recordInput.userId).doc();

  const record = {
    id: recordRef.id,
    ...recordInput,
    createdAt: new Date().toISOString(),
  };

  await recordRef.set(record);
  return record;
}

async function findByUserId(userId) {
  const snapshot = await climateCollection(userId).orderBy('collectedAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data());
}

async function findLatestByUserId(userId) {
  const snapshot = await climateCollection(userId).orderBy('collectedAt', 'desc').limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

module.exports = {
  create,
  findByUserId,
  findLatestByUserId,
};
