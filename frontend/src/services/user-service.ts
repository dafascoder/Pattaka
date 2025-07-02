import { APIResponse, type User } from "@/types/api";
import { fetchWrapper } from "@/utils/fetch-wrapper";
import { loggers } from "@/utils/logger";

export const userService = {
	getUser: async (): Promise<User> => {
		const data = await fetchWrapper("/api/me", {
			method: "GET",
		});

		if (!data.success) {
			throw new Error(data.error || "Failed to fetch user");
		}

		return data.data as User;
	},

	createUser: async (user: User): Promise<User> => {
		const data = await fetchWrapper("/api/users", {
			method: "POST",
			body: JSON.stringify(user),
		});

		if (!data.success) {
			throw new Error(data.error || "Failed to create user");
		}
		return data.data as User;
	},

	updateUser: async (user: User): Promise<User> => {
		const data = await fetchWrapper("/api/users", {
			method: "PUT",
			body: JSON.stringify(user),
		});

		if (!data.success) {
			throw new Error(data.error || "Failed to update user");
		}
		return data.data as User;
	},

	deleteUser: async (user: User) => {
		const data = await fetchWrapper("/api/users", {
			method: "DELETE",
			body: JSON.stringify(user),
		});
		return data;
	},
};
