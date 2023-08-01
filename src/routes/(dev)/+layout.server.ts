import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "../$types";

export const load:LayoutServerLoad = async (event) => {
  if (!import.meta.env.DEV) throw error(404, "Not found")
}