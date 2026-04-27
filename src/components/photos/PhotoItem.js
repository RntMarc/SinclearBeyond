"use client";
import { ExternalLink } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";

export default function PhotoItem({ photo }) {
  return (
    <div className="break-inside-avoid group relative overflow-hidden rounded-xl bg-sidebar border border-sidebar-border transition-all hover:shadow-xl hover:-translate-y-1">
      <img
        src={photo.url}
        alt={photo.description || "Unsplash Photo"}
        className="w-full h-auto object-cover"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        {photo.description && (
          <p className="text-white text-sm line-clamp-2 mb-2 font-medium">
            {photo.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <a
            href={`https://unsplash.com/@${photo.unsplashUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{photo.userDisplayName}</span>
            <ExternalLink size={10} />
          </a>
          <a
            href={photo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
            title="Auf Unsplash ansehen"
          >
            <BrandIcon
              name="Unsplash"
              size={14}
              className="grayscale brightness-200"
            />
          </a>
        </div>
      </div>

      {/* Fallback for mobile or touch where hover isn't as prevalent */}
      <div className="sm:hidden p-3 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground mb-1">Foto von</p>
        <a
          href={`https://unsplash.com/@${photo.unsplashUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground flex items-center gap-1"
        >
          {photo.userDisplayName}
          <ExternalLink size={12} className="text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
