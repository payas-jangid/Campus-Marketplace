import {create} from "zustand";
export type Item = {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: { id: string; name: string };
  createdAt: string;
};

interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItemToCache: (newItem: Item) => void;
}

export const useItemStore = create<ItemStore>()((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/items`,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      set({ items: Array.isArray(data) ? data : [], loading: false });
    } catch (err: any) {
      console.error("Error fetching items:", err);
      set({ error: err.message, loading: false });
    }
  },

  addItemToCache: (newItem) =>
    set((state) => ({ items: [newItem, ...state.items] })),
}));
