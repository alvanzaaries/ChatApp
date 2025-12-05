import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase sudah otomatis terkonfigurasi dari google-services.json
const db = firestore();

// Helper functions
export const messagesCollection = db.collection('messages');

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  return await auth().createUserWithEmailAndPassword(email, password);
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  return await auth().signInWithEmailAndPassword(email, password);
};

export const updateProfile = async (user: any, profile: { displayName?: string; photoURL?: string | null }) => {
  return await user.updateProfile(profile);
};

export const uploadProfileImage = async (userId: string, uri: string) => {
  const reference = storage().ref(`profile_images/${userId}`);
  await reference.putFile(uri);
  return await reference.getDownloadURL();
};

export { auth, firestore, storage, db };

// Firestore helpers
export const addDoc = async (collectionRef: any, data: any) => {
  return await collectionRef.add(data);
};

export const serverTimestamp = () => firestore.FieldValue.serverTimestamp();

export const query = (collectionRef: any, ...queryConstraints: any[]) => {
  let q = collectionRef;
  queryConstraints.forEach(constraint => {
    if (constraint.type === 'orderBy') {
      q = q.orderBy(constraint.field, constraint.direction);
    } else if (constraint.type === 'where') {
      q = q.where(constraint.field, constraint.operator, constraint.value);
    }
  });
  return q;
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({
  type: 'orderBy',
  field,
  direction,
});

export const where = (field: string, operator: any, value: any) => ({
  type: 'where',
  field,
  operator,
  value,
});

export const onSnapshot = (query: any, onNext: any, onError?: any) => {
  return query.onSnapshot(onNext, onError);
};

export const collection = (db: any, collectionPath: string) => {
  return db.collection(collectionPath);
};