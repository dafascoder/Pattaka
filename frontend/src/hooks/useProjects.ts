import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project-service';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';
import { toast } from 'sonner';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  usage: (id: string) => [...projectKeys.detail(id), 'usage'] as const,
};

// Hooks
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectService.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectService.getProject(projectId),
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectUsage(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.usage(projectId),
    queryFn: () => projectService.getProjectUsage(projectId),
    enabled: enabled && !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute (usage data changes more frequently)
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.createProject(data),
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
      
      toast.success('Project created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectRequest }) =>
      projectService.updateProject(projectId, data),
    onSuccess: (updatedProject, { projectId }) => {
      // Update the project in cache
      queryClient.setQueryData(projectKeys.detail(projectId), updatedProject);
      
      // Invalidate projects list to refresh
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
} 