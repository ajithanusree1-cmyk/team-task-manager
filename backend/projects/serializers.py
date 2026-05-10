from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Task

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserMiniSerializer(source='assigned_to', read_only=True)
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'project',
            'assigned_to', 'assigned_to_detail',
            'created_by', 'created_by_detail',
            'status', 'priority', 'due_date', 'is_overdue',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_by', 'created_at', 'updated_at')

class ProjectSerializer(serializers.ModelSerializer):
    owner_detail = UserMiniSerializer(source='owner', read_only=True)
    members_detail = UserMiniSerializer(source='members', many=True, read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'description',
            'owner', 'owner_detail',
            'members', 'members_detail',
            'tasks_count', 'completed_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('owner', 'created_at', 'updated_at')

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_count(self, obj):
        return obj.tasks.filter(status='done').count()