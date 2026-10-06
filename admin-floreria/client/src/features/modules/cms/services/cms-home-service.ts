import axios from "axios";
import { ADMIN_API_URL } from "@/core/config/public-env";

const cmsApi = axios.create({
  baseURL: ADMIN_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export interface HomeHeroData {
  id?: number;
  lang: string;
  title: string;
  description?: string;
  nameLink?: string;
  images?: Array<{ url: string; alt: string }>;
  link_women?: string;
  link_men?: string;
  backgroundType?: "video" | "carousel";
  videoUrl?: string;
}

export const cmsHomeService = {
  getHomeHero: (lang: string = 'es') =>
    cmsApi.get(`/cms/home`, { params: { lang } }),

  updateHomeHero: (lang: string, data: Partial<HomeHeroData>) =>
    cmsApi.put(`/cms/home/${lang}`, data),
};
