import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Optional: secure with a token
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fix old posts
    const postSnap = await getDocs(collection(db, "posts"));
    const postFixes = postSnap.docs.map(async (docSnap) => {
      const data = docSnap.data();
      if (!("deleted" in data)) {
        await updateDoc(doc(db, "posts", docSnap.id), { deleted: false });
      }
    });
    await Promise.all(postFixes);

    // Fix comments under each post
    for (const postDoc of postSnap.docs) {
      const postId = postDoc.id;
      const commentsRef = collection(db, `posts/${postId}/comments`);
      const commentsSnap = await getDocs(commentsRef);

      for (const commentDoc of commentsSnap.docs) {
        const data = commentDoc.data();
        if (!("deleted" in data)) {
          await updateDoc(
            doc(db, `posts/${postId}/comments`, commentDoc.id),
            { deleted: false }
          );
        }
      }
    }

    return NextResponse.json({ message: "✅ All posts and comments fixed" });
  } catch (error) {
    console.error("Fixing failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}