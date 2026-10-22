const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  getOrders: async () => {
    await delay(300);
    return []; 
  },
  createInvite: async (data) => {
    await delay(500);
    return { success: true, token: Math.random().toString(36).slice(2, 8) };
  },
  updateProfile: async (profileData) => {
    await delay(300);
    return { success: true, data: profileData };
  }
};