from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer

User = get_user_model()

def is_admin(user):
    return user.role == 'admin'

# ─── PROJECTS ───────────────────────────────────────────────

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Project.objects.all().order_by('-created_at')
        # Members only see projects they are added to
        return Project.objects.filter(members=user).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        # Only admins can create projects
        if not is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only admins can create projects.')
        project = serializer.save(owner=self.request.user)
        # Admin is automatically added as a member
        project.members.add(self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Project.objects.all()
        return Project.objects.filter(members=user).distinct()

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can update projects.'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can delete projects.'}, status=403)
        return super().destroy(request, *args, **kwargs)

# ─── MEMBERS ────────────────────────────────────────────────

class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Add a member to a project. Admin only. Min 2, Max 7 members."""
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can add members.'}, status=403)

        project = get_object_or_404(Project, pk=pk)
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=400)

        user = get_object_or_404(User, pk=user_id)

        # Don't add admin again
        if user == project.owner:
            return Response({'detail': 'Admin is already the project owner.'}, status=400)

        # Check if already a member
        if project.members.filter(id=user.id).exists():
            return Response({'detail': f'{user.username} is already a member.'}, status=400)

        # Enforce max 7 members (excluding admin/owner)
        current_member_count = project.members.exclude(id=project.owner.id).count()
        if current_member_count >= 7:
            return Response({'detail': 'Maximum 7 members allowed per project.'}, status=400)

        project.members.add(user)

        # Return updated project
        serializer = ProjectSerializer(project)
        return Response({
            'detail': f'{user.username} added to project.',
            'project': serializer.data
        })

    def delete(self, request, pk):
        """Remove a member from a project. Admin only."""
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can remove members.'}, status=403)

        project = get_object_or_404(Project, pk=pk)
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id)

        if user == project.owner:
            return Response({'detail': 'Cannot remove the project owner.'}, status=400)

        # Enforce min 2 members (excluding admin/owner)
        current_member_count = project.members.exclude(id=project.owner.id).count()
        if current_member_count <= 2:
            return Response({'detail': 'Minimum 2 members required in a project.'}, status=400)

        project.members.remove(user)
        serializer = ProjectSerializer(project)
        return Response({
            'detail': f'{user.username} removed from project.',
            'project': serializer.data
        })

    def get(self, request, pk):
        """Get all members of a project."""
        project = get_object_or_404(Project, pk=pk)
        if not is_admin(request.user) and not project.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Not authorized.'}, status=403)
        from accounts.serializers import UserSerializer
        members = project.members.exclude(id=project.owner.id)
        return Response({
            'project_id': pk,
            'project_name': project.name,
            'member_count': members.count(),
            'members': UserSerializer(members, many=True).data
        })

# ─── TASKS ──────────────────────────────────────────────────

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.kwargs.get('project_id')

        if project_id:
            project = get_object_or_404(Project, pk=project_id)
            # Both admin and members of the project can see tasks
            if is_admin(user) or project.members.filter(id=user.id).exists():
                return Task.objects.filter(project=project).order_by('-created_at')
            return Task.objects.none()

        if is_admin(user):
            return Task.objects.all().order_by('-created_at')

        # Members only see tasks in their projects
        return Task.objects.filter(
            project__members=user
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        # Only admins can create/assign tasks
        if not is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only admins can create tasks.')
        serializer.save(created_by=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Task.objects.all()
        return Task.objects.filter(project__members=user).distinct()

    def update(self, request, *args, **kwargs):
        user = request.user
        task = self.get_object()

        if is_admin(user):
            # Admin can update everything
            return super().update(request, *args, **kwargs)

        # Members can ONLY update their own task's status
        if task.assigned_to != user:
            return Response({'detail': 'You can only update tasks assigned to you.'}, status=403)

        allowed_fields = {'status'}
        if not set(request.data.keys()).issubset(allowed_fields):
            return Response({'detail': 'Members can only update task status.'}, status=403)

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can delete tasks.'}, status=403)
        return super().destroy(request, *args, **kwargs)

# ─── DASHBOARD ──────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        if is_admin(user):
            # Admin sees EVERYTHING
            projects = Project.objects.all()
            tasks = Task.objects.all()
            all_members = User.objects.filter(role='member')

            overdue = tasks.filter(due_date__lt=today).exclude(status='done')

            return Response({
                'role': 'admin',
                'total_projects': projects.count(),
                'total_tasks': tasks.count(),
                'total_members': all_members.count(),
                'todo': tasks.filter(status='todo').count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'done': tasks.filter(status='done').count(),
                'overdue': overdue.count(),
                'recent_projects': ProjectSerializer(
                    projects.order_by('-created_at')[:5], many=True
                ).data,
                'overdue_tasks': TaskSerializer(overdue[:5], many=True).data,
            })

        else:
            # Member sees ONLY their data
            my_projects = Project.objects.filter(members=user).distinct()
            my_tasks = Task.objects.filter(
                project__members=user
            ).distinct()
            assigned_to_me = Task.objects.filter(assigned_to=user)
            overdue = assigned_to_me.filter(
                due_date__lt=today
            ).exclude(status='done')

            return Response({
                'role': 'member',
                'my_projects': my_projects.count(),
                'total_tasks': my_tasks.count(),
                'assigned_to_me': assigned_to_me.count(),
                'todo': assigned_to_me.filter(status='todo').count(),
                'in_progress': assigned_to_me.filter(status='in_progress').count(),
                'done': assigned_to_me.filter(status='done').count(),
                'overdue': overdue.count(),
                'my_assigned_tasks': TaskSerializer(
                    assigned_to_me.order_by('-created_at')[:10], many=True
                ).data,
                'overdue_tasks': TaskSerializer(overdue[:5], many=True).data,
                'my_projects_list': ProjectSerializer(my_projects, many=True).data,
            })