from rest_framework import permissions
from projects.models import TeamMember

class IsProjectMemberOrReadOnly(permissions.BasePermission):
    """
    Ensures only members belonging to the task's parent project team can access or update it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if requesting user belongs to the project's team
        is_member = TeamMember.objects.filter(
            team=obj.project.team,
            user=request.user
        ).exists()

        if not is_member:
            return False

        # SAFE_METHODS (GET, HEAD, OPTIONS) allowed for all verified members
        if request.method in permissions.SAFE_METHODS:
            return True

        # Assignee can update status
        if obj.assignee == request.user:
            return True

        # Team Admin or Project Creator has full write permissions
        is_admin = TeamMember.objects.filter(
            team=obj.project.team,
            user=request.user,
            role='ADMIN'
        ).exists()

        return is_admin or obj.project.created_by == request.user