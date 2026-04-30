/**
 * Firebase Database Service
 *
 * Source: chemcheck-ai/lib/firebase-db.ts
 * Adapted for Hazalyze Platform
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  DocumentData,
  Firestore,
} from "firebase/firestore";
import { db } from "./config";

class DatabaseService {
  db: Firestore;

  constructor() {
    this.db = db as Firestore;
  }

  async addDocument(collectionPath: string, data: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, collectionPath), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionPath}:`, error);
      throw error;
    }
  }

  async getDocuments(collectionPath: string): Promise<DocumentData[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, collectionPath));
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting documents from ${collectionPath}:`, error);
      return [];
    }
  }

  async getDocumentsByField(
    collectionPath: string,
    field: string,
    value: any,
  ): Promise<DocumentData[]> {
    try {
      const q = query(
        collection(this.db, collectionPath),
        where(field, "==", value),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(
        `Error getting documents by field from ${collectionPath}:`,
        error,
      );
      return [];
    }
  }

  async getDocumentById(
    collectionPath: string,
    docId: string,
  ): Promise<DocumentData | null> {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error(
        `Error getting document by ID from ${collectionPath}:`,
        error,
      );
      return null;
    }
  }

  async updateDocument(
    collectionPath: string,
    docId: string,
    data: any,
  ): Promise<boolean> {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error(`Error updating document in ${collectionPath}:`, error);
      return false;
    }
  }

  async deleteDocument(
    collectionPath: string,
    docId: string,
  ): Promise<boolean> {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionPath}:`, error);
      return false;
    }
  }
}

export const dbService = new DatabaseService();
