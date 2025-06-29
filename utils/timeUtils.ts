export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return "";

  const now = new Date();
  const postDate = timestamp?.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);

  if (!(postDate instanceof Date) || isNaN(postDate.getTime())) {
    return "";
  }

  const diffInMs = now.getTime() - postDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  } else {
    return postDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }
};