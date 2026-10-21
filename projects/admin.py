from django.contrib import admin
from .models import Team, TeamMember, Project

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name',)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('team', 'user', 'role', 'joined_at')
    list_filter = ('role', 'team')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'team', 'visibility', 'created_by', 'created_at')
    list_filter = ('visibility', 'team')
    search_fields = ('name', 'description')