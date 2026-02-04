const { firebaseFirestore } = require('../config/firebaseAdmin');

function profileDoc(userId) {
  return firebaseFirestore.collection('profiles').doc(userId);
}

async function findByUserId(userId) {
  const snapshot = await profileDoc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

async function upsert(userId, profileInput) {
  const currentProfile = await findByUserId(userId);

  const nextProfile = {
    userId,
    farmName: profileInput.farmName,
    city: profileInput.city,
    state: profileInput.state,
    cropTypes: profileInput.cropTypes,
    areaHectares: profileInput.areaHectares,
    updatedAt: new Date().toISOString(),
    createdAt: currentProfile?.createdAt ?? new Date().toISOString(),
  };

  await profileDoc(userId).set(nextProfile, { merge: true });
  return nextProfile;
}

module.exports = {
  findByUserId,
  upsert,
};
