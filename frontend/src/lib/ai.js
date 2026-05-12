import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "/_/backend";
export const API = `${BACKEND_URL}/api`;

export const aiLookup = async (query) => {
  const r = await axios.post(`${API}/ai/lookup`, { query });
  return r.data;
};

export const aiStory = async (theme, word, learned_words = []) => {
  const r = await axios.post(`${API}/ai/story`, { theme, word, learned_words });
  return r.data;
};

export const aiTutor = async (message, history = []) => {
  const r = await axios.post(`${API}/ai/tutor`, { message, history });
  return r.data;
};
