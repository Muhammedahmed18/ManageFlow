"""
Performance Optimization Migration
=================================
Adds performance-related database optimizations.
"""

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('business_management', '0023_database_optimization'),
    ]

    operations = [
        # Add computed fields for better performance
        migrations.AddField(
            model_name='product',
            name='search_vector',
            field=models.TextField(blank=True, null=True),
        ),
        
        # Add denormalized fields for faster queries
        migrations.AddField(
            model_name='order',
            name='total_amount',
            field=models.DecimalField(
                max_digits=12, 
                decimal_places=2, 
                default=0,
                help_text='Cached total amount for performance'
            ),
        ),
        
        migrations.AddField(
            model_name='order',
            name='item_count',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Cached item count for performance'
            ),
        ),
        
        # Add status tracking for better performance
        migrations.AddField(
            model_name='order',
            name='last_status_change',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        
        # Add business metrics caching
        migrations.CreateModel(
            name='BusinessMetrics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='metrics', to='business.business')),
                ('metric_type', models.CharField(max_length=50)),
                ('metric_value', models.JSONField()),
                ('calculated_at', models.DateTimeField(auto_now_add=True)),
                ('valid_until', models.DateTimeField()),
            ],
            options={
                'unique_together': {('business', 'metric_type')},
            },
        ),
    ]

