from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer


from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer
from .permissions import IsProjectMemberOrReadOnly



class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # N+1 query optimization using select_related
        queryset = Task.objects.select_related('project', 'assignee', 'created_by')
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberOrReadOnly]

    def get_queryset(self):
        # Query optimization: select_related fetches foreign keys in a single SQL JOIN
        return Task.objects.filter(
            project__team__memberships__user=self.request.user
        ).select_related('project', 'assignee', 'created_by').distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)