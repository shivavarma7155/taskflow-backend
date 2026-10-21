from rest_framework import serializers
from .models import Team, TeamMember, Project

class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = TeamMember
        fields = ('id', 'user', 'username', 'email', 'role', 'joined_at')
        read_only_fields = ('joined_at',)


class TeamSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    memberships = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ('id', 'name', 'created_by', 'created_by_username', 'created_at', 'memberships')
        read_only_fields = ('created_by', 'created_at')


class ProjectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'team', 'team_name', 'visibility', 'created_by', 'created_by_username', 'created_at')
        read_only_fields = ('created_by', 'created_at')