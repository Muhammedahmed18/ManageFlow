"""
Business Management Services
===========================

This module contains business logic services for the business management system.
Services handle complex operations like invoice number generation, tax calculation, and revenue calculations.
"""

from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from .models import Invoice, EndCustomer, InvoiceItem


class InvoiceService:
    """
    Invoice Service
    --------------
    Handles invoice-related business logic including number generation and tax calculations.
    """
    
    @staticmethod
    def generate_invoice_number(business_id, invoice_type):
        """
        Generate a unique invoice number based on business and invoice type.
        
        Args:
            business_id (int): The business ID
            invoice_type (str): 'manufacturer' or 'customer'
            
        Returns:
            str: Generated invoice number
        """
        prefix = "CUST" if invoice_type == 'customer' else "MANU"
        last_invoice = Invoice.objects.filter(
            business_id=business_id,
            invoice_type=invoice_type
        ).order_by('-invoice_number').first()
        
        if last_invoice:
            try:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
            
        return f"{prefix}-{business_id}-{new_number:04d}"

    @staticmethod
    def calculate_tax_and_total(subtotal, tax_percentage):
        """
        Calculate tax amount and total amount based on subtotal and tax percentage.
        
        Args:
            subtotal (Decimal): The subtotal amount
            tax_percentage (Decimal): The tax percentage
            
        Returns:
            tuple: (tax_amount, total_amount)
        """
        tax_amount = (subtotal * tax_percentage) / 100
        total_amount = subtotal + tax_amount
        return tax_amount, total_amount

    @staticmethod
    def create_invoice_with_items(invoice_data, items_data):
        """
        Create an invoice with multiple items in a transaction.
        
        Args:
            invoice_data (dict): Invoice data
            items_data (list): List of item data dictionaries
            
        Returns:
            Invoice: Created invoice instance
        """
        with transaction.atomic():
            invoice_data['invoice_number'] = InvoiceService.generate_invoice_number(
                invoice_data['business_id'],
                invoice_data['invoice_type']
            )
            
            if invoice_data['invoice_type'] == 'customer':
                end_customer = EndCustomer.objects.get(id=invoice_data['recipient_id'])
                invoice_data['recipient_name'] = end_customer.name
            else:
                invoice_data['recipient_name'] = "Manufacturer"  # Placeholder, needs actual manufacturer name logic
            
            invoice = Invoice.objects.create(**invoice_data)
            
            for item_data in items_data:
                item_data['invoice'] = invoice
                InvoiceItem.objects.create(**item_data)
            
            return invoice


class RevenueService:
    """
    Revenue Service
    ---------------
    Handles revenue-related calculations and analytics.
    """
    
    @staticmethod
    def get_customer_revenue(business_id, period='all'):
        """
        Get total customer revenue for a business.
        
        Args:
            business_id (int): The business ID
            period (str): Time period filter ('all', 'month', 'year')
            
        Returns:
            Decimal: Total customer revenue
        """
        queryset = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status='paid'
        )
        # Add date filtering for period if needed
        return queryset.aggregate(total=Sum('total_amount'))['total'] or 0

    @staticmethod
    def get_manufacturer_costs(business_id, period='all'):
        """
        Get total manufacturer costs for a business.
        
        Args:
            business_id (int): The business ID
            period (str): Time period filter ('all', 'month', 'year')
            
        Returns:
            Decimal: Total manufacturer costs
        """
        queryset = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='manufacturer',
            status='paid'
        )
        # Add date filtering for period if needed
        return queryset.aggregate(total=Sum('total_amount'))['total'] or 0

    @staticmethod
    def get_net_profit(business_id, period='all'):
        """
        Calculate net profit (customer revenue - manufacturer costs).
        
        Args:
            business_id (int): The business ID
            period (str): Time period filter ('all', 'month', 'year')
            
        Returns:
            Decimal: Net profit
        """
        customer_revenue = RevenueService.get_customer_revenue(business_id, period)
        manufacturer_costs = RevenueService.get_manufacturer_costs(business_id, period)
        return customer_revenue - manufacturer_costs

    @staticmethod
    def get_revenue_summary(business_id):
        """
        Get comprehensive revenue summary for a business.
        
        Args:
            business_id (int): The business ID
            
        Returns:
            dict: Revenue summary data
        """
        customer_revenue = RevenueService.get_customer_revenue(business_id)
        manufacturer_costs = RevenueService.get_manufacturer_costs(business_id)
        net_profit = customer_revenue - manufacturer_costs
        
        total_sales = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer'
        ).count()
        
        paid_sales = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status='paid'
        ).count()
        
        return {
            'customer_revenue': float(customer_revenue),
            'manufacturer_costs': float(manufacturer_costs),
            'net_profit': float(net_profit),
            'total_sales': total_sales,
            'paid_sales': paid_sales,
            'payment_rate': (paid_sales / total_sales * 100) if total_sales > 0 else 0
        }
