import { fetchWrapper } from "../utils/fetch-wrapper";

export const authService = {
	login: async (email: string, password: string) => {
		const response = await fetchWrapper("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});

		return response;
	},

	register: async (name: string, email: string, password: string) => {
		const response = await fetchWrapper("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({ name, email, password }),
		});

		return response;
	},

	logout: async () => {
		const response = await fetchWrapper("/api/auth/logout", {
			method: "POST",
		});

		return response;
	},
};
