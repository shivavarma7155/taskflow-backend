from rest_framework import viewsets, permissions
from .models import Team, Project
from .serializers import TeamSerializer, ProjectSerializer

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return teams where the user is either the creator or a member
        return Team.objects.filter(memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        # Automatically make creator the ADMIN member
        team.memberships.create(user=self.request.user, role='ADMIN')


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see projects belonging to teams they are a member of
        return Project.objects.filter(team__memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)