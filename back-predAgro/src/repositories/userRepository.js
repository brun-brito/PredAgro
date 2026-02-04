const { firebaseFirestore } = require('../config/firebaseAdmin');

function userDoc(userId) {
  return firebaseFirestore.collection('users').doc(userId);
}

async function findById(userId) {
  const snapshot = await userDoc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

async function upsert({ id, name, email }) {
  const currentUser = await findById(id);

  const nextUser = {
    id,
    name,
    email,
    createdAt: currentUser?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await userDoc(id).set(nextUser, { merge: true });
  return nextUser;
}

module.exports = {
  findById,
  upsert,
};
