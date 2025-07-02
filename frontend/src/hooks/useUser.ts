import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user-service";
import type { User } from "@/types/api";

export const useUser = () => {
	const queryClient = useQueryClient();
	const getUser = useQuery({
		queryKey: ["user"],
		queryFn: () => userService.getUser(),
	});

	const createUser = useMutation({
		mutationFn: (user: User) => userService.createUser(user),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
		},
	});

	const updateUser = useMutation({
		mutationFn: (user: User) => userService.updateUser(user),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
		},
	});

	const deleteUser = useMutation({
		mutationFn: (user: User) => userService.deleteUser(user),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
		},
	});

	return {
		getUser,
		createUser,
		updateUser,
		deleteUser,
	};
};
