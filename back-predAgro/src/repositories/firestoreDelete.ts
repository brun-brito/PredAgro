type FirestoreDocumentRef = FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
type FirestoreCollectionRef = FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

async function deleteCollectionTree(collectionRef: FirestoreCollectionRef) {
  const snapshot = await collectionRef.get();

  for (const doc of snapshot.docs) {
    await deleteDocumentTree(doc.ref);
  }
}

export async function deleteDocumentTree(documentRef: FirestoreDocumentRef) {
  const subcollections = await documentRef.listCollections();

  for (const collection of subcollections) {
    await deleteCollectionTree(collection);
  }

  await documentRef.delete();
}
