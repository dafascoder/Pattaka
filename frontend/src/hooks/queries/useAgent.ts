import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CreateAgentRequest, UpdateAgentRequest  } from "@/types/api";

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => apiClient.getAgent(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 3
    },
  })
}

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 3
    },
  })
}

export const useCreateAgent = (agent: CreateAgentRequest) => {
  return useMutation({
    mutationFn: () => apiClient.createAgent(agent),
  })
}

export const useUpdateAgent = (id: string, agent: UpdateAgentRequest) => {
  return useMutation({
    mutationFn: () => apiClient.updateAgent(id, agent),
  })
}