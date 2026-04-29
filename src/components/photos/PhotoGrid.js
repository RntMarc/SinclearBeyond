"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import PhotoItem from "./PhotoItem";

function getNumCols() {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth >= 1280) return 4;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

function distribute(photos, n) {
  const cols = Array.from({ length: n }, () => []);
  photos.forEach((p, i) => cols[i % n].push(p));
  return cols;
}

export default function PhotoGrid({ initialPhotos }) {
  // SSR-safe: start with 1 col, redistribute on mount
  const [columns, setColumns] = useState([initialPhotos]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  // Redistribute to correct col count on mount
  useEffect(() => {
    const n = getNumCols();
    setColumns(distribute(initialPhotos, n));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redistribute on resize (only changes col count, reflow OK here)
  useEffect(() => {
    let timeout;
    function handleResize() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setColumns((prev) => {
          const n = getNumCols();
          if (n === prev.length) return prev;
          return distribute(prev.flat(), n);
        });
      }, 150);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const loadMorePhotos = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const newPhotos = await getUnsplashPhotos({ page: nextPage, perPage: 10 });

    if (newPhotos.length === 0) {
      setHasMore(false);
    } else {
      setColumns((prev) => {
        const cols = prev.map((c) => [...c]);
        const offset = cols.reduce((s, c) => s + c.length, 0);
        newPhotos.forEach((p, i) => {
          cols[(offset + i) % cols.length].push(p);
        });
        return cols;
      });
      setPage(nextPage);
    }
    setLoading(false);
  }, [loading, hasMore, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMorePhotos();
        }
      },
      { threshold: 1.0 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, hasMore, loadMorePhotos]);

  const totalPhotos = columns.reduce((s, c) => s + c.length, 0);

  if (totalPhotos === 0 && !loading) {
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
      <div className="flex gap-4 items-start">
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-4">
            {col.map((photo, pi) => (
              <PhotoItem key={`${photo.id}-${ci}-${pi}`} photo={photo} />
            ))}
          </div>
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
        {!hasMore && totalPhotos > 0 && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Alle Fotos geladen
          </p>
        )}
      </div>
    </div>
  );
}
