import axios from "axios";
import { ADMIN_BACKEND_URL } from "@/core/config/public-env";
import type {
  CreateSegmentPayload,
  UpdateSegmentPayload,
} from "../interfaces/segments-interface";

const loyaltyApi = axios.create({
  baseURL: ADMIN_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const segmentsApi = {
  getAll: () => loyaltyApi.get("/loyalty/segments"),
  getOne: (id: string) => loyaltyApi.get(`/loyalty/segments/${id}`),
  evaluate: (id: string) => loyaltyApi.post(`/loyalty/segments/${id}/evaluate`),
  // preview: (rules: any) =>
  //   loyaltyApi.post("/loyalty/segments/preview", { rules }),
  create: (data: CreateSegmentPayload) =>
    loyaltyApi.post("/loyalty/segments", data),
  update: (id: string, data: UpdateSegmentPayload) =>
    loyaltyApi.patch(`/loyalty/segments/${id}`, data),
  delete: (id: string) => loyaltyApi.delete(`/loyalty/segments/${id}`),
};
