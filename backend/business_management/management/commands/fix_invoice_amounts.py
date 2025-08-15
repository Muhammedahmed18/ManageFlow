from django.core.management.base import BaseCommand
from business_management.models import Invoice


class Command(BaseCommand):
    help = 'Fix invoice amounts by recalculating totals from InvoiceItem objects'

    def add_arguments(self, parser):
        parser.add_argument(
            '--invoice-id',
            type=int,
            help='Fix a specific invoice by ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Fix all invoices',
        )

    def handle(self, *args, **options):
        if options['invoice_id']:
            # Fix specific invoice
            try:
                invoice = Invoice.objects.get(id=options['invoice_id'])
                self.fix_invoice(invoice)
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully fixed invoice {invoice.id} ({invoice.invoice_number})')
                )
            except Invoice.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Invoice with ID {options["invoice_id"]} does not exist')
                )
        elif options['all']:
            # Fix all invoices
            invoices = Invoice.objects.all()
            fixed_count = 0
            
            for invoice in invoices:
                if self.fix_invoice(invoice):
                    fixed_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully fixed {fixed_count} invoices')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Please specify --invoice-id or --all')
            )

    def fix_invoice(self, invoice):
        """Fix a single invoice by recalculating totals"""
        try:
            # Store original values for comparison
            original_amount = invoice.amount
            original_total_amount = invoice.total_amount
            
            # Recalculate totals from invoice items
            invoice.recalculate_totals_from_items()
            invoice.save()
            
            # Check if values changed
            if original_amount != invoice.amount or original_total_amount != invoice.total_amount:
                self.stdout.write(
                    f'Fixed invoice {invoice.id} ({invoice.invoice_number}): '
                    f'amount {original_amount} -> {invoice.amount}, '
                    f'total_amount {original_total_amount} -> {invoice.total_amount}'
                )
                return True
            else:
                self.stdout.write(
                    f'Invoice {invoice.id} ({invoice.invoice_number}) already has correct amounts'
                )
                return False
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error fixing invoice {invoice.id}: {str(e)}')
            )
            return False
