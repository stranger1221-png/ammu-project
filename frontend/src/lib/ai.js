import { api, API_BASE } from "./api-client";

export const API = API_BASE;

export const aiLookup = async (query) => {
  const r = await api.post("/ai/lookup", { query });
  return r.data;
};

export const aiStory = async (theme, word, learned_words = []) => {
  const r = await api.post("/ai/story", { theme, word, learned_words });
  return r.data;
};

export const aiTutor = async (message, history = []) => {
  const r = await api.post("/ai/tutor", { message, history });
  return r.data;
};
