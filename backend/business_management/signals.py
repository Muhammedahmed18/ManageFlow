"""
Django Signals for Business Management
=====================================

This module contains Django signals to handle automatic cleanup operations
when models are deleted, particularly for file cleanup when user accounts are deleted.
"""

import os
import logging
from django.db.models.signals import pre_delete, post_delete
from django.dispatch import receiver
from django.conf import settings
from authapp.models import User
from business.models import Business
from .models import Product, ProductTemplate, ProductCategory, Order, Invoice

# Set up logging
logger = logging.getLogger(__name__)


@receiver(pre_delete, sender=User)
def delete_user_files(sender, instance, **kwargs):
    """
    Delete all associated files when a user account is deleted.
    
    This signal ensures that when a user account is deleted, all associated
    product images and other files are properly removed from the file system.
    """
    try:
        logger.info(f"Starting file cleanup for user {instance.id} ({instance.username})")
        
        # Get all businesses owned by this user
        owned_businesses = Business.objects.filter(owner=instance)
        logger.info(f"Found {owned_businesses.count()} owned businesses for user {instance.id}")
        
        # Get all businesses where this user is the manufacturer
        manufacturer_businesses = Business.objects.filter(manufacturer=instance)
        logger.info(f"Found {manufacturer_businesses.count()} manufacturer businesses for user {instance.id}")
        
        # Combine all businesses associated with this user
        all_businesses = list(owned_businesses) + list(manufacturer_businesses)
        
        # Delete product images for all associated businesses
        for business in all_businesses:
            delete_business_files(business)
            
        logger.info(f"Completed file cleanup for user {instance.id}")
            
    except Exception as e:
        # Log the error but don't prevent the deletion
        logger.error(f"Error deleting files for user {instance.id}: {str(e)}")


@receiver(pre_delete, sender=Business)
def delete_business_files_signal(sender, instance, **kwargs):
    """
    Delete all associated files when a business is deleted.
    """
    try:
        logger.info(f"Starting file cleanup for business {instance.id} ({instance.name})")
        delete_business_files(instance)
        logger.info(f"Completed file cleanup for business {instance.id}")
    except Exception as e:
        logger.error(f"Error deleting files for business {instance.id}: {str(e)}")


def delete_business_files(business):
    """
    Delete all files associated with a business.
    
    Args:
        business: Business instance
    """
    try:
        # Get all products for this business
        products = Product.objects.filter(business=business)
        logger.info(f"Found {products.count()} products for business {business.id}")
        
        deleted_count = 0
        for product in products:
            # Delete product image if it exists
            if product.image:
                try:
                    # Get the full path to the image file
                    image_path = product.image.path
                    
                    # Check if the file exists before trying to delete it
                    if os.path.exists(image_path):
                        os.remove(image_path)
                        deleted_count += 1
                        logger.info(f"Deleted product image: {image_path}")
                    else:
                        logger.warning(f"Product image file not found: {image_path}")
                        
                except Exception as e:
                    logger.error(f"Error deleting product image for product {product.id}: {str(e)}")
        
        logger.info(f"Deleted {deleted_count} product images for business {business.id}")
                    
    except Exception as e:
        logger.error(f"Error deleting files for business {business.id}: {str(e)}")


@receiver(post_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    """
    Delete the product image file when a product is deleted.
    
    This is a backup signal in case the product is deleted individually
    rather than through business/user deletion.
    """
    if instance.image:
        try:
            # Get the full path to the image file
            image_path = instance.image.path
            
            # Check if the file exists before trying to delete it
            if os.path.exists(image_path):
                os.remove(image_path)
                logger.info(f"Deleted product image: {image_path}")
            else:
                logger.warning(f"Product image file not found: {image_path}")
                
        except Exception as e:
            logger.error(f"Error deleting product image for product {instance.id}: {str(e)}")


# Additional cleanup for other models that might have files in the future
@receiver(pre_delete, sender=ProductTemplate)
def delete_template_files(sender, instance, **kwargs):
    """
    Delete any files associated with product templates when deleted.
    Currently, ProductTemplate doesn't have file fields, but this is here
    for future extensibility.
    """
    try:
        logger.info(f"Cleaning up files for product template {instance.id} ({instance.name})")
        # Add file cleanup logic here if ProductTemplate gets file fields in the future
    except Exception as e:
        logger.error(f"Error cleaning up files for product template {instance.id}: {str(e)}")


@receiver(pre_delete, sender=ProductCategory)
def delete_category_files(sender, instance, **kwargs):
    """
    Delete any files associated with product categories when deleted.
    Currently, ProductCategory doesn't have file fields, but this is here
    for future extensibility.
    """
    try:
        logger.info(f"Cleaning up files for product category {instance.id} ({instance.name})")
        # Add file cleanup logic here if ProductCategory gets file fields in the future
    except Exception as e:
        logger.error(f"Error cleaning up files for product category {instance.id}: {str(e)}")


# Ensure signals are connected when the app is ready
def ready():
    """
    Import signals when the app is ready.
    This function should be called from the app's apps.py file.
    """
    pass 