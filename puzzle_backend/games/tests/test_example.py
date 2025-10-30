import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_loginpage_loads(client):
    response = client.get("/login/")  # 👈 Add the slash
    assert response.status_code in (200, 302)
