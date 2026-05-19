import PhotoGrid from "@/components/photos/PhotoGrid";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";

export default async function PhotosContent() {
  const initialPhotos = await getUnsplashPhotos({ page: 1, perPage: 10 });
  return <PhotoGrid initialPhotos={initialPhotos} />;
}
