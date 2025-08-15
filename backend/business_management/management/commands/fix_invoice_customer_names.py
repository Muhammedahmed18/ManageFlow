from django.core.management.base import BaseCommand
from business_management.models import Invoice, EndCustomer


class Command(BaseCommand):
    help = 'Fix customer names for invoices that have NULL customer_name'

    def add_arguments(self, parser):
        parser.add_argument(
            '--invoice-id',
            type=int,
            help='Fix a specific invoice by ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Fix all invoices with NULL customer_name',
        )

    def handle(self, *args, **options):
        if options['invoice_id']:
            # Fix specific invoice
            try:
                invoice = Invoice.objects.get(id=options['invoice_id'])
                self.fix_invoice_customer_name(invoice)
            except Invoice.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Invoice with ID {options["invoice_id"]} does not exist')
                )
        elif options['all']:
            # Fix all invoices with NULL customer_name
            invoices = Invoice.objects.filter(
                customer_name__isnull=True,
                invoice_type='customer'
            )
            fixed_count = 0
            
            for invoice in invoices:
                if self.fix_invoice_customer_name(invoice):
                    fixed_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully fixed customer names for {fixed_count} invoices')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Please specify --invoice-id or --all')
            )

    def fix_invoice_customer_name(self, invoice):
        """Fix customer name for a single invoice"""
        try:
            if invoice.customer_name is not None:
                self.stdout.write(
                    f'Invoice {invoice.id} ({invoice.invoice_number}) already has customer_name: {invoice.customer_name}'
                )
                return False
            
            # Try to find customer name from recipient_id
            if invoice.recipient_id:
                try:
                    end_customer = EndCustomer.objects.get(id=invoice.recipient_id)
                    invoice.customer_name = end_customer.name
                    invoice.save()
                    self.stdout.write(
                        f'Fixed invoice {invoice.id} ({invoice.invoice_number}): '
                        f'customer_name set to "{end_customer.name}" from recipient_id {invoice.recipient_id}'
                    )
                    return True
                except EndCustomer.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Invoice {invoice.id} has recipient_id {invoice.recipient_id} but EndCustomer not found'
                        )
                    )
            
            # If no recipient_id or EndCustomer not found, try to infer from business end customers
            if invoice.business:
                end_customers = EndCustomer.objects.filter(business=invoice.business)
                if end_customers.count() == 1:
                    # Only one end customer for this business, use it
                    end_customer = end_customers.first()
                    invoice.customer_name = end_customer.name
                    invoice.recipient_id = end_customer.id
                    invoice.save()
                    self.stdout.write(
                        f'Fixed invoice {invoice.id} ({invoice.invoice_number}): '
                        f'customer_name set to "{end_customer.name}" (only end customer for business)'
                    )
                    return True
                elif end_customers.count() > 1:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Invoice {invoice.id} business has multiple end customers, cannot auto-assign'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Invoice {invoice.id} business has no end customers'
                        )
                    )
            
            return False
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error fixing invoice {invoice.id}: {str(e)}')
            )
            return False
