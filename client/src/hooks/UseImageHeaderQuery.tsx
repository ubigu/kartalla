import { useEffect, useState } from 'react';

export function useImageHeaderQuery(
  imageUrl: string,
  postpone: boolean = false,
) {
  const [imageHeaders, setImageHeaders] = useState<Record<string, any> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function getImageHeaders() {
      try {
        setIsLoading(true);
        const res = await fetch(imageUrl, { method: 'HEAD' });

        const headers = await JSON.parse(res.headers.get('File-details'));
        setIsLoading(false);
        setImageHeaders(headers);
      } catch {
        setError(true);
      }
    }
    if (!postpone) {
      getImageHeaders();
    }
  }, [imageUrl, postpone]);

  return { error, imageHeaders, isLoading };
}
