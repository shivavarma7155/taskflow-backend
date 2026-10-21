from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from projects.models import Team, TeamMember, Project
from tasks.models import Task

class TaskAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(username="adminuser", password="password123")
        self.dev_user = User.objects.create_user(username="devuser", password="password123")
        self.outsider = User.objects.create_user(username="outsider", password="password123")

        # Create team and memberships
        self.team = Team.objects.create(name="Core Team", created_by=self.admin_user)
        TeamMember.objects.create(team=self.team, user=self.admin_user, role="ADMIN")
        TeamMember.objects.create(team=self.team, user=self.dev_user, role="MEMBER")

        # Create project
        self.project = Project.objects.create(
            name="Platform v1",
            team=self.team,
            created_by=self.admin_user
        )

        # Create initial task assigned to dev_user
        self.task = Task.objects.create(
            title="Setup MySQL Connection",
            project=self.project,
            assignee=self.dev_user,
            created_by=self.admin_user,
            status="TODO"
        )

        self.tasks_url = "/api/tasks/"
        self.task_detail_url = f"/api/tasks/{self.task.id}/"

    def test_unauthenticated_request_fails(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        response = self.client.get(self.tasks_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_team_member_can_view_tasks(self):
        """Dev user within team should see tasks."""
        self.client.force_authenticate(user=self.dev_user)
        response = self.client.get(self.tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_outsider_cannot_view_tasks(self):
        """Users outside the team should see zero tasks from this team."""
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(self.tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_assignee_can_update_task_status(self):
        """Assignee can change status to IN_PROGRESS."""
        self.client.force_authenticate(user=self.dev_user)
        payload = {"status": "IN_PROGRESS"}
        response = self.client.patch(self.task_detail_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "IN_PROGRESS")