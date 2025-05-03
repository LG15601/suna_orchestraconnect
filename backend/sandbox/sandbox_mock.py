"""
Mock implementation of the sandbox module to avoid Daytona dependency issues.
"""

class SandboxToolsBase:
    """Base class for sandbox tools."""
    def __init__(self, *args, **kwargs):
        pass

class Sandbox:
    """Mock sandbox class."""
    def __init__(self, *args, **kwargs):
        self.id = "mock-sandbox-id"
        self.url = "http://localhost:8080"
        self.password = "mock-password"
        self.status = "running"
        
    def get_browser_url(self):
        return "http://localhost:8080"
        
    def get_vnc_url(self):
        return "http://localhost:5901"
        
    def get_api_url(self):
        return "http://localhost:8000"
        
    def get_password(self):
        return "mock-password"
        
def create_sandbox(*args, **kwargs):
    """Create a mock sandbox."""
    return Sandbox()
    
def get_or_start_sandbox(*args, **kwargs):
    """Get or start a mock sandbox."""
    return Sandbox()
