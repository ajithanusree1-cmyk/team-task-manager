from rest_framework.permissions import BasePermission

class IsProjectOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.owner == request.user

class IsProjectMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'project'):
            return (
                obj.project.members.filter(id=request.user.id).exists() or
                obj.project.owner == request.user
            )
        return (
            obj.members.filter(id=request.user.id).exists() or
            obj.owner == request.user
        )