"""
Input Validation Utilities
==========================
Comprehensive server-side validation for all API endpoints.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

class EmailValidator:
    """
    Enhanced email validation
    """
    @staticmethod
    def validate_email(email):
        if not email:
            raise ValidationError(_('Email is required.'))
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValidationError(_('Enter a valid email address.'))
        
        # Check for common disposable email domains
        disposable_domains = [
            '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
            'tempmail.org', 'throwaway.email', 'temp-mail.org'
        ]
        
        domain = email.split('@')[1].lower()
        if domain in disposable_domains:
            raise ValidationError(_('Disposable email addresses are not allowed.'))
        
        return email

class PasswordValidator:
    """
    Strong password validation
    """
    @staticmethod
    def validate_password(password):
        if not password:
            raise ValidationError(_('Password is required.'))
        
        if len(password) < 8:
            raise ValidationError(_('Password must be at least 8 characters long.'))
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError(_('Password must contain at least one uppercase letter.'))
        
        if not re.search(r'[a-z]', password):
            raise ValidationError(_('Password must contain at least one lowercase letter.'))
        
        if not re.search(r'\d', password):
            raise ValidationError(_('Password must contain at least one digit.'))
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(_('Password must contain at least one special character.'))
        
        return password

class PhoneValidator:
    """
    Phone number validation
    """
    @staticmethod
    def validate_phone(phone):
        if not phone:
            return phone
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Check if it's a valid phone number (10-15 digits)
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValidationError(_('Enter a valid phone number.'))
        
        return phone

class BusinessNameValidator:
    """
    Business name validation
    """
    @staticmethod
    def validate_business_name(name):
        if not name:
            raise ValidationError(_('Business name is required.'))
        
        if len(name.strip()) < 2:
            raise ValidationError(_('Business name must be at least 2 characters long.'))
        
        if len(name.strip()) > 100:
            raise ValidationError(_('Business name cannot exceed 100 characters.'))
        
        # Check for invalid characters
        invalid_chars = re.findall(r'[<>{}[\]\\|]', name)
        if invalid_chars:
            raise ValidationError(_('Business name contains invalid characters.'))
        
        return name.strip()

class ProductNameValidator:
    """
    Product name validation
    """
    @staticmethod
    def validate_product_name(name):
        if not name:
            raise ValidationError(_('Product name is required.'))
        
        if len(name.strip()) < 2:
            raise ValidationError(_('Product name must be at least 2 characters long.'))
        
        if len(name.strip()) > 200:
            raise ValidationError(_('Product name cannot exceed 200 characters.'))
        
        return name.strip()

class PriceValidator:
    """
    Price validation
    """
    @staticmethod
    def validate_price(price):
        if price is None:
            raise ValidationError(_('Price is required.'))
        
        try:
            price_float = float(price)
        except (ValueError, TypeError):
            raise ValidationError(_('Enter a valid price.'))
        
        if price_float < 0:
            raise ValidationError(_('Price cannot be negative.'))
        
        if price_float > 999999.99:
            raise ValidationError(_('Price cannot exceed 999,999.99.'))
        
        return round(price_float, 2)

class QuantityValidator:
    """
    Quantity validation
    """
    @staticmethod
    def validate_quantity(quantity):
        if quantity is None:
            raise ValidationError(_('Quantity is required.'))
        
        try:
            quantity_int = int(quantity)
        except (ValueError, TypeError):
            raise ValidationError(_('Enter a valid quantity.'))
        
        if quantity_int < 1:
            raise ValidationError(_('Quantity must be at least 1.'))
        
        if quantity_int > 999999:
            raise ValidationError(_('Quantity cannot exceed 999,999.'))
        
        return quantity_int

class FileValidator:
    """
    File upload validation
    """
    @staticmethod
    def validate_file_size(file, max_size_mb=10):
        if file.size > max_size_mb * 1024 * 1024:
            raise ValidationError(_(f'File size cannot exceed {max_size_mb}MB.'))
        return file
    
    @staticmethod
    def validate_file_type(file, allowed_types):
        import os
        file_extension = os.path.splitext(file.name)[1].lower()
        if file_extension not in allowed_types:
            raise ValidationError(_(f'File type not allowed. Allowed types: {", ".join(allowed_types)}'))
        return file

class AddressValidator:
    """
    Address validation
    """
    @staticmethod
    def validate_address(address):
        if not address:
            return address
        
        if len(address.strip()) < 10:
            raise ValidationError(_('Address must be at least 10 characters long.'))
        
        if len(address.strip()) > 500:
            raise ValidationError(_('Address cannot exceed 500 characters.'))
        
        return address.strip()

class SerializerValidatorMixin:
    """
    Mixin for adding validation methods to serializers
    """
    def validate_email(self, value):
        return EmailValidator.validate_email(value)
    
    def validate_password(self, value):
        return PasswordValidator.validate_password(value)
    
    def validate_phone(self, value):
        return PhoneValidator.validate_phone(value)
    
    def validate_business_name(self, value):
        return BusinessNameValidator.validate_business_name(value)
    
    def validate_product_name(self, value):
        return ProductNameValidator.validate_product_name(value)
    
    def validate_price(self, value):
        return PriceValidator.validate_price(value)
    
    def validate_quantity(self, value):
        return QuantityValidator.validate_quantity(value)
    
    def validate_address(self, value):
        return AddressValidator.validate_address(value)

