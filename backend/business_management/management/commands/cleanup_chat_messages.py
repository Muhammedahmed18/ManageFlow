from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from business_management.models import ChatMessage


class Command(BaseCommand):
    help = 'Clean up old chat messages to prevent database clutter'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep messages (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get messages to be deleted
        old_messages = ChatMessage.objects.filter(created_at__lt=cutoff_date)
        count = old_messages.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No messages older than {days} days found.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {count} messages older than {days} days '
                    f'(before {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")})'
                )
            )
            
            # Show some examples
            examples = old_messages[:5]
            if examples:
                self.stdout.write('\nExample messages to be deleted:')
                for msg in examples:
                    self.stdout.write(
                        f'  - {msg.created_at.strftime("%Y-%m-%d %H:%M:%S")}: '
                        f'{msg.sender.username}: {msg.message[:50]}...'
                    )
        else:
            # Actually delete the messages
            deleted_count, _ = old_messages.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {deleted_count} messages older than {days} days.'
                )
            )
            
            # Show remaining message count
            total_messages = ChatMessage.objects.count()
            self.stdout.write(f'Total messages remaining: {total_messages}')
