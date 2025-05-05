from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

User = get_user_model()

class Command(BaseCommand):
    help = 'Delete a user and all related tokens (by email or username)'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email of the user to delete')
        parser.add_argument('--username', type=str, help='Username of the user to delete')

    def handle(self, *args, **options):
        email = options['email']
        username = options['username']

        try:
            if email:
                user = User.objects.get(email=email)
            elif username:
                user = User.objects.get(username=username)
            else:
                self.stdout.write(self.style.ERROR("Provide --email or --username"))
                return

            # Delete all user's tokens
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.filter(token=token).delete()
                token.delete()

            # Delete the user
            user.delete()

            self.stdout.write(self.style.SUCCESS(f"✅ User '{user.username}' and related tokens deleted."))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("User not found."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
