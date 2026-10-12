from flask import Flask, request
from werkzeug.middleware.proxy_fix import ProxyFix

from app import app, configure_trusted_proxy


def test_trusted_proxy_uses_only_the_rightmost_forwarded_client_address():
    test_app = Flask("proxy-fix-test")
    configure_trusted_proxy(test_app)

    @test_app.get("/client-ip")
    def client_ip():
        return {"client_ip": request.remote_addr}

    response = test_app.test_client().get(
        "/client-ip",
        environ_base={"REMOTE_ADDR": "172.18.0.2"},
        headers={
            "X-Forwarded-For": "198.51.100.99, 203.0.113.24",
            "X-Forwarded-Proto": "https",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["client_ip"] == "203.0.113.24"
    assert isinstance(test_app.wsgi_app, ProxyFix)
    assert isinstance(app.wsgi_app, ProxyFix)
