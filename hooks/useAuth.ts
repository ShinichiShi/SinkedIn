import { useState, useCallback, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { UserData } from "@/types/index";

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
  const [userFollowing, setUserFollowing] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null); 
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  const fetchCurrentUserProfile = useCallback(async (user: any) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDoc);

      if (!docSnap.exists()) {
        throw new Error("User document does not exist");
      }

      const fetchedUserData = docSnap.data() as UserData;
      setUserData(fetchedUserData); // ✅ store userData in state
      setCurrentUser({ ...user, uid: user.uid });
      setUserFollowing(fetchedUserData?.following || []);

      setCurrentUserProfilePic(
        fetchedUserData?.profilepic ||
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
      );
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setCurrentUserProfilePic(
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCurrentUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserData(null); 
        setUserFollowing([]);
        setCurrentUserProfilePic("");
        setLoading(false);

        if (authInitialized) {
          router.push("/login");
        }
      }

      if (!authInitialized) {
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [fetchCurrentUserProfile, router, authInitialized]);

  return {
    currentUser,
    currentUserProfilePic,
    userFollowing,
    setUserFollowing,
    userData,
    loading,
    authInitialized,
  };
};
