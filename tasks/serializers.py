from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.name')
    assignee_username = serializers.ReadOnlyField(source='assignee.username')
    created_by_username = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'project', 'project_name', 'assignee', 'assignee_username',
            'created_by', 'created_by_username', 'due_date', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_by', 'created_at', 'updated_at')