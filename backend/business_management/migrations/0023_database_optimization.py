"""
Database Optimization Migration
===============================
Adds database indexes, optimizes queries, and improves performance.
"""

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('business_management', '0022_invoice_invoiceformtemplate_invoicefieldposition_and_more'),
    ]

    operations = [
        # Add database indexes for better query performance
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['business', 'category'], name='product_business_category_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['template', 'business'], name='product_template_business_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['custom_id'], name='product_custom_id_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['created_at'], name='product_created_at_idx'),
        ),
        
        # Order indexes
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['business', 'status'], name='order_business_status_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['customer', 'business'], name='order_customer_business_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_number'], name='order_number_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['created_at'], name='order_created_at_idx'),
        ),
        
        # Invoice indexes
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['business', 'status'], name='invoice_business_status_idx'),
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['invoice_number'], name='invoice_number_idx'),
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['due_date'], name='invoice_due_date_idx'),
        ),
        
        # Product field value indexes
        migrations.AddIndex(
            model_name='productfieldvalue',
            index=models.Index(fields=['product', 'field'], name='productfieldvalue_product_field_idx'),
        ),
        
        # Template field indexes
        migrations.AddIndex(
            model_name='templatefield',
            index=models.Index(fields=['template', 'order'], name='templatefield_template_order_idx'),
        ),
        
        # Category indexes
        migrations.AddIndex(
            model_name='productcategory',
            index=models.Index(fields=['business', 'parent'], name='productcategory_business_parent_idx'),
        ),
        
        # Status history indexes
        migrations.AddIndex(
            model_name='orderstatushistory',
            index=models.Index(fields=['order', 'changed_at'], name='orderstatushistory_order_changed_idx'),
        ),
        
        # Number config indexes
        migrations.AddIndex(
            model_name='numberconfig',
            index=models.Index(fields=['business', 'config_type'], name='numberconfig_business_type_idx'),
        ),
        
        # Prediction indexes
        migrations.AddIndex(
            model_name='predictionrecord',
            index=models.Index(fields=['business', 'prediction_date'], name='predictionrecord_business_date_idx'),
        ),
        migrations.AddIndex(
            model_name='productconfidence',
            index=models.Index(fields=['business', 'product'], name='productconfidence_business_product_idx'),
        ),
    ]

