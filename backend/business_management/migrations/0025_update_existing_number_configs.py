# Generated manually

from django.db import migrations

def update_existing_number_configs(apps, schema_editor):
    """
    Update existing NumberConfig records to use new config types.
    Convert 'invoice' config_type to 'manufacturer_invoice' for manufacturer businesses
    and 'customer_invoice' for customer businesses.
    """
    NumberConfig = apps.get_model('business_management', 'NumberConfig')
    Business = apps.get_model('business', 'Business')
    
    # Get all existing invoice configs
    invoice_configs = NumberConfig.objects.filter(config_type='invoice')
    
    for config in invoice_configs:
        business = config.business
        
        # Determine if this is a manufacturer or customer business
        if hasattr(business, 'manufacturer') and business.manufacturer:
            # This is a manufacturer business, convert to manufacturer_invoice
            config.config_type = 'manufacturer_invoice'
            if not config.prefix:
                config.prefix = 'MFG-INV'
        else:
            # This is a customer business, convert to customer_invoice
            config.config_type = 'customer_invoice'
            if not config.prefix:
                config.prefix = 'CUST-INV'
        
        config.save()

def reverse_update_existing_number_configs(apps, schema_editor):
    """
    Reverse the migration by converting back to 'invoice' config_type.
    """
    NumberConfig = apps.get_model('business_management', 'NumberConfig')
    
    # Convert all manufacturer_invoice and customer_invoice back to invoice
    NumberConfig.objects.filter(config_type__in=['manufacturer_invoice', 'customer_invoice']).update(
        config_type='invoice'
    )

class Migration(migrations.Migration):

    dependencies = [
        ('business_management', '0024_alter_numberconfig_options_remove_invoice_currency_and_more'),
    ]

    operations = [
        migrations.RunPython(update_existing_number_configs, reverse_update_existing_number_configs),
    ] 