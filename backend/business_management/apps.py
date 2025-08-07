from django.apps import AppConfig


class BusinessManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'business_management'
    
    def ready(self):
        """
        Import signals when the app is ready.
        This ensures that all signal handlers are properly connected.
        """
        import business_management.signals
