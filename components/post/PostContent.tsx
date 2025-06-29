interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  return (
    <div className="px-3 pb-2">
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
