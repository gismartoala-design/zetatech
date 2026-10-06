import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveApiUrl } from "@/lib/api";
import { TESTIMONIALS } from "@/data/mock";

export interface Review {
  id?: string;
  name: string;
  content: string;
  stars: number;
  role?: string;
  createdAt?: string;
}

const API_URL = "/api/external/reviews";
export const reviewsQueryKey = ["reviews"] as const;

export async function fetchReviews(baseUrl?: string): Promise<Review[]> {
  try {
    const res = await fetch(resolveApiUrl(API_URL, baseUrl));
    if (!res.ok) throw new Error("Error al cargar reseñas");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn("Error fetching reviews from API, using fallback data:", error);
    return TESTIMONIALS;
  }
}

export function useReviews(enabled = true) {
  return useQuery<Review[], Error>({
    queryKey: reviewsQueryKey,
    queryFn: () => fetchReviews(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReview: Review) => {
      const res = await fetch(resolveApiUrl(API_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
      });
      if (!res.ok) throw new Error("Error al enviar reseña");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
