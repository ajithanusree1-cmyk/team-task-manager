from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView, ProjectMembersView,
    TaskListCreateView, TaskDetailView, DashboardView
)

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/members/', ProjectMembersView.as_view(), name='project-members'),
    path('projects/<int:project_id>/tasks/', TaskListCreateView.as_view(), name='project-tasks'),
    path('tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
]