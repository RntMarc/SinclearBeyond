"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import PhotoItem from "./PhotoItem";

export default function PhotoGrid({ initialPhotos }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const loadMorePhotos = useCallback(async () => {
    setLoading(true);
    const nextPage = page + 1;
    const newPhotos = await getUnsplashPhotos({ page: nextPage, perPage: 10 });

    if (newPhotos.length === 0) {
      setHasMore(false);
    } else {
      setPhotos((prev) => [...prev, ...newPhotos]);
      setPage(nextPage);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMorePhotos();
        }
      },
      { threshold: 1.0 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loading, hasMore, loadMorePhotos]);

  if (photos.length === 0 && !loading) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-12 text-center">
        <p className="text-muted-foreground italic">
          Momentan sind keine Fotos verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((photo, index) => (
          <PhotoItem key={`${photo.id}-${index}`} photo={photo} />
        ))}
      </div>

      <div ref={loaderRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full animation-delay-200" />
            <div className="w-2 h-2 bg-primary rounded-full animation-delay-400" />
            <span className="ml-2 text-sm uppercase tracking-widest font-medium">
              Lade mehr...
            </span>
          </div>
        )}
        {!hasMore && photos.length > 0 && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Alle Fotos geladen
          </p>
        )}
      </div>
    </div>
  );
}
